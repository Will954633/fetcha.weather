"""
Fetcha Weather - Usage Tracking Model (SQLAlchemy ORM)
Version: v2.0 • Updated: 2025-01-11 20:57 AEST (Brisbane)
Converted from SQLite3 to SQLAlchemy ORM for PostgreSQL compatibility
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy import func, and_, or_
from calendar import monthrange

# Import db from __init__.py will be handled at runtime to avoid circular imports
from . import db


class Usage(db.Model):
    """Usage tracking model for monitoring API requests"""
    
    __tablename__ = 'usage'
    
    # Columns
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    api_key_id = db.Column(db.Integer, db.ForeignKey('api_keys.id', ondelete='CASCADE'), nullable=False, index=True)
    endpoint = db.Column(db.Text, nullable=False)
    location = db.Column(db.Text, nullable=True)
    state = db.Column(db.Text, nullable=True)
    date_from = db.Column(db.Text, nullable=True)
    date_to = db.Column(db.Text, nullable=True)
    response_time_ms = db.Column(db.Integer, nullable=True)
    status_code = db.Column(db.Integer, nullable=False)
    error_message = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def to_dict(self):
        """Convert usage log to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'api_key_id': self.api_key_id,
            'endpoint': self.endpoint,
            'location': self.location,
            'state': self.state,
            'date_from': self.date_from,
            'date_to': self.date_to,
            'response_time_ms': self.response_time_ms,
            'status_code': self.status_code,
            'error_message': self.error_message,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
    
    @staticmethod
    def _get_current_month() -> str:
        """Get current month in YYYY-MM format"""
        return datetime.utcnow().strftime('%Y-%m')
    
    @staticmethod
    def log_request(user_id: int, api_key_id: int, endpoint: str,
                   location: Optional[str] = None, state: Optional[str] = None,
                   date_from: Optional[str] = None, date_to: Optional[str] = None,
                   response_time_ms: Optional[int] = None, status_code: int = 200,
                   error_message: Optional[str] = None, ip_address: Optional[str] = None,
                   user_agent: Optional[str] = None) -> Dict[str, Any]:
        """
        Log an API request
        
        Args:
            user_id: User ID
            api_key_id: API Key ID
            endpoint: API endpoint called
            location: Location queried (optional)
            state: State queried (optional)
            date_from: Start date of query (optional)
            date_to: End date of query (optional)
            response_time_ms: Response time in milliseconds (optional)
            status_code: HTTP status code (default 200)
            error_message: Error message if failed (optional)
            ip_address: Client IP address (optional)
            user_agent: Client user agent (optional)
            
        Returns:
            Dict with success status
        """
        try:
            # Log individual request
            usage_log = Usage(
                user_id=user_id,
                api_key_id=api_key_id,
                endpoint=endpoint,
                location=location,
                state=state,
                date_from=date_from,
                date_to=date_to,
                response_time_ms=response_time_ms,
                status_code=status_code,
                error_message=error_message,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            db.session.add(usage_log)
            db.session.flush()  # Get the ID
            
            # Update monthly summary
            current_month = Usage._get_current_month()
            success = 1 if status_code == 200 else 0
            failure = 0 if status_code == 200 else 1
            
            monthly_usage = MonthlyUsage.query.filter_by(
                user_id=user_id,
                month=current_month
            ).first()
            
            if monthly_usage:
                monthly_usage.total_requests += 1
                monthly_usage.successful_requests += success
                monthly_usage.failed_requests += failure
                monthly_usage.total_response_time_ms += (response_time_ms or 0)
                monthly_usage.last_updated = datetime.utcnow()
            else:
                monthly_usage = MonthlyUsage(
                    user_id=user_id,
                    month=current_month,
                    total_requests=1,
                    successful_requests=success,
                    failed_requests=failure,
                    total_response_time_ms=(response_time_ms or 0)
                )
                db.session.add(monthly_usage)
            
            db.session.commit()
            
            return {
                'success': True,
                'log_id': usage_log.id
            }
            
        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def get_monthly_usage(user_id: int, month: Optional[str] = None) -> Dict[str, Any]:
        """
        Get monthly usage summary for a user
        
        Args:
            user_id: User ID
            month: Month in YYYY-MM format (defaults to current month)
            
        Returns:
            Dict with usage data
        """
        if month is None:
            month = Usage._get_current_month()
        
        try:
            monthly_usage = MonthlyUsage.query.filter_by(
                user_id=user_id,
                month=month
            ).first()
            
            if not monthly_usage:
                # No usage for this month
                return {
                    'month': month,
                    'total_requests': 0,
                    'successful_requests': 0,
                    'failed_requests': 0,
                    'average_response_time_ms': 0
                }
            
            # Calculate average response time
            avg_response_time = 0
            if monthly_usage.total_requests > 0:
                avg_response_time = (
                    monthly_usage.total_response_time_ms / monthly_usage.total_requests
                )
            
            return {
                'month': monthly_usage.month,
                'total_requests': monthly_usage.total_requests,
                'successful_requests': monthly_usage.successful_requests,
                'failed_requests': monthly_usage.failed_requests,
                'average_response_time_ms': avg_response_time,
                'total_response_time_ms': monthly_usage.total_response_time_ms,
                'last_updated': monthly_usage.last_updated.isoformat() if monthly_usage.last_updated else None
            }
            
        except Exception as e:
            return {
                'month': month,
                'total_requests': 0,
                'successful_requests': 0,
                'failed_requests': 0,
                'average_response_time_ms': 0,
                'error': str(e)
            }
    
    @staticmethod
    def check_quota(user_id: int, tier: str, quota_limit: int) -> Dict[str, Any]:
        """
        Check if user has exceeded their monthly quota
        
        Args:
            user_id: User ID
            tier: User tier (free, pro, enterprise)
            quota_limit: Monthly quota limit (-1 for unlimited)
            
        Returns:
            Dict with quota status
        """
        # Enterprise tier has unlimited quota
        if quota_limit == -1:
            return {
                'within_quota': True,
                'requests_used': 0,
                'requests_remaining': -1,
                'quota_limit': -1,
                'percentage_used': 0
            }
        
        usage = Usage.get_monthly_usage(user_id)
        requests_used = usage['total_requests']
        requests_remaining = max(0, quota_limit - requests_used)
        percentage_used = (requests_used / quota_limit * 100) if quota_limit > 0 else 0
        
        return {
            'within_quota': requests_used < quota_limit,
            'requests_used': requests_used,
            'requests_remaining': requests_remaining,
            'quota_limit': quota_limit,
            'percentage_used': round(percentage_used, 2)
        }
    
    @staticmethod
    def get_recent_requests(user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get recent API requests for a user
        
        Args:
            user_id: User ID
            limit: Number of requests to return (default 10)
            
        Returns:
            List of recent requests
        """
        try:
            usage_logs = Usage.query.filter_by(user_id=user_id)\
                .order_by(Usage.timestamp.desc())\
                .limit(limit)\
                .all()
            
            return [log.to_dict() for log in usage_logs]
            
        except Exception as e:
            return []
    
    @staticmethod
    def get_usage_stats(user_id: int, start_date: Optional[str] = None,
                       end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Get detailed usage statistics for a date range
        
        Args:
            user_id: User ID
            start_date: Start date (YYYY-MM-DD format, optional)
            end_date: End date (YYYY-MM-DD format, optional)
            
        Returns:
            Dict with usage statistics
        """
        try:
            query = db.session.query(
                func.count(Usage.id).label('total_requests'),
                func.sum(func.case((Usage.status_code == 200, 1), else_=0)).label('successful_requests'),
                func.sum(func.case((Usage.status_code != 200, 1), else_=0)).label('failed_requests'),
                func.avg(Usage.response_time_ms).label('avg_response_time'),
                func.max(Usage.response_time_ms).label('max_response_time'),
                func.min(Usage.response_time_ms).label('min_response_time')
            ).filter(Usage.user_id == user_id)
            
            if start_date and end_date:
                query = query.filter(
                    func.date(Usage.timestamp).between(start_date, end_date)
                )
            
            result = query.first()
            
            total = result.total_requests or 0
            successful = result.successful_requests or 0
            
            stats = {
                'total_requests': total,
                'successful_requests': successful,
                'failed_requests': result.failed_requests or 0,
                'avg_response_time': float(result.avg_response_time) if result.avg_response_time else 0,
                'max_response_time': result.max_response_time or 0,
                'min_response_time': result.min_response_time or 0,
                'success_rate': (successful / total * 100) if total > 0 else 0
            }
            
            return stats
            
        except Exception as e:
            return {
                'total_requests': 0,
                'successful_requests': 0,
                'failed_requests': 0,
                'avg_response_time': 0,
                'max_response_time': 0,
                'min_response_time': 0,
                'success_rate': 0,
                'error': str(e)
            }
    
    @staticmethod
    def get_endpoint_breakdown(user_id: int, month: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get breakdown of requests by endpoint
        
        Args:
            user_id: User ID
            month: Month in YYYY-MM format (optional)
            
        Returns:
            List of endpoint usage statistics
        """
        if month is None:
            month = Usage._get_current_month()
        
        try:
            # Parse month to get start and end dates
            year, month_num = map(int, month.split('-'))
            start_date = f"{year}-{month_num:02d}-01"
            last_day = monthrange(year, month_num)[1]
            end_date = f"{year}-{month_num:02d}-{last_day}"
            
            results = db.session.query(
                Usage.endpoint,
                func.count(Usage.id).label('request_count'),
                func.sum(func.case((Usage.status_code == 200, 1), else_=0)).label('successful_count'),
                func.avg(Usage.response_time_ms).label('avg_response_time')
            ).filter(
                Usage.user_id == user_id,
                func.date(Usage.timestamp).between(start_date, end_date)
            ).group_by(Usage.endpoint)\
             .order_by(func.count(Usage.id).desc())\
             .all()
            
            breakdown = []
            for row in results:
                breakdown.append({
                    'endpoint': row.endpoint,
                    'request_count': row.request_count,
                    'successful_count': row.successful_count,
                    'avg_response_time': float(row.avg_response_time) if row.avg_response_time else 0
                })
            
            return breakdown
            
        except Exception as e:
            return []
    
    @staticmethod
    def get_daily_usage(user_id: int, month: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get daily usage breakdown for a month
        
        Args:
            user_id: User ID
            month: Month in YYYY-MM format (defaults to current month)
            
        Returns:
            List of daily usage data
        """
        if month is None:
            month = Usage._get_current_month()
        
        try:
            # Parse month to get start and end dates
            year, month_num = map(int, month.split('-'))
            start_date = f"{year}-{month_num:02d}-01"
            last_day = monthrange(year, month_num)[1]
            end_date = f"{year}-{month_num:02d}-{last_day}"
            
            results = db.session.query(
                func.date(Usage.timestamp).label('date'),
                func.count(Usage.id).label('request_count'),
                func.sum(func.case((Usage.status_code == 200, 1), else_=0)).label('successful_count'),
                func.avg(Usage.response_time_ms).label('avg_response_time')
            ).filter(
                Usage.user_id == user_id,
                func.date(Usage.timestamp).between(start_date, end_date)
            ).group_by(func.date(Usage.timestamp))\
             .order_by(func.date(Usage.timestamp))\
             .all()
            
            daily_data = []
            for row in results:
                daily_data.append({
                    'date': str(row.date),
                    'request_count': row.request_count,
                    'successful_count': row.successful_count,
                    'avg_response_time': float(row.avg_response_time) if row.avg_response_time else 0
                })
            
            return daily_data
            
        except Exception as e:
            return []
    
    @staticmethod
    def delete_old_logs(days_to_keep: int = 90) -> Dict[str, Any]:
        """
        Delete usage logs older than specified days
        
        Args:
            days_to_keep: Number of days to keep (default 90)
            
        Returns:
            Dict with deletion result
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
            
            deleted_count = Usage.query.filter(
                Usage.timestamp < cutoff_date
            ).delete()
            
            db.session.commit()
            
            return {
                'success': True,
                'deleted_count': deleted_count
            }
            
        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'error': str(e)
            }


class MonthlyUsage(db.Model):
    """Monthly usage summary model"""
    
    __tablename__ = 'monthly_usage'
    
    # Columns
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    month = db.Column(db.String(7), nullable=False)  # YYYY-MM format
    total_requests = db.Column(db.Integer, default=0, nullable=False)
    successful_requests = db.Column(db.Integer, default=0, nullable=False)
    failed_requests = db.Column(db.Integer, default=0, nullable=False)
    total_response_time_ms = db.Column(db.BigInteger, default=0, nullable=False)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('user_id', 'month', name='uq_user_month'),
    )
    
    def to_dict(self):
        """Convert monthly usage to dictionary"""
        avg_response_time = 0
        if self.total_requests > 0:
            avg_response_time = self.total_response_time_ms / self.total_requests
        
        return {
            'id': self.id,
            'user_id': self.user_id,
            'month': self.month,
            'total_requests': self.total_requests,
            'successful_requests': self.successful_requests,
            'failed_requests': self.failed_requests,
            'average_response_time_ms': avg_response_time,
            'total_response_time_ms': self.total_response_time_ms,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }
