/**
 * Fetcha Weather - Configuration
 * Automatically detects environment and sets API base URL
 */

(function() {
  // Detect environment based on hostname
  const hostname = window.location.hostname;
  
  let apiBase;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Development
    apiBase = 'http://localhost:5000/api';
  } else if (hostname.includes('fetcha.weather') || hostname.includes('fetcha.net')) {
    // Production
    apiBase = 'https://api.fetcha.net/api';
  } else {
    // Default to relative path for other deployments
    apiBase = '/api';
  }
  
  // Set global API base
  window.API_BASE = apiBase;
  
  console.log('Environment detected:', hostname);
  console.log('API Base URL:', apiBase);
})();
