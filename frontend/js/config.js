/**
 * Fetcha Weather - Configuration
 * Automatically detects environment and sets API base URL
 */

(function() {
  // Detect environment based on hostname
  const hostname = window.location.hostname;
  
  let apiBase;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Development (using port 5001 to avoid macOS AirPlay on 5000)
    apiBase = 'http://localhost:5001/api';
  } else if (hostname.includes('netlify.app')) {
    // Production on Netlify - connects to Railway backend
    apiBase = 'https://web-production-2d722.up.railway.app/api';
  } else if (hostname.includes('fetcha.net') || hostname.includes('fetcha.weather')) {
    // Production with custom domain - use api.fetcha.net subdomain
    apiBase = 'https://api.fetcha.net/api';
  } else {
    // Default to Railway backend for any other deployment
    apiBase = 'https://web-production-2d722.up.railway.app/api';
  }
  
  // Set global API base
  window.API_BASE = apiBase;
  
  // Google OAuth Configuration
  window.GOOGLE_CLIENT_ID = '400382614619-fbe3daa832pmmf1od3u2bdjjs0gcqgvl.apps.googleusercontent.com';
  
  console.log('Environment detected:', hostname);
  console.log('API Base URL:', apiBase);
})();
