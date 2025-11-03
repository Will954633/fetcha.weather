"""
Fetcha Weather - Usage Tracking Routes
Version: v1.0 • Updated: 2025-10-28 19:18 AEST (Brisbane)
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.usage import Usage
from models.user import User
from config import get_config

usage_bp = Blueprint('usage', __name__)

# Get config
config = get_config()


@usage_bp.route('/monthly', methods=['GET'])
@jwt_required()
def get_monthly_usage():
    """
    Get monthly usage summary for authenticated user
    
    Requires: JWT token in Authorization header
    
    Query parameters:
    - month: Month in YYYY-MM format (optional, defaults to current month)
    
    Returns:
        JSON response with monthly usage data
    """
    try:
        user_id = get_jwt_identity()
        month = request.args.get('month')
        
        usage_data = Usage.get_monthly_usage(user_id, month)
        
        # Get user tier for quota calculation
        user = User.get_by_id(user_id)
        tier_config = config.TIERS.get(user['tier'], config.TIERS['free'])
        
        # Check quota status
        quota_status = Usage.check_quota(
            user_id,
            user['tier'],
            tier_config['monthly_quota']
        )
        
        return jsonify({
            'success': True,
            'usage': usage_data,
            'quota': quota_status,
            'tier': user['tier']
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Get monthly usage error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'An error occurred while fetching usage data'
        }), 500


@usage_bp.route('/recent', methods=['GET'])
@jwt_required()
def get_recent_requests():
    """
    Get recent API requests for authenticated user
    
    Requires: JWT token in Authorization header
    
    Query parameters:
    - limit: Number of requests to return (default: 10, max: 100)
    
    Returns:
        JSON response with recent requests
    """
    try:
        user_id = get_jwt_identity()
        limit = min(int(request.args.get('limit', 10)), 100)
        
        requests = Usage.get_recent_requests(user_id, limit)
        
        return jsonify({
            'success': True,
            'requests': requests,
            'total': len(requests)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Get recent requests error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'An error occurred while fetching recent requests'
        }), 500


@usage_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_usage_stats():
    """
    Get detailed usage statistics for authenticated user
    
    Requires: JWT token in Authorization header
    
    Query parameters:
    - start_date: Start date in YYYY-MM-DD format (optional)
    - end_date: End date in YYYY-MM-DD format (optional)
    
    Returns:
        JSON response with usage statistics
    """
    try:
        user_id = get_jwt_identity()
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        stats = Usage.get_usage_stats(user_id, start_date, end_date)
        
        return jsonify({
            'success': True,
            'stats': stats
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Get usage stats error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'An error occurred while fetching usage statistics'
        }), 500


@usage_bp.route('/breakdown', methods=['GET'])
@jwt_required()
def get_endpoint_breakdown():
    """
    Get breakdown of requests by endpoint
    
    Requires: JWT token in Authorization header
    
    Query parameters:
    - month: Month in YYYY-MM format (optional, defaults to current month)
    
    Returns:
        JSON response with endpoint breakdown
    """
    try:
        user_id = get_jwt_identity()
        month = request.args.get('month')
        
        breakdown = Usage.get_endpoint_breakdown(user_id, month)
        
        return jsonify({
            'success': True,
            'breakdown': breakdown
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Get endpoint breakdown error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'An error occurred while fetching endpoint breakdown'
        }), 500


@usage_bp.route('/daily', methods=['GET'])
@jwt_required()
def get_daily_usage():
    """
    Get daily usage breakdown for a month
    
    Requires: JWT token in Authorization header
    
    Query parameters:
    - month: Month in YYYY-MM format (optional, defaults to current month)
    
    Returns:
        JSON response with daily usage data
    """
    try:
        user_id = get_jwt_identity()
        month = request.args.get('month')
        
        daily_data = Usage.get_daily_usage(user_id, month)
        
        return jsonify({
            'success': True,
            'daily_usage': daily_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Get daily usage error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'An error occurred while fetching daily usage'
        }), 500
