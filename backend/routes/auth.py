"""
Fetcha Weather - Authentication Routes
Version: v1.0 • Updated: 2025-10-28 19:17 AEST (Brisbane)
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from email_validator import validate_email, EmailNotValidError
from models import User
from services.email_service import EmailService
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import re
import secrets

auth_bp = Blueprint('auth', __name__)


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
        result = User.create(email, password, full_name)
        
        if not result['success']:
            return jsonify(result), 400
        
        # Create JWT tokens for auto-login
        access_token = create_access_token(identity=result['user']['id'])
        refresh_token = create_refresh_token(identity=result['user']['id'])
        
        # Log the event
        current_app.logger.info(f'New user registered and auto-logged in: {email}')
        
        # Skip email sending for MVP - instant signup!
        # TODO: Re-enable email verification when email service is properly configured
        
        return jsonify({
            'success': True,
            'message': 'Welcome! Redirecting to dashboard...',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': result['user'],
            'email_sent': False,
            'auto_login': True
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
        result = User.authenticate(email, password)
        
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
        result = User.verify_email(token)
        
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
        result = User.resend_verification(email)
        
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
        result = User.request_password_reset(email)
        
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
        result = User.reset_password(token, new_password)
        
        if result['success']:
            current_app.logger.info('Password reset successfully')
        
        return jsonify(result), 200 if result['success'] else 400
        
    except Exception as e:
        current_app.logger.error(f'Reset password error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'An error occurred while resetting password'
        }), 500


@auth_bp.route('/google-login', methods=['POST'])
def google_login():
    """
    Google OAuth login endpoint
    
    Request body:
    {
        "credential": "google_id_token_here"
    }
    
    Returns:
        JSON response with JWT tokens and user data
    """
    try:
        data = request.get_json()
        
        if not data or 'credential' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: credential'
            }), 400
        
        google_token = data['credential']
        
        # Verify Google ID token
        try:
            google_client_id = current_app.config.get('GOOGLE_CLIENT_ID')
            
            if not google_client_id:
                current_app.logger.error('GOOGLE_CLIENT_ID not configured')
                return jsonify({
                    'success': False,
                    'error': 'Google authentication is not properly configured'
                }), 500
            
            # Verify the Google ID token
            idinfo = id_token.verify_oauth2_token(
                google_token, 
                google_requests.Request(), 
                google_client_id
            )
            
            # Get user info from Google token
            email = idinfo.get('email')
            full_name = idinfo.get('name', email.split('@')[0])
            google_id = idinfo.get('sub')
            
            if not email:
                return jsonify({
                    'success': False,
                    'error': 'Could not retrieve email from Google account'
                }), 400
            
            # Check if user exists
            user = User.get_by_email(email)
            
            if user:
                # Convert to dict if it's a model instance
                if hasattr(user, 'to_dict'):
                    user_data = user.to_dict()
                else:
                    user_data = user
                
                # Create JWT tokens
                access_token = create_access_token(identity=user_data['id'])
                refresh_token = create_refresh_token(identity=user_data['id'])
                
                current_app.logger.info(f'User logged in via Google: {email}')
                
                return jsonify({
                    'success': True,
                    'message': 'Login successful',
                    'access_token': access_token,
                    'refresh_token': refresh_token,
                    'user': user_data
                }), 200
            else:
                # Create new user with Google account
                # Generate a random password for Google users (they won't need it)
                random_password = secrets.token_urlsafe(32)
                
                result = User.create(email, random_password, full_name)
                
                if not result['success']:
                    return jsonify(result), 400
                
                # Create JWT tokens
                access_token = create_access_token(identity=result['user']['id'])
                refresh_token = create_refresh_token(identity=result['user']['id'])
                
                current_app.logger.info(f'New user registered via Google: {email}')
                
                return jsonify({
                    'success': True,
                    'message': 'Welcome! Account created successfully',
                    'access_token': access_token,
                    'refresh_token': refresh_token,
                    'user': result['user']
                }), 201
                
        except ValueError as e:
            # Invalid token
            current_app.logger.error(f'Invalid Google token: {str(e)}')
            return jsonify({
                'success': False,
                'error': 'Invalid Google authentication token'
            }), 401
            
    except Exception as e:
        current_app.logger.error(f'Google login error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'An error occurred during Google authentication'
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
        
        user = User.get_by_id(user_id)
        
        # Convert to dict if it's a model instance
        if user and hasattr(user, 'to_dict'):
            user = user.to_dict()
        
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
