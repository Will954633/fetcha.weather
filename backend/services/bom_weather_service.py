"""
BOM Weather Service Wrapper for Fetcha Weather
Version: v1.0 • Updated: 2025-10-28 19:23 AEST (Brisbane)

Wraps the SmartHTMLParsingBOMScraper for use with Flask backend
Provides caching, error handling, and API-friendly response formatting
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging

# Add current directory to path for local imports
sys.path.insert(0, str(Path(__file__).parent))

# Import the proven BOM scraper (now copied to services directory)
from smart_html_parsing_scraper import SmartHTMLParsingBOMScraper

logger = logging.getLogger(__name__)


class BOMWeatherService:
    """Service wrapper for BOM weather data extraction"""
    
    def __init__(self, cache_enabled: bool = True, cache_ttl_hours: int = 24):
        """
        Initialize BOM Weather Service
        
        Args:
            cache_enabled: Enable response caching
            cache_ttl_hours: Cache time-to-live in hours
        """
        self.scraper = SmartHTMLParsingBOMScraper()
        self.cache_enabled = cache_enabled
        self.cache_ttl = timedelta(hours=cache_ttl_hours)
        self.cache = {}  # Simple in-memory cache
        
        logger.info("BOM Weather Service initialized")
        logger.info(f"Cache: {'enabled' if cache_enabled else 'disabled'}")
        logger.info(f"Cache TTL: {cache_ttl_hours} hours")
    
    def get_weather_data(self, location: str, state: str, 
                        date_from: Optional[str] = None,
                        date_to: Optional[str] = None,
                        dates: Optional[List[str]] = None) -> Dict:
        """
        Get weather data for a location
        
        Args:
            location: Location name (e.g., "Melbourne")
            state: State name (e.g., "Victoria")
            date_from: Start date (YYYY-MM-DD)
            date_to: End date (YYYY-MM-DD)
            dates: Specific dates list (alternative to date_from/date_to)
            
        Returns:
            Dictionary with weather data and metadata
        """
        try:
            # Parse dates
            target_dates = self._parse_dates(date_from, date_to, dates)
            
            if not target_dates:
                return {
                    'success': False,
                    'error': 'No valid dates provided'
                }
            
            # Check cache
            cache_key = f"{location}_{state}_{'_'.join(sorted(target_dates))}"
            
            if self.cache_enabled and cache_key in self.cache:
                cached_data, timestamp = self.cache[cache_key]
                if datetime.now() - timestamp < self.cache_ttl:
                    logger.info(f"Cache hit: {cache_key}")
                    return {
                        **cached_data,
                        'cached': True,
                        'cache_timestamp': timestamp.isoformat()
                    }
            
            # Extract weather data
            logger.info(f"Fetching weather data: {location}, {state} ({len(target_dates)} dates)")
            result = self.scraper.extract_weather_smart_parsing(location, state, target_dates)
            
            if result['success']:
                # Format response
                response = {
                    'success': True,
                    'location': f"{location}, {state}",
                    'station_id': result['station_id'],
                    'data': result['target_records'],
                    'metadata': {
                        'requested_dates': len(target_dates),
                        'records_returned': len(result['target_records']),
                        'coverage': f"{len(result['target_records'])}/{len(target_dates)}",
                        'extraction_timestamp': datetime.now().isoformat(),
                        'data_source': 'Bureau of Meteorology (BOM) Australia',
                        'method': 'Smart HTML Parsing + Plain Text CSV'
                    }
                }
                
                # Cache successful response
                if self.cache_enabled:
                    self.cache[cache_key] = (response, datetime.now())
                    logger.info(f"Cached response: {cache_key}")
                
                return response
            else:
                return {
                    'success': False,
                    'error': result.get('error', 'Unknown error'),
                    'location': f"{location}, {state}"
                }
                
        except Exception as e:
            logger.error(f"Weather data extraction failed: {str(e)}")
            return {
                'success': False,
                'error': f"Internal error: {str(e)}"
            }
    
    def get_available_states(self) -> List[Dict]:
        """Get list of available states"""
        states = [
            {'code': 'QLD', 'name': 'Queensland', 'bom_code': 'IDCJDW0400'},
            {'code': 'NSW', 'name': 'New South Wales', 'bom_code': 'IDCJDW0200'},
            {'code': 'VIC', 'name': 'Victoria', 'bom_code': 'IDCJDW0300'},
            {'code': 'WA', 'name': 'Western Australia', 'bom_code': 'IDCJDW0600'},
            {'code': 'SA', 'name': 'South Australia', 'bom_code': 'IDCJDW0500'},
            {'code': 'TAS', 'name': 'Tasmania', 'bom_code': 'IDCJDW0700'},
            {'code': 'NT', 'name': 'Northern Territory', 'bom_code': 'IDCJDW0800'},
            {'code': 'ACT', 'name': 'Australian Capital Territory', 'bom_code': 'IDCJDW0100'}
        ]
        return states
    
    def clear_cache(self):
        """Clear the response cache"""
        cache_size = len(self.cache)
        self.cache.clear()
        logger.info(f"Cache cleared ({cache_size} entries)")
        return {'success': True, 'entries_cleared': cache_size}
    
    def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        now = datetime.now()
        valid_entries = sum(1 for _, (_, timestamp) in self.cache.items() 
                           if now - timestamp < self.cache_ttl)
        
        return {
            'enabled': self.cache_enabled,
            'ttl_hours': self.cache_ttl.total_seconds() / 3600,
            'total_entries': len(self.cache),
            'valid_entries': valid_entries,
            'expired_entries': len(self.cache) - valid_entries
        }
    
    def _parse_dates(self, date_from: Optional[str], date_to: Optional[str],
                    dates: Optional[List[str]]) -> List[str]:
        """Parse and validate date parameters"""
        
        # If specific dates provided, use those
        if dates:
            validated_dates = []
            for date_str in dates:
                try:
                    datetime.strptime(date_str, "%Y-%m-%d")
                    validated_dates.append(date_str)
                except ValueError:
                    logger.warning(f"Invalid date format: {date_str}")
            return validated_dates
        
        # If date range provided, generate dates
        if date_from and date_to:
            try:
                start = datetime.strptime(date_from, "%Y-%m-%d")
                end = datetime.strptime(date_to, "%Y-%m-%d")
                
                if start > end:
                    return []
                
                # Generate date range
                date_list = []
                current = start
                while current <= end:
                    date_list.append(current.strftime("%Y-%m-%d"))
                    current += timedelta(days=1)
                
                return date_list
            except ValueError as e:
                logger.error(f"Date parsing error: {str(e)}")
                return []
        
        # If only date_from provided, use that single date
        if date_from:
            try:
                datetime.strptime(date_from, "%Y-%m-%d")
                return [date_from]
            except ValueError:
                return []
        
        return []


# Create singleton instance
_weather_service = None


def get_weather_service() -> BOMWeatherService:
    """Get singleton instance of BOM Weather Service"""
    global _weather_service
    if _weather_service is None:
        _weather_service = BOMWeatherService()
    return _weather_service
