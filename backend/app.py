"""
Fetcha Weather - Main Flask Application
Version: v1.0 • Updated: 2025-10-28 19:16 AEST (Brisbane)
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import datetime
import os
import logging
from logging.handlers import RotatingFileHandler

from config import get_config


def create_app(config_name=None):
    """
    Application factory pattern
    
    Args:
        config_name: Configuration to use (development, production, testing)
        
    Returns:
        Configured Flask application
    """
    app = Flask(__name__)
    
    # Load configuration
    config = get_config(config_name)
    app.config.from_object(config)
    
    # Initialize extensions
    CORS(app, origins=config.CORS_ORIGINS, supports_credentials=True)
    jwt = JWTManager(app)
    
    # Setup logging
    setup_logging(app, config)
    
    # Register blueprints
    register_blueprints(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint for monitoring"""
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'version': '1.0.0'
        }), 200
    
    # API info endpoint
    @app.route('/api', methods=['GET'])
    def api_info():
        """API information endpoint"""
        return jsonify({
            'name': 'Fetcha Weather API',
            'version': '1.0.0',
            'description': 'Australian Historical Weather Data API',
            'endpoints': {
                'auth': '/api/auth',
                'keys': '/api/keys',
                'weather': '/api/weather',
                'usage': '/api/usage'
            },
            'documentation': 'https://weather.fetcha.com/docs'
        }), 200
    
    app.logger.info(f'Fetcha Weather API initialized in {config_name or "default"} mode')
    
    return app


def setup_logging(app, config):
    """
    Setup application logging
    
    Args:
        app: Flask application
        config: Configuration object
    """
    # Create logs directory if it doesn't exist
    log_dir = os.path.dirname(config.LOG_FILE)
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # Set log level
    log_level = getattr(logging, config.LOG_LEVEL.upper(), logging.INFO)
    
    # File handler with rotation
    file_handler = RotatingFileHandler(
        config.LOG_FILE,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=10
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
    ))
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(logging.Formatter(
        '%(levelname)s: %(message)s'
    ))
    
    # Add handlers to app logger
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)
    app.logger.setLevel(log_level)
    
    # Disable Flask's default logger in production
    if not app.config['DEBUG']:
        log = logging.getLogger('werkzeug')
        log.setLevel(logging.WARNING)


def register_blueprints(app):
    """
    Register all route blueprints
    
    Args:
        app: Flask application
    """
    # Import blueprints
    from routes.auth import auth_bp
    from routes.api_keys import api_keys_bp
    from routes.usage import usage_bp
    from routes.weather import weather_bp
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(api_keys_bp, url_prefix='/api/keys')
    app.register_blueprint(usage_bp, url_prefix='/api/usage')
    app.register_blueprint(weather_bp, url_prefix='/api/weather')
    
    app.logger.info('All blueprints registered')


def register_error_handlers(app):
    """
    Register error handlers for common HTTP errors
    
    Args:
        app: Flask application
    """
    
    @app.errorhandler(400)
    def bad_request(error):
        """Handle 400 Bad Request"""
        return jsonify({
            'success': False,
            'error': 'Bad Request',
            'message': str(error) if app.config['DEBUG'] else 'Invalid request parameters'
        }), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        """Handle 401 Unauthorized"""
        return jsonify({
            'success': False,
            'error': 'Unauthorized',
            'message': 'Authentication required'
        }), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        """Handle 403 Forbidden"""
        return jsonify({
            'success': False,
            'error': 'Forbidden',
            'message': 'You do not have permission to access this resource'
        }), 403
    
    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 Not Found"""
        return jsonify({
            'success': False,
            'error': 'Not Found',
            'message': 'The requested resource was not found'
        }), 404
    
    @app.errorhandler(429)
    def rate_limit_exceeded(error):
        """Handle 429 Too Many Requests"""
        return jsonify({
            'success': False,
            'error': 'Rate Limit Exceeded',
            'message': 'Too many requests. Please try again later.'
        }), 429
    
    @app.errorhandler(500)
    def internal_server_error(error):
        """Handle 500 Internal Server Error"""
        app.logger.error(f'Internal Server Error: {str(error)}')
        return jsonify({
            'success': False,
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred' if not app.config['DEBUG'] else str(error)
        }), 500
    
    @app.errorhandler(Exception)
    def handle_exception(error):
        """Handle uncaught exceptions"""
        app.logger.error(f'Unhandled Exception: {str(error)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred'
        }), 500


# Create application instance
app = create_app()


if __name__ == '__main__':
    # Run development server
    port = int(os.environ.get('PORT', 5000))
    app.run(
        host='0.0.0.0',
        port=port,
        debug=app.config['DEBUG']
    )
