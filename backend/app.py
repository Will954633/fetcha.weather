"""
Fetcha Weather - Main Flask Application
Version: v1.0 • Updated: 2025-11-01 19:38 AEST (Brisbane)
Force redeploy to fix /api/auth/me 404 issue
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import datetime
import os
import logging
from logging.handlers import RotatingFileHandler

from config import get_config
from models import db


def create_app(config_name=None):
    """
    Application factory pattern
    
    Args:
        config_name: Configuration to use (development, production, testing)
        
    Returns:
        Configured Flask application
    """
    app = Flask(__name__)
    
    # Disable strict slashes to prevent redirects that break CORS preflight
    app.url_map.strict_slashes = False
    
    # Determine config name from environment if not provided
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    # Load configuration
    config = get_config(config_name)
    app.config.from_object(config)
    
    # Debug: Log CORS origins and database URI
    print(f"DEBUG: CORS_ORIGINS = {config.CORS_ORIGINS}")
    print(f"DEBUG: CORS_ORIGINS type = {type(config.CORS_ORIGINS)}")
    print(f"DEBUG: DATABASE_URI = {app.config.get('SQLALCHEMY_DATABASE_URI', 'NOT SET')[:50]}...")  # First 50 chars only for security
    
    # Initialize extensions with explicit CORS configuration
    CORS(app, 
         origins=config.CORS_ORIGINS,
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization', 'X-API-Key'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
         expose_headers=['Content-Type', 'Authorization'],
         max_age=3600)
    jwt = JWTManager(app)
    
    # Initialize SQLAlchemy
    db.init_app(app)
    
    # Setup logging
    setup_logging(app, config)
    
    # Create database tables
    with app.app_context():
        try:
            db.create_all()
            app.logger.info('Database tables created/verified successfully')
        except Exception as e:
            app.logger.error(f'Database initialization failed: {str(e)}')
            raise
    
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
            'version': '1.0.1',
            'description': 'Australian Historical Weather Data API',
            'endpoints': {
                'auth': '/api/auth',
                'keys': '/api/keys',
                'weather': '/api/weather',
                'usage': '/api/usage'
            },
            'documentation': 'https://weather.fetcha.com/docs'
        }), 200
    
    # Debug endpoint to list all routes
    @app.route('/api/routes', methods=['GET'])
    def list_routes():
        """List all registered routes (for debugging)"""
        routes = []
        for rule in app.url_map.iter_rules():
            routes.append({
                'endpoint': rule.endpoint,
                'methods': list(rule.methods),
                'path': str(rule)
            })
        return jsonify({
            'total_routes': len(routes),
            'routes': sorted(routes, key=lambda x: x['path'])
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
    from routes.admin import admin_bp
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(api_keys_bp, url_prefix='/api/keys')
    app.register_blueprint(usage_bp, url_prefix='/api/usage')
    app.register_blueprint(weather_bp, url_prefix='/api/weather')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
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
