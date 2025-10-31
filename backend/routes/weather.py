"""
Fetcha Weather - Weather API Routes
Version: v1.1 • Updated: 2025-10-28 19:23 AEST (Brisbane)

Integrates with BOM Weather Service for real Australian weather data
"""

from flask import Blueprint, request, jsonify, current_app
from models.api_key import APIKey
from models.usage import Usage
from models.user import User
from config import get_config
from services.bom_weather_service import get_weather_service
from datetime import datetime
import time

weather_bp = Blueprint('weather', __name__)

# Get database path from config
config = get_config()
DB_PATH = config.DATABASE_PATH


def validate_api_key_header():
    """
    Validate API key from request header
    
    Returns:
        tuple: (is_valid, api_key_data or error_message)
    """
    api_key_value = request.headers.get('X-API-Key') or request.headers.get('Authorization', '').replace('Bearer ', '')
    
    if not api_key_value:
        return False, {'success': False, 'error': 'Missing API key. Provide via X-API-Key header or Authorization: Bearer header'}
    
    api_key_model = APIKey(DB_PATH)
    result = api_key_model.validate(api_key_value)
    
    if not result['success']:
        return False, result
    
    return True, result['api_key']


@weather_bp.route('/test', methods=['GET'])
def test_endpoint():
    """
    Test endpoint (no authentication required)
    
    Returns:
        JSON response with API status
    """
    return jsonify({
        'success': True,
        'message': 'Weather API is running',
        'version': '1.0.0',
        'status': 'stub_implementation',
        'note': 'Full BOM API integration coming in next phase'
    }), 200


@weather_bp.route('/location', methods=['GET'])
def get_weather_by_location():
    """
    Get weather data for a location
    
    Requires: API key in X-API-Key header or Authorization: Bearer header
    
    Query parameters:
    - location: Location name (e.g., "Launceston", "Melbourne")
    - state: State name (e.g., "Tasmania", "Victoria") or code (e.g., "TAS", "VIC")
    - date_from: Start date (YYYY-MM-DD) - optional, defaults to today
    - date_to: End date (YYYY-MM-DD) - optional, defaults to date_from
    
    Returns:
        JSON response with real BOM weather data
    """
    start_time = time.time()
    
    # Validate API key
    is_valid, api_key_or_error = validate_api_key_header()
    if not is_valid:
        return jsonify(api_key_or_error), 401
    
    api_key_data = api_key_or_error
    user_id = api_key_data['user_id']
    
    # Get user and check quota
    user_model = User(DB_PATH)
    user = user_model.get_by_id(user_id)
    tier_config = config.TIERS.get(user['tier'], config.TIERS['free'])
    
    usage_model = Usage(DB_PATH)
    quota_status = usage_model.check_quota(user_id, user['tier'], tier_config['monthly_quota'])
    
    if not quota_status['within_quota']:
        return jsonify({
            'success': False,
            'error': 'Monthly quota exceeded',
            'quota': quota_status
        }), 429
    
    # Get query parameters
    location = request.args.get('location')
    state = request.args.get('state')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    if not location or not state:
        return jsonify({
            'success': False,
            'error': 'Missing required parameters: location and state',
            'example': '/api/weather/location?location=Melbourne&state=Victoria&date_from=2025-01-01&date_to=2025-01-07'
        }), 400
    
    # Normalize state name (convert code to full name if needed)
    state = _normalize_state_name(state)
    
    # Set default dates if not provided
    if not date_from:
        date_from = datetime.now().strftime("%Y-%m-%d")
    if not date_to:
        date_to = date_from
    
    # Get weather service and fetch data
    weather_service = get_weather_service()
    
    try:
        weather_result = weather_service.get_weather_data(
            location=location,
            state=state,
            date_from=date_from,
            date_to=date_to
        )
        
        # Calculate response time
        response_time_ms = int((time.time() - start_time) * 1000)
        
        # Determine status code
        status_code = 200 if weather_result['success'] else 400
        
        # Log the request
        usage_model.log_request(
            user_id=user_id,
            api_key_id=api_key_data['id'],
            endpoint='/api/weather/location',
            location=location,
            state=state,
            date_from=date_from,
            date_to=date_to,
            response_time_ms=response_time_ms,
            status_code=status_code,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        current_app.logger.info(
            f'Weather request: location={location}, state={state}, '
            f'user_id={user_id}, success={weather_result["success"]}, '
            f'time={response_time_ms}ms'
        )
        
        if weather_result['success']:
            return jsonify({
                'success': True,
                'location': weather_result['location'],
                'station_id': weather_result.get('station_id'),
                'data': weather_result['data'],
                'metadata': weather_result['metadata'],
                'cached': weather_result.get('cached', False),
                'meta': {
                    'response_time_ms': response_time_ms,
                    'quota_remaining': quota_status['requests_remaining'],
                    'quota_used': quota_status['requests_used'],
                    'tier': user['tier']
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': weather_result.get('error', 'Failed to fetch weather data'),
                'location': f"{location}, {state}",
                'meta': {
                    'response_time_ms': response_time_ms,
                    'quota_remaining': quota_status['requests_remaining'],
                    'quota_used': quota_status['requests_used']
                }
            }), status_code
            
    except Exception as e:
        current_app.logger.error(f'Weather request exception: {str(e)}')
        response_time_ms = int((time.time() - start_time) * 1000)
        
        # Still log failed request
        usage_model.log_request(
            user_id=user_id,
            api_key_id=api_key_data['id'],
            endpoint='/api/weather/location',
            location=location,
            state=state,
            date_from=date_from,
            date_to=date_to,
            response_time_ms=response_time_ms,
            status_code=500,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}',
            'meta': {
                'response_time_ms': response_time_ms
            }
        }), 500


@weather_bp.route('/states', methods=['GET'])
def get_available_states():
    """
    Get list of available Australian states
    
    Returns:
        JSON response with available states and BOM codes
    """
    weather_service = get_weather_service()
    states = weather_service.get_available_states()
    
    return jsonify({
        'success': True,
        'states': states,
        'note': 'All states supported with 93.3% location coverage across Australia'
    }), 200


@weather_bp.route('/cache/stats', methods=['GET'])
def get_cache_stats():
    """
    Get cache statistics (admin/monitoring endpoint)
    
    Returns:
        JSON response with cache statistics
    """
    weather_service = get_weather_service()
    stats = weather_service.get_cache_stats()
    
    return jsonify({
        'success': True,
        'cache': stats
    }), 200


@weather_bp.route('/cache/clear', methods=['POST'])
def clear_cache():
    """
    Clear the weather data cache (admin endpoint)
    
    Returns:
        JSON response confirming cache clear
    """
    weather_service = get_weather_service()
    result = weather_service.clear_cache()
    
    return jsonify(result), 200


def _normalize_state_name(state: str) -> str:
    """Normalize state code to full state name"""
    state_upper = state.upper().strip()
    
    state_mapping = {
        'QLD': 'Queensland',
        'NSW': 'New South Wales',
        'VIC': 'Victoria',
        'WA': 'Western Australia',
        'SA': 'South Australia',
        'TAS': 'Tasmania',
        'NT': 'Northern Territory',
        'ACT': 'Australian Capital Territory'
    }
    
    # Return full name if code provided, otherwise return as-is
    return state_mapping.get(state_upper, state)
