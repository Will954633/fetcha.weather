"""
Fetcha Weather - Authentication Routes
Version: v1.0 • Updated: 2025-10-28 19:17 AEST (Brisbane)
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from email_validator import validate_email, EmailNotValidError
from models.user import User
from services.email_service import EmailService
from config import get_config
import re

auth_bp = Blueprint('auth', __name__)

# Get database path from config
config = get_config()
DB_PATH = config.DATABASE_PATH


def validate_password(password):
    """
    Validate password strength
    
    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    
    Args:
        password: Password string to validate
        
    Returns:
        tuple: (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    return True, None


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """
    User registration endpoint
    
    Request body:
    {
        "email": "user@example.com",
        "password": "SecurePassword123",
        "full_name": "John Doe"
    }
    
    Returns:
        JSON response with user data and verification token
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not all(k in data for k in ('email', 'password', 'full_name')):
            return jsonify({
                'success': False,
                'error': 'Missing required fields: email, password, full_name'
            }), 400
        
        email = data['email'].strip()
        password = data['password']
        full_name = data['full_name'].strip()
        
        # Validate email
        try:
            validated = validate_email(email, check_deliverability=False)
            email = validated.email
        except EmailNotValidError as e:
            return jsonify({
                'success': False,
                'error': f'Invalid email address: {str(e)}'
            }), 400
        
        # Validate password
        is_valid, error_msg = validate_password(password)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': error_msg
            }), 400
        
        # Validate full name
        if len(full_name) < 2:
            return jsonify({
                'success': False,
                'error': 'Full name must be at least 2 characters'
            }), 400
        
        # Create user
        user_model = User(DB_PATH)
        result = user_model.create(email, password, full_name)
        
        if not result['success']:
            return jsonify(result), 400
        
        # Log the event
        current_app.logger.info(f'New user registered: {email}')
        
        # Try to send verification email (with timeout protection)
        try:
            email_service = EmailService(current_app.config)
            email_result = email_service.send_verification_email(
                to_email=email,
                verification_token=result['verification_token'],
                user_name=full_name
            )
            
            if not email_result['success']:
                current_app.logger.error(f'Failed to send verification email to {email}: {email_result.get("error")}')
                # Still return success for user creation, but note email issue
                return jsonify({
                    'success': True,
                    'message': 'Account created successfully! Email verification is temporarily unavailable.',
                    'user': result['user'],
                    'email_sent': False,
                    'verification_token': result['verification_token']  # Include token for manual verification
                }), 201
        except Exception as email_error:
            current_app.logger.error(f'Email service error for {email}: {str(email_error)}')
            # Return success anyway - email is not critical for signup
            return jsonify({
                'success': True,
                'message': 'Account created successfully! Email verification is temporarily unavailable.',
                'user': result['user'],
                'email_sent': False,
                'verification_token': result['verification_token']  # Include token for manual verification  
            }), 201
        
        return jsonify({
            'success': True,
            'message': 'User created successfully. Please check your email to verify your account.',
            'user': result['user'],
            'email_sent': True
        }), 201
        
    except Exception as e:
        current_app.logger.error(f'Signup error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'An error occurred during registration'
        }), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    User login endpoint
    
    Request body:
    {
        "email": "user@example.com",
        "password": "SecurePassword123"
    }
    
    Returns:
        JSON response with JWT tokens and user data
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not all(k in data for k in ('email', 'password')):
            return jsonify({
                'success': False,
                'error': 'Missing required fields: email, password'
            }), 400
        
        email = data['email'].strip()
        password = data['password']
        
        # Authenticate user
        user_model = User(DB_PATH)
        result = user_model.authenticate(email, password)
        
        if not result['success']:
            current_app.logger.warning(f'Failed login attempt for: {email}')
            return jsonify(result), 401
        
        user = result['user']
        
        # Create JWT tokens
        access_token = create_access_token(identity=user['id'])
        refresh_token = create_refresh_token(identity=user['id'])
        
        current_app.logger.info(f'User logged in: {email}')
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Login error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'An error occurred during login'
        }), 500


@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    """
    Email verification endpoint
    
    Request body:
    {
        "token": "verification_token_here"
    }
    
    Returns:
        JSON response with verification status
    """
    try:
        data = request.get_json()
        
        if not data or 'token' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: token'
            }), 400
        
        token = data['token']
        
        # Verify email
        user_model = User(DB_PATH)
        result = user_model.verify_email(token)
        
        if result['success']:
            current_app.logger.info(f'Email verified for user ID: {result["user"]["id"]}')
        
        return jsonify(result), 200 if result['success'] else 400
        
    except Exception as e:
        current_app.logger.error(f'Email verification error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'An error occurred during email verification'
        }), 500


@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    """
    Resend verification email
    
    Request body:
    {
        "email": "user@example.com"
    }
    
    Returns:
        JSON response with new verification token
    """
    try:
        data = request.get_json()
        
        if not data or 'email' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: email'
            }), 400
        
        email = data['email'].strip()
        
        # Resend verification
        user_model = User(DB_PATH)
        result = user_model.resend_verification(email)
        
        if result['success']:
            current_app.logger.info(f'Verification email resent to: {email}')
            
            # Send verification email
            email_service = EmailService(current_app.config)
            email_result = email_service.send_verification_email(
                to_email=email,
                verification_token=result['verification_token'],
                user_name=result.get('user', {}).get('full_name')
            )
            
            if not email_result['success']:
                current_app.logger.error(f'Failed to send verification email to {email}: {email_result.get("error")}')
                return jsonify({
                    'success': False,
                    'error': 'Failed to send verification email. Please try again later.'
                }), 500
            
            return jsonify({
                'success': True,
                'message': 'Verification email sent. Please check your inbox.',
                'email_sent': True
            }), 200
        else:
            return jsonify(result), 400
        
    except Exception as e:
        current_app.logger.error(f'Resend verification error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'An error occurred while resending verification email'
        }), 500


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """
    Request password reset
    
    Request body:
    {
        "email": "user@example.com"
    }
    
    Returns:
        JSON response with reset token
    """
    try:
        data = request.get_json()
        
        if not data or 'email' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: email'
            }), 400
        
        email = data['email'].strip()
        
        # Request password reset
        user_model = User(DB_PATH)
        result = user_model.request_password_reset(email)
        
        # Always return success to prevent email enumeration
        if 'reset_token' in result:
            current_app.logger.info(f'Password reset requested for: {email}')
            
            # Send password reset email
            email_service = EmailService(current_app.config)
            email_result = email_service.send_password_reset_email(
                to_email=email,
                reset_token=result['reset_token'],
                user_name=result.get('user', {}).get('full_name')
            )
            
            if not email_result['success']:
                current_app.logger.error(f'Failed to send password reset email to {email}: {email_result.get("error")}')
        
        # Always return the same message to prevent email enumeration
        return jsonify({
            'success': True,
            'message': 'If the email exists, a password reset link has been sent.'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Forgot password error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'An error occurred while processing your request'
        }), 500


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """
    Reset password with token
    
    Request body:
    {
        "token": "reset_token_here",
        "new_password": "NewSecurePassword123"
    }
    
    Returns:
        JSON response with reset status
    """
    try:
        data = request.get_json()
        
        if not data or not all(k in data for k in ('token', 'new_password')):
            return jsonify({
                'success': False,
                'error': 'Missing required fields: token, new_password'
            }), 400
        
        token = data['token']
        new_password = data['new_password']
        
        # Validate new password
        is_valid, error_msg = validate_password(new_password)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': error_msg
            }), 400
        
        # Reset password
        user_model = User(DB_PATH)
        result = user_model.reset_password(token, new_password)
        
        if result['success']:
            current_app.logger.info('Password reset successfully')
        
        return jsonify(result), 200 if result['success'] else 400
        
    except Exception as e:
        current_app.logger.error(f'Reset password error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'An error occurred while resetting password'
        }), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get current authenticated user
    
    Requires: JWT token in Authorization header
    
    Returns:
        JSON response with user data
    """
    try:
        user_id = get_jwt_identity()
        
        user_model = User(DB_PATH)
        user = user_model.get_by_id(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'user': user
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Get current user error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'An error occurred while fetching user data'
        }), 500


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh access token
    
    Requires: Refresh token in Authorization header
    
    Returns:
        JSON response with new access token
    """
    try:
        user_id = get_jwt_identity()
        access_token = create_access_token(identity=user_id)
        
        return jsonify({
            'success': True,
            'access_token': access_token
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Token refresh error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'An error occurred while refreshing token'
        }), 500
