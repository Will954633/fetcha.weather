 // Shared utilities for the Camoufox application
 // Expose API_BASE on window to avoid duplicate top-level const declarations
 window.API_BASE = window.API_BASE || window.CAMOUFOX_API_BASE || window.location.origin;
 window.CAMOUFOX_API_BASE = window.API_BASE;

// Common DOM utilities
function el(id) { 
  return document.getElementById(id); 
}

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return document.querySelectorAll(selector);
}

// Authentication utilities
function getAuthToken() {
  // Backwards compatibility:
  // Prefer the newer 'camoufox_access_token' key (set by auth.js).
  // Fall back to legacy 'camoufox_token' (used by dev helpers).
  return localStorage.getItem('camoufox_access_token') || localStorage.getItem('camoufox_token') || null;
}

function getUser() {
  const userStr = localStorage.getItem('camoufox_user');
  return userStr ? JSON.parse(userStr) : null;
}

function isAuthenticated() {
  return !!(getAuthToken() && getUser());
}

function logout() {
  // Clear all possible authentication tokens and related dev keys
  localStorage.removeItem('camoufox_access_token');
  localStorage.removeItem('camoufox_refresh_token');
  localStorage.removeItem('camoufox_token');
  localStorage.removeItem('camoufox_user');
  localStorage.removeItem('camoufox_projects');
  localStorage.removeItem('camoufox_pending_project');
  localStorage.removeItem('camoufox_dev_mode');
  // Redirect to login page
  window.location.href = 'login.html';
}

function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

 // API utilities
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    headers: defaultHeaders,
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  try {
    // Debug: log outgoing request
    console.debug('apiRequest ->', endpoint, { config });
    const response = await fetch(`${window.API_BASE}${endpoint}`, config);
    console.debug('apiRequest <-', endpoint, 'status', response.status);
    
    if (!response.ok) {
      // Attempt to read and log response body for debugging
      try {
        const bodyText = await response.clone().text();
        console.debug('apiRequest <- body', endpoint, bodyText);
      } catch (e) {
        console.debug('apiRequest <- failed to read body for', endpoint, e);
      }
    }
    
    // Handle authentication errors
    if (response.status === 401) {
      console.debug('apiRequest <- 401 received for', endpoint, 'triggering logout');
      logout();
      return null;
    }
    
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Status message utilities
function showStatus(message, type = 'info', duration = 5000) {
  const statusEl = el('statusMessage') || createStatusElement();
  
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;
  statusEl.classList.remove('hidden');
  
  // Auto-hide after duration
  if (duration > 0) {
    setTimeout(() => {
      hideStatus();
    }, duration);
  }
}

function hideStatus() {
  const statusEl = el('statusMessage');
  if (statusEl) {
    statusEl.classList.add('hidden');
  }
}

function createStatusElement() {
  const statusEl = document.createElement('div');
  statusEl.id = 'statusMessage';
  statusEl.className = 'status-message hidden';
  document.body.appendChild(statusEl);
  return statusEl;
}

// Copy to clipboard utility
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showStatus('Copied to clipboard!', 'success', 2000);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      showStatus('Copied to clipboard!', 'success', 2000);
      return true;
    } catch (err) {
      showStatus('Failed to copy to clipboard', 'error');
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

// Date formatting utilities
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(dateString);
  }
}

// URL utilities
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return url;
  }
}

function generateProjectName(url) {
  const domain = extractDomain(url);
  const cleanDomain = domain.replace(/^www\./, '');
  return `${cleanDomain} Data Extraction`;
}

// Loading state utilities
function setLoading(element, isLoading, originalText = '') {
  if (isLoading) {
    element.disabled = true;
    element.classList.add('loading');
    if (originalText) {
      element.dataset.originalText = element.textContent;
      element.textContent = originalText;
    }
  } else {
    element.disabled = false;
    element.classList.remove('loading');
    if (element.dataset.originalText) {
      element.textContent = element.dataset.originalText;
      delete element.dataset.originalText;
    }
  }
}

// Validation utilities
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

// Local storage utilities for demo data
function getDemoData() {
  const pendingProject = localStorage.getItem('camoufox_pending_project');
  return pendingProject ? JSON.parse(pendingProject) : null;
}

function clearDemoData() {
  localStorage.removeItem('camoufox_pending_project');
}

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Generate random API key
function generateApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'cfx_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Truncate text utility
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Click outside handler
function onClickOutside(element, callback) {
  document.addEventListener('click', function(event) {
    if (!element.contains(event.target)) {
      callback();
    }
  });
}

// Export utilities for use in other scripts
window.CamoufoxUtils = {
  el,
  qs,
  qsa,
  getAuthToken,
  getUser,
  isAuthenticated,
  logout,
  requireAuth,
  apiRequest,
  showStatus,
  hideStatus,
  copyToClipboard,
  formatDate,
  formatDateTime,
  timeAgo,
  extractDomain,
  generateProjectName,
  setLoading,
  validateEmail,
  validateUrl,
  getDemoData,
  clearDemoData,
  debounce,
  generateApiKey,
  truncateText,
  onClickOutside
};
