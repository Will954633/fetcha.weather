"""
Fetcha Weather - Usage Tracking Model
Version: v1.0 • Updated: 2025-10-28 19:04 AEST (Brisbane)
"""

import sqlite3
from datetime import datetime
from typing import Dict, Any, List, Optional
from calendar import monthrange


class Usage:
    """Usage tracking model for monitoring API requests and quotas"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
    
    def _get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute('PRAGMA foreign_keys = ON')
        return conn
    
    @staticmethod
    def _get_current_month() -> str:
        """Get current month in YYYY-MM format"""
        return datetime.now().strftime('%Y-%m')
    
    def log_request(self, user_id: int, api_key_id: int, endpoint: str,
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
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # Log individual request
            cursor.execute('''
                INSERT INTO usage_logs 
                (user_id, api_key_id, endpoint, location, state, date_from, date_to, 
                 response_time_ms, status_code, error_message, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, api_key_id, endpoint, location, state, date_from, date_to,
                  response_time_ms, status_code, error_message, ip_address, user_agent))
            
            log_id = cursor.lastrowid
            
            # Update monthly summary
            current_month = self._get_current_month()
            success = 1 if status_code == 200 else 0
            failure = 0 if status_code == 200 else 1
            
            cursor.execute('''
                INSERT INTO monthly_usage (user_id, month, total_requests, successful_requests, failed_requests, total_response_time_ms)
                VALUES (?, ?, 1, ?, ?, ?)
                ON CONFLICT(user_id, month) DO UPDATE SET
                    total_requests = total_requests + 1,
                    successful_requests = successful_requests + ?,
                    failed_requests = failed_requests + ?,
                    total_response_time_ms = total_response_time_ms + ?,
                    last_updated = CURRENT_TIMESTAMP
            ''', (user_id, current_month, success, failure, response_time_ms or 0,
                  success, failure, response_time_ms or 0))
            
            conn.commit()
            
            return {
                'success': True,
                'log_id': log_id
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            conn.close()
    
    def get_monthly_usage(self, user_id: int, month: Optional[str] = None) -> Dict[str, Any]:
        """
        Get monthly usage summary for a user
        
        Args:
            user_id: User ID
            month: Month in YYYY-MM format (defaults to current month)
            
        Returns:
            Dict with usage data
        """
        if month is None:
            month = self._get_current_month()
        
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                SELECT * FROM monthly_usage 
                WHERE user_id = ? AND month = ?
            ''', (user_id, month))
            
            result = cursor.fetchone()
            
            if not result:
                # No usage for this month
                return {
                    'month': month,
                    'total_requests': 0,
                    'successful_requests': 0,
                    'failed_requests': 0,
                    'average_response_time_ms': 0
                }
            
            usage_data = dict(result)
            
            # Calculate average response time
            if usage_data['total_requests'] > 0:
                usage_data['average_response_time_ms'] = (
                    usage_data['total_response_time_ms'] / usage_data['total_requests']
                )
            else:
                usage_data['average_response_time_ms'] = 0
            
            return usage_data
            
        finally:
            conn.close()
    
    def check_quota(self, user_id: int, tier: str, quota_limit: int) -> Dict[str, Any]:
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
        
        usage = self.get_monthly_usage(user_id)
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
    
    def get_recent_requests(self, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get recent API requests for a user
        
        Args:
            user_id: User ID
            limit: Number of requests to return (default 10)
            
        Returns:
            List of recent requests
        """
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                SELECT * FROM usage_logs 
                WHERE user_id = ? 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (user_id, limit))
            
            requests = [dict(row) for row in cursor.fetchall()]
            return requests
            
        finally:
            conn.close()
    
    def get_usage_stats(self, user_id: int, start_date: Optional[str] = None,
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
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # Build query
            if start_date and end_date:
                query = '''
                    SELECT 
                        COUNT(*) as total_requests,
                        SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END) as successful_requests,
                        SUM(CASE WHEN status_code != 200 THEN 1 ELSE 0 END) as failed_requests,
                        AVG(response_time_ms) as avg_response_time,
                        MAX(response_time_ms) as max_response_time,
                        MIN(response_time_ms) as min_response_time
                    FROM usage_logs
                    WHERE user_id = ? AND DATE(timestamp) BETWEEN ? AND ?
                '''
                cursor.execute(query, (user_id, start_date, end_date))
            else:
                query = '''
                    SELECT 
                        COUNT(*) as total_requests,
                        SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END) as successful_requests,
                        SUM(CASE WHEN status_code != 200 THEN 1 ELSE 0 END) as failed_requests,
                        AVG(response_time_ms) as avg_response_time,
                        MAX(response_time_ms) as max_response_time,
                        MIN(response_time_ms) as min_response_time
                    FROM usage_logs
                    WHERE user_id = ?
                '''
                cursor.execute(query, (user_id,))
            
            result = cursor.fetchone()
            stats = dict(result) if result else {}
            
            # Calculate success rate
            total = stats.get('total_requests', 0)
            successful = stats.get('successful_requests', 0)
            stats['success_rate'] = (successful / total * 100) if total > 0 else 0
            
            return stats
            
        finally:
            conn.close()
    
    def get_endpoint_breakdown(self, user_id: int, month: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get breakdown of requests by endpoint
        
        Args:
            user_id: User ID
            month: Month in YYYY-MM format (optional)
            
        Returns:
            List of endpoint usage statistics
        """
        if month is None:
            month = self._get_current_month()
        
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                SELECT 
                    endpoint,
                    COUNT(*) as request_count,
                    SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END) as successful_count,
                    AVG(response_time_ms) as avg_response_time
                FROM usage_logs
                WHERE user_id = ? AND strftime('%Y-%m', timestamp) = ?
                GROUP BY endpoint
                ORDER BY request_count DESC
            ''', (user_id, month))
            
            breakdown = [dict(row) for row in cursor.fetchall()]
            return breakdown
            
        finally:
            conn.close()
    
    def get_daily_usage(self, user_id: int, month: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get daily usage breakdown for a month
        
        Args:
            user_id: User ID
            month: Month in YYYY-MM format (defaults to current month)
            
        Returns:
            List of daily usage data
        """
        if month is None:
            month = self._get_current_month()
        
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                SELECT 
                    DATE(timestamp) as date,
                    COUNT(*) as request_count,
                    SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END) as successful_count,
                    AVG(response_time_ms) as avg_response_time
                FROM usage_logs
                WHERE user_id = ? AND strftime('%Y-%m', timestamp) = ?
                GROUP BY DATE(timestamp)
                ORDER BY date
            ''', (user_id, month))
            
            daily_data = [dict(row) for row in cursor.fetchall()]
            return daily_data
            
        finally:
            conn.close()
    
    def delete_old_logs(self, days_to_keep: int = 90) -> Dict[str, Any]:
        """
        Delete usage logs older than specified days
        
        Args:
            days_to_keep: Number of days to keep (default 90)
            
        Returns:
            Dict with deletion result
        """
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                DELETE FROM usage_logs 
                WHERE timestamp < datetime('now', '-' || ? || ' days')
            ''', (days_to_keep,))
            
            deleted_count = cursor.rowcount
            conn.commit()
            
            return {
                'success': True,
                'deleted_count': deleted_count
            }
            
        finally:
            conn.close()
