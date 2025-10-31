#!/usr/bin/env python3
"""
Enhanced HTTP Client for BOM Scraping
Version: v1.0 • Updated: 2025-09-16 10:30 AEST (Brisbane)

🔧 ENHANCED HTTP CLIENT 🔧
Provides robust HTTP requests with:
- Comprehensive browser headers
- Session management
- Retry logic with exponential backoff
- Error handling for 403 Forbidden responses
- Rate limiting compliance
"""

import requests
import time
import random
import logging
from typing import Optional, Dict, Any
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)

class EnhancedBOMHTTPClient:
    """Enhanced HTTP client specifically designed for BOM website scraping"""
    
    def __init__(self):
        self.session = requests.Session()
        self.setup_session()
        self.request_count = 0
        self.last_request_time = 0
        
        # Rate limiting: minimum delay between requests
        self.min_delay_seconds = 2.0
        self.max_delay_seconds = 5.0
        
    def setup_session(self):
        """Configure session with comprehensive headers and retry strategy"""
        
        # Comprehensive browser headers to avoid detection
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-AU,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'sec-ch-ua': '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"'
        })
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS"]
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        print("🔧 Enhanced HTTP client configured with comprehensive headers")
        
    def get(self, url: str, timeout: int = 30, **kwargs) -> requests.Response:
        """
        Make GET request with rate limiting and enhanced error handling
        
        Args:
            url: URL to request
            timeout: Request timeout in seconds
            **kwargs: Additional arguments for requests.get
            
        Returns:
            Response object
            
        Raises:
            requests.exceptions.HTTPError: For HTTP errors (including 403)
            requests.exceptions.RequestException: For other request errors
        """
        
        # Rate limiting
        self._enforce_rate_limit()
        
        try:
            print(f"🌐 Making HTTP request to: {url}")
            
            # Make the request
            response = self.session.get(url, timeout=timeout, **kwargs)
            
            # Handle different status codes explicitly
            if response.status_code == 403:
                print(f"🚫 HTTP 403 Forbidden - BOM is blocking this request")
                print(f"   URL: {url}")
                print(f"   Headers sent: {dict(self.session.headers)}")
                raise requests.exceptions.HTTPError(
                    f"403 Forbidden: BOM server is blocking requests to {url}. "
                    f"This may indicate bot detection or rate limiting."
                )
            
            elif response.status_code == 429:
                print(f"⏱️ HTTP 429 Too Many Requests - Rate limited by BOM")
                raise requests.exceptions.HTTPError(
                    f"429 Too Many Requests: BOM server is rate limiting. Please wait before retrying."
                )
            
            elif response.status_code >= 400:
                print(f"❌ HTTP {response.status_code} error for {url}")
                response.raise_for_status()
            
            print(f"✅ HTTP {response.status_code} - Downloaded {len(response.text)} characters")
            
            self.request_count += 1
            return response
            
        except requests.exceptions.ConnectTimeout:
            raise requests.exceptions.RequestException(
                f"Connection timeout to {url}. The server may be unavailable."
            )
        except requests.exceptions.ReadTimeout:
            raise requests.exceptions.RequestException(
                f"Read timeout for {url}. The server response was too slow."
            )
        except requests.exceptions.ConnectionError as e:
            # This is where the original "nodename nor servname" error gets caught
            print(f"🔍 Connection error details: {str(e)}")
            if "nodename nor servname provided, or not known" in str(e):
                raise requests.exceptions.RequestException(
                    f"DNS resolution failed for {url}. Check internet connection."
                )
            else:
                raise requests.exceptions.RequestException(
                    f"Connection error to {url}: {str(e)}"
                )
        except requests.exceptions.HTTPError:
            # Re-raise HTTP errors as-is (we've already handled them above)
            raise
        except Exception as e:
            print(f"💥 Unexpected error: {str(e)}")
            raise requests.exceptions.RequestException(f"Unexpected error: {str(e)}")
    
    def get_with_retry(self, url: str, max_retries: int = 3, base_delay: float = 1.0) -> Optional[requests.Response]:
        """
        Make GET request with custom retry logic for 403 errors
        
        Args:
            url: URL to request
            max_retries: Maximum number of retry attempts
            base_delay: Base delay between retries (will be increased exponentially)
            
        Returns:
            Response object if successful, None if all retries failed
        """
        
        for attempt in range(max_retries + 1):
            try:
                response = self.get(url)
                return response
                
            except requests.exceptions.HTTPError as e:
                if "403 Forbidden" in str(e):
                    if attempt < max_retries:
                        delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                        print(f"🔄 Retry {attempt + 1}/{max_retries} after {delay:.1f}s delay...")
                        time.sleep(delay)
                        
                        # Rotate User-Agent on retry
                        self._rotate_user_agent()
                        continue
                    else:
                        print(f"❌ All {max_retries} retries failed for 403 Forbidden")
                        return None
                else:
                    # Non-403 HTTP errors - don't retry
                    print(f"❌ HTTP error (non-403): {str(e)}")
                    return None
                    
            except requests.exceptions.RequestException as e:
                if attempt < max_retries:
                    delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                    print(f"🔄 Retry {attempt + 1}/{max_retries} after {delay:.1f}s delay for: {str(e)}")
                    time.sleep(delay)
                    continue
                else:
                    print(f"❌ All {max_retries} retries failed: {str(e)}")
                    return None
        
        return None
    
    def _enforce_rate_limit(self):
        """Enforce rate limiting between requests"""
        
        current_time = time.time()
        
        if self.last_request_time > 0:
            time_since_last = current_time - self.last_request_time
            min_delay = self.min_delay_seconds
            
            # Add random jitter to avoid predictable patterns
            actual_delay = min_delay + random.uniform(0, self.max_delay_seconds - min_delay)
            
            if time_since_last < actual_delay:
                sleep_time = actual_delay - time_since_last
                print(f"⏱️ Rate limiting: waiting {sleep_time:.1f}s...")
                time.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    def _rotate_user_agent(self):
        """Rotate User-Agent header to avoid detection"""
        
        user_agents = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
        ]
        
        new_user_agent = random.choice(user_agents)
        self.session.headers['User-Agent'] = new_user_agent
        print(f"🔄 Rotated User-Agent: {new_user_agent[:50]}...")
    
    def get_session_info(self) -> Dict[str, Any]:
        """Get information about the current session"""
        
        return {
            'request_count': self.request_count,
            'headers': dict(self.session.headers),
            'last_request_time': self.last_request_time,
            'rate_limiting': {
                'min_delay_seconds': self.min_delay_seconds,
                'max_delay_seconds': self.max_delay_seconds
            }
        }

def test_enhanced_http_client():
    """Test the enhanced HTTP client with BOM URLs"""
    
    print("🔧 TESTING ENHANCED HTTP CLIENT")
    print("=" * 50)
    
    client = EnhancedBOMHTTPClient()
    
    # Test URLs
    test_urls = [
        "https://www.bom.gov.au/climate/dwo/IDCJDW0700.shtml",  # Tasmania
        "https://www.bom.gov.au/climate/dwo/IDCJDW0300.shtml",  # Victoria  
        "https://www.bom.gov.au/climate/dwo/IDCJDW0200.shtml",  # NSW
    ]
    
    successful_requests = 0
    
    for i, url in enumerate(test_urls, 1):
        print(f"\n🧪 Test {i}/{len(test_urls)}: {url}")
        
        response = client.get_with_retry(url, max_retries=2)
        
        if response:
            print(f"✅ Success: HTTP {response.status_code}, {len(response.text)} characters")
            successful_requests += 1
            
            # Check if we got actual HTML content
            if "<!DOCTYPE" in response.text or "<html" in response.text.lower():
                print(f"📄 Valid HTML content received")
            else:
                print(f"⚠️ Response doesn't look like HTML")
        else:
            print(f"❌ Failed after retries")
    
    print(f"\n🎯 TEST SUMMARY:")
    print(f"✅ Successful requests: {successful_requests}/{len(test_urls)}")
    print(f"📊 Success rate: {(successful_requests/len(test_urls))*100:.1f}%")
    
    # Show session info
    session_info = client.get_session_info()
    print(f"📈 Total requests made: {session_info['request_count']}")
    
    return successful_requests > 0

if __name__ == "__main__":
    success = test_enhanced_http_client()
    
    if success:
        print(f"\n🎉 Enhanced HTTP client working!")
        print(f"✅ Ready to integrate with BOM scraper")
    else:
        print(f"\n❌ Enhanced HTTP client needs more work")
        print(f"🔍 BOM may have very strict bot detection")
