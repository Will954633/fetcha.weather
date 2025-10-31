// Authentication JavaScript - Updated for new API endpoints with Password Manager Integration
// Version: v1.2 • Updated: 2025-08-17 09:34 AEST (Brisbane)
// • 2025-08-14 17:41 AEST (Brisbane)

// Auto-detect API base URL based on current domain
function getApiBaseUrl() {
  const hostname = window.location.hostname;
  const origin = window.location.origin;

  // Allow explicit override (useful for containers / reverse proxies)
  if (window.CAMOUFOX_API_BASE) {
    return window.CAMOUFOX_API_BASE;
  }

  if (hostname === 'fetcha.net' || hostname === 'www.fetcha.net') {
    // Production environment - use same origin so protocol (http/https) matches the page
    return origin;
  } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Local development environment - use same origin (port 8080 proxies to port 8000)
    return origin;
  } else {
    // Fallback to origin if available, otherwise environment override or localhost
    return origin || window.CAMOUFOX_API_BASE || 'http://localhost:8080';
  }
}

const API_BASE = getApiBaseUrl();

// Helper function to get the correct API URL based on endpoint
// Port 8080: Frontend + demo endpoints  
// Port 8000: Backend API endpoints (/api/projects, /auth, etc.)
function getEndpointUrl(path) {
  // Backend API endpoints that live on port 8000
  const backendEndpoints = [
    '/api/projects',
    '/api/scrape',
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/logout',
    '/auth/me'
  ];
  
  // Check if this is a backend endpoint
  const isBackendEndpoint = backendEndpoints.some(endpoint => path.startsWith(endpoint));
  
  if (isBackendEndpoint && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    // Route backend endpoints to port 8000 in development
    return `http://127.0.0.1:8000${path}`;
  }
  
  // All other endpoints use the standard API_BASE (port 8080 for demo, production uses origin)
  return `${API_BASE}${path}`;
}

// Helper function for API requests with automatic URL routing
async function apiRequest(path, options = {}) {
  const url = getEndpointUrl(path);
  const token = localStorage.getItem('camoufox_access_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    return response;
  } catch (error) {
    console.error(`API request failed for ${path}:`, error);
    throw error;
  }
}

function el(id) { return document.getElementById(id); }

function setStatus(msg, isError, isSuccess) {
  const s = el("authStatus");
  s.textContent = msg;
  s.className = isError ? "status error" : (isSuccess ? "status success" : "status");
  s.classList.remove("hidden");
  
  // Add subtle animation
  s.style.opacity = "0";
  s.style.transform = "translateY(-10px)";
  setTimeout(() => {
    s.style.transition = "all 0.3s ease";
    s.style.opacity = "1";
    s.style.transform = "translateY(0)";
  }, 10);
}

function hideStatus() {
  const s = el("authStatus");
  s.classList.add("hidden");
}

// Tab switching functionality
function initTabs() {
  const loginTab = el("loginTab");
  const signupTab = el("signupTab");
  const loginForm = el("loginForm");
  const signupForm = el("signupForm");

  loginTab.addEventListener("click", () => {
    loginTab.classList.add("active");
    signupTab.classList.remove("active");
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
    hideStatus();
  });

  signupTab.addEventListener("click", () => {
    signupTab.classList.add("active");
    loginTab.classList.remove("active");
    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    hideStatus();
  });
}

// Form validation
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(password) {
  return password.length >= 8;
}

// Enhanced password validation with detailed feedback
function validatePasswordStrength(password) {
  const requirements = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const isValid = Object.values(requirements).every(req => req);
  
  return {
    isValid,
    requirements,
    message: isValid ? "Password meets all requirements" : "Password must contain at least 8 characters with uppercase, lowercase, number, and special character"
  };
}

// Real-time email validation
function addEmailValidation(emailInput) {
  emailInput.addEventListener('blur', function() {
    const email = this.value.trim();
    if (email && !validateEmail(email)) {
      this.style.borderColor = '#e74c3c';
      setStatus("Please enter a valid email address", true);
    } else {
      this.style.borderColor = '';
      if (email) hideStatus();
    }
  });
}

// Real-time password validation
function addPasswordValidation(passwordInput, confirmInput = null) {
  passwordInput.addEventListener('input', function() {
    const password = this.value;
    
    if (password.length > 0) {
      if (validatePassword(password)) {
        this.style.borderColor = '#27ae60';
      } else {
        this.style.borderColor = '#e74c3c';
      }
    } else {
      this.style.borderColor = '';
    }
  });
  
  if (confirmInput) {
    confirmInput.addEventListener('input', function() {
      const password = passwordInput.value;
      const confirm = this.value;
      
      if (confirm.length > 0) {
        if (password === confirm) {
          this.style.borderColor = '#27ae60';
        } else {
          this.style.borderColor = '#e74c3c';
        }
      } else {
        this.style.borderColor = '';
      }
    });
  }
}

// Store demo data for transfer to first project
function storeDemoData() {
  const demoData = {
    url: localStorage.getItem('camoufox_demo_url') || '',
    extractedData: localStorage.getItem('camoufox_demo_data') || '',
    parserCode: localStorage.getItem('camoufox_demo_parser') || '',
    htmlContent: localStorage.getItem('camoufox_demo_html') || ''
  };
  
  // Only store if we have meaningful demo data
  if (demoData.url || demoData.extractedData) {
    localStorage.setItem('camoufox_pending_project', JSON.stringify(demoData));
  }
}

// Web Credential Management API functions
async function checkCredentialSupport() {
  return 'credentials' in navigator && 'PasswordCredential' in window;
}

// Load saved credentials on page load
async function loadSavedCredentials() {
  if (!await checkCredentialSupport()) {
    return;
  }
  
  try {
    const credential = await navigator.credentials.get({
      password: true,
      mediation: 'silent'
    });
    
    if (credential && credential.type === 'password') {
      // Auto-fill login form if credentials are available
      const loginEmail = el("loginEmail");
      const loginPassword = el("loginPassword");
      
      if (loginEmail && loginPassword) {
        loginEmail.value = credential.id;
        loginPassword.value = credential.password;
        
        // Focus on login form if credentials were loaded
        if (!window.location.hash || window.location.hash !== '#signup') {
          loginEmail.focus();
        }
      }
    }
  } catch (error) {
    // Silently handle credential loading errors
    console.log('Credential loading not available or failed');
  }
}

// Store credentials after successful login
async function storeCredentials(email, password) {
  if (!await checkCredentialSupport()) {
    return;
  }
  
  try {
    const credential = new PasswordCredential({
      id: email,
      password: password,
      name: email,
      iconURL: window.location.origin + '/favicon.ico'
    });
    
    await navigator.credentials.store(credential);
  } catch (error) {
    // Silently handle credential storage errors
    console.log('Credential storage not available or failed');
  }
}

// Generate strong password suggestion
function generateStrongPassword(length = 16) {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Add password suggestion functionality
function addPasswordSuggestion(passwordInput) {
  // Create suggestion button
  const suggestionBtn = document.createElement('button');
  suggestionBtn.type = 'button';
  suggestionBtn.textContent = '🔑 Suggest Strong Password';
  suggestionBtn.className = 'password-suggestion-btn';
  suggestionBtn.style.cssText = `
    margin-top: 5px;
    padding: 6px 12px;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    font-size: 12px;
    color: #6c757d;
    cursor: pointer;
    transition: all 0.2s ease;
  `;
  
  suggestionBtn.addEventListener('mouseenter', function() {
    this.style.background = '#e9ecef';
    this.style.borderColor = '#adb5bd';
  });
  
  suggestionBtn.addEventListener('mouseleave', function() {
    this.style.background = '#f8f9fa';
    this.style.borderColor = '#dee2e6';
  });
  
  suggestionBtn.addEventListener('click', function() {
    const strongPassword = generateStrongPassword();
    passwordInput.value = strongPassword;
    
    // Also fill confirm password if it exists
    const confirmPassword = el("confirmPassword");
    if (confirmPassword) {
      confirmPassword.value = strongPassword;
    }
    
    // Trigger validation
    passwordInput.dispatchEvent(new Event('input'));
    if (confirmPassword) {
      confirmPassword.dispatchEvent(new Event('input'));
    }
    
    // Show success message
    setStatus("Strong password generated! Google will offer to save this password.", false, true);
    setTimeout(hideStatus, 3000);
  });
  
  // Insert after password input
  passwordInput.parentNode.appendChild(suggestionBtn);
}

// Login form handler
async function handleLogin(event) {
  event.preventDefault();
  
  const email = el("loginEmail").value.trim();
  const password = el("loginPassword").value;
  
  if (!validateEmail(email)) {
    setStatus("Please enter a valid email address", true);
    return;
  }
  
  if (!validatePassword(password)) {
    setStatus("Password must be at least 8 characters", true);
    return;
  }
  
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.classList.add("loading");
  submitBtn.textContent = "Signing in...";
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Store authentication tokens (include legacy key for dev compatibility)
      localStorage.setItem('camoufox_access_token', data.access_token);
      localStorage.setItem('camoufox_refresh_token', data.refresh_token);
      localStorage.setItem('camoufox_token', data.access_token); // legacy key used by older scripts
      localStorage.setItem('camoufox_user', JSON.stringify(data.user));
      
      // Store credentials for future use
      await storeCredentials(email, password);
      
      setStatus("Sign in successful! Redirecting...", false, true);
      
      // Store demo data before redirect
      storeDemoData();
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1500);
      
    } else {
      const error = await response.json();
      setStatus(error.detail || "Sign in failed. Please check your credentials.", true);
    }
  } catch (error) {
    setStatus("Network error. Please try again.", true);
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove("loading");
    submitBtn.textContent = originalText;
  }
}

// Signup form handler
async function handleSignup(event) {
  event.preventDefault();
  
  const name = el("signupName").value.trim();
  const email = el("signupEmail").value.trim();
  const password = el("signupPassword").value;
  const confirmPassword = el("confirmPassword").value;
  
  if (!name) {
    setStatus("Please enter your full name", true);
    return;
  }
  
  if (!validateEmail(email)) {
    setStatus("Please enter a valid email address", true);
    return;
  }
  
  if (!validatePassword(password)) {
    setStatus("Password must be at least 8 characters and contain a mix of uppercase, lowercase, and numbers", true);
    return;
  }
  
  if (password !== confirmPassword) {
    setStatus("Passwords do not match", true);
    return;
  }
  
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.classList.add("loading");
  submitBtn.textContent = "Creating account...";
  
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        full_name: name, 
        email, 
        password 
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Store signup email for verification page auto-resend functionality
      localStorage.setItem('camoufox_recent_signup', JSON.stringify({
        email: email,
        timestamp: Date.now()
      }));
      
      setStatus("Account created! Please check your email to verify your account.", false, true);
      
      // Switch to login tab after successful registration
      setTimeout(() => {
        el("loginTab").click();
        el("loginEmail").value = email;
        setStatus("Please check your email and verify your account, then sign in.", false, false);
      }, 2000);
      
    } else {
      try {
        const error = await response.json();
        console.log('Server error response:', error);
        
        // Handle different error response formats
        let errorMessage = "Account creation failed. Please try again.";
        
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error.detail) {
          // Handle nested detail objects (common with FastAPI validation errors)
          if (typeof error.detail === 'string') {
            errorMessage = error.detail;
          } else if (Array.isArray(error.detail)) {
            // FastAPI validation errors are often arrays
            errorMessage = error.detail.map(err => err.msg || err.message || 'Validation error').join(', ');
          } else if (typeof error.detail === 'object') {
            // If detail is an object, try to extract meaningful message
            errorMessage = error.detail.message || error.detail.msg || JSON.stringify(error.detail);
          }
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.error) {
          errorMessage = error.error;
        } else if (Array.isArray(error) && error.length > 0) {
          errorMessage = error[0].msg || error[0].message || errorMessage;
        }
        
        setStatus(errorMessage, true);
      } catch (parseError) {
        console.log('Failed to parse error response:', parseError);
        setStatus(`Account creation failed. Server returned status ${response.status}.`, true);
      }
    }
  } catch (error) {
    console.log('Network error:', error);
    setStatus("Network error. Please try again.", true);
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove("loading");
    submitBtn.textContent = originalText;
  }
}

// Google Sign In handler
async function handleGoogleSignIn() {
  setStatus("Google Sign In coming soon! Please use email/password for now.", false, false);
  
  // TODO: Implement Google OAuth
  // This would typically involve:
  // 1. Redirect to Google OAuth
  // 2. Handle callback
  // 3. Exchange code for token
  // 4. Create/login user
  // 5. Redirect to dashboard
}

// Check if user is already logged in
function checkAuthStatus() {
  const accessToken = localStorage.getItem('camoufox_access_token');
  const user = localStorage.getItem('camoufox_user');
  
  if (accessToken && user) {
    // User is already logged in, redirect to dashboard
    window.location.href = "dashboard.html";
  }
}

// Enhanced password validation - Updated to accept Google password suggestions
function validatePassword(password) {
  // At least 8 characters is the minimum requirement
  const minLength = password.length >= 8;
  
  // For Google-generated passwords, we accept them if they meet basic criteria
  // Google passwords are typically strong even without special characters
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  // Accept password if it meets minimum length and has at least 3 of the 4 character types
  const characterTypes = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  
  return minLength && characterTypes >= 3;
}

// Token refresh functionality
async function refreshToken() {
  const refreshToken = localStorage.getItem('camoufox_refresh_token');
  
  if (!refreshToken) {
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('camoufox_access_token', data.access_token);
      return true;
    } else {
      // Refresh failed, clear tokens
      localStorage.removeItem('camoufox_access_token');
      localStorage.removeItem('camoufox_refresh_token');
      localStorage.removeItem('camoufox_user');
      return false;
    }
  } catch (error) {
    return false;
  }
}

// Logout functionality
async function logout() {
  const accessToken = localStorage.getItem('camoufox_access_token');
  
  if (accessToken) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
    } catch (error) {
      // Ignore logout errors
    }
  }
  
  // Clear all stored data
  localStorage.removeItem('camoufox_access_token');
  localStorage.removeItem('camoufox_refresh_token');
  localStorage.removeItem('camoufox_user');
  
  // Redirect to login
  window.location.href = "login.html";
}

// Initialize the page
document.addEventListener("DOMContentLoaded", async () => {
  // Check if user is already authenticated
  checkAuthStatus();
  
  // Initialize tab functionality
  initTabs();
  
  // Check if we should show signup tab (from URL hash)
  if (window.location.hash === '#signup') {
    el("signupTab").click();
  }
  
  // Add form event listeners
  el("loginForm").addEventListener("submit", handleLogin);
  el("signupForm").addEventListener("submit", handleSignup);
  el("googleSignIn").addEventListener("click", handleGoogleSignIn);
  
  // Add real-time validation
  const loginEmail = el("loginEmail");
  const signupEmail = el("signupEmail");
  const signupPassword = el("signupPassword");
  const confirmPassword = el("confirmPassword");
  
  if (loginEmail) addEmailValidation(loginEmail);
  if (signupEmail) addEmailValidation(signupEmail);
  if (signupPassword && confirmPassword) {
    addPasswordValidation(signupPassword, confirmPassword);
    // Add password suggestion button for signup
    addPasswordSuggestion(signupPassword);
  }
  
  // Load saved credentials if available
  await loadSavedCredentials();
  
  // Focus on first input
  if (window.location.hash === '#signup') {
    el("signupName").focus();
  } else {
    el("loginEmail").focus();
  }
});
