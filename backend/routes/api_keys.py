"""
Fetcha Weather - API Key Management Routes
Version: v1.0 • Updated: 2025-10-28 19:17 AEST (Brisbane)
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.api_key import APIKey
from models.user import User
from config import get_config

api_keys_bp = Blueprint('api_keys', __name__)

# Get database path from config
config = get_config()
DB_PATH = config.DATABASE_PATH


@api_keys_bp.route('/', methods=['GET'])
@jwt_required()
def list_api_keys():
    """
    List all API keys for the authenticated user
    
    Requires: JWT token in Authorization header
    
    Query parameters:
    - include_inactive: Include inactive keys (true/false)
    
    Returns:
        JSON response with list of API keys
    """
    try:
        user_id = get_jwt_identity()
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
        
        api_key_model = APIKey(DB_PATH)
        keys = api_key_model.get_by_user(user_id, include_inactive=include_inactive)
        
        return jsonify({
            'success': True,
            'keys': keys,
            'total': len(keys)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'List API keys error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'An error occurred while fetching API keys'
        }), 500


@api_keys_bp.route('/', methods=['POST'])
@jwt_required()
def create_api_key():
    """
    Create a new API key for the authenticated user
    
    Requires: JWT token in Authorization header
    
    Request body:
    {
        "name": "My API Key" (optional)
    }
    
    Returns:
        JSON response with new API key (key_value only returned once!)
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        
        name = data.get('name', '').strip() if data.get('name') else None
        
        # Check if user has too many active keys (optional limit)
        api_key_model = APIKey(DB_PATH)
        active_count = api_key_model.count_active_keys(user_id)
        
        MAX_KEYS_PER_USER = 10
        if active_count >= MAX_KEYS_PER_USER:
            return jsonify({
                'success': False,
                'error': f'Maximum number of API keys ({MAX_KEYS_PER_USER}) reached. Please delete an existing key first.'
            }), 400
        
        # Create API key
        result = api_key_model.create(user_id, name=name)
        
        if not result['success']:
            return jsonify(result), 400
        
        current_app.logger.info(f'API key created for user ID: {user_id}')
        
        return jsonify({
            'success': True,
            'message': 'API key created successfully. Save it now - it will not be shown again!',
            'api_key': result['api_key'],
            'key_value': result['key_value']  # Only returned once!
        }), 201
        
    except Exception as e:
        current_app.logger.error(f'Create API key error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'An error occurred while creating API key'
        }), 500


@api_keys_bp.route('/<int:key_id>', methods=['GET'])
@jwt_required()
def get_api_key(key_id):
    """
    Get details of a specific API key
    
    Requires: JWT token in Authorization header
    
    Parameters:
    - key_id: API key ID
    
    Returns:
        JSON response with API key details
    """
    try:
        user_id = get_jwt_identity()
        
        api_key_model = APIKey(DB_PATH)
        api_key = api_key_model.get_by_id(key_id)
        
        if not api_key:
            return jsonify({
                'success': False,
                'error': 'API key not found'
            }), 404
        
        # Verify ownership
        if api_key['user_id'] != user_id:
            return jsonify({
                'success': False,
                'error': 'Access denied'
            }), 403
        
        return jsonify({
            'success': True,
            'api_key': api_key
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Get API key error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'An error occurred while fetching API key'
        }), 500


@api_keys_bp.route('/<int:key_id>', methods=['PUT'])
@jwt_required()
def update_api_key(key_id):
    """
    Update API key name
    
    Requires: JWT token in Authorization header
    
    Parameters:
    - key_id: API key ID
    
    Request body:
    {
        "name": "Updated Key Name"
    }
    
    Returns:
        JSON response with updated API key
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'name' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: name'
            }), 400
        
        name = data['name'].strip()
        
        if not name:
            return jsonify({
                'success': False,
                'error': 'Name cannot be empty'
            }), 400
        
        # Update API key name
        api_key_model = APIKey(DB_PATH)
        result = api_key_model.update_name(key_id, user_id, name)
        
        if not result['success']:
            return jsonify(result), 400 if 'not found' in result.get('error', '').lower() else 403
        
        current_app.logger.info(f'API key {key_id} updated for user ID: {user_id}')
        
        return jsonify(result), 200
        
    except Exception as e:
        current_app.logger.error(f'Update API key error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'An error occurred while updating API key'
        }), 500


@api_keys_bp.route('/<int:key_id>/deactivate', methods=['POST'])
@jwt_required()
def deactivate_api_key(key_id):
    """
    Deactivate an API key (soft delete)
    
    Requires: JWT token in Authorization header
    
    Parameters:
    - key_id: API key ID
    
    Returns:
        JSON response with deactivation status
    """
    try:
        user_id = get_jwt_identity()
        
        api_key_model = APIKey(DB_PATH)
        result = api_key_model.deactivate(key_id, user_id)
        
        if not result['success']:
            return jsonify(result), 400 if 'not found' in result.get('error', '').lower() else 403
        
        current_app.logger.info(f'API key {key_id} deactivated for user ID: {user_id}')
        
        return jsonify(result), 200
        
    except Exception as e:
        current_app.logger.error(f'Deactivate API key error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'An error occurred while deactivating API key'
        }), 500


@api_keys_bp.route('/<int:key_id>', methods=['DELETE'])
@jwt_required()
def delete_api_key(key_id):
    """
    Permanently delete an API key
    
    Requires: JWT token in Authorization header
    
    Parameters:
    - key_id: API key ID
    
    Returns:
        JSON response with deletion status
    """
    try:
        user_id = get_jwt_identity()
        
        api_key_model = APIKey(DB_PATH)
        result = api_key_model.delete(key_id, user_id)
        
        if not result['success']:
            return jsonify(result), 400 if 'not found' in result.get('error', '').lower() else 403
        
        current_app.logger.info(f'API key {key_id} deleted for user ID: {user_id}')
        
        return jsonify(result), 200
        
    except Exception as e:
        current_app.logger.error(f'Delete API key error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'An error occurred while deleting API key'
        }), 500


@api_keys_bp.route('/validate', methods=['POST'])
def validate_api_key():
    """
    Validate an API key (public endpoint for testing)
    
    Request body:
    {
        "api_key": "fw_xxxxxxxxxxxxx"
    }
    
    Returns:
        JSON response with validation result
    """
    try:
        data = request.get_json()
        
        if not data or 'api_key' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: api_key'
            }), 400
        
        api_key_value = data['api_key']
        
        api_key_model = APIKey(DB_PATH)
        result = api_key_model.validate(api_key_value)
        
        if not result['success']:
            return jsonify(result), 401
        
        # Get user tier for quota info
        user_model = User(DB_PATH)
        user = user_model.get_by_id(result['api_key']['user_id'])
        
        tier_config = config.TIERS.get(user['tier'], config.TIERS['free'])
        
        return jsonify({
            'success': True,
            'message': 'API key is valid',
            'api_key_id': result['api_key']['id'],
            'user_id': result['api_key']['user_id'],
            'tier': user['tier'],
            'quota': tier_config['monthly_quota'],
            'rate_limit': tier_config['rate_limit']
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Validate API key error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'An error occurred while validating API key'
        }), 500
