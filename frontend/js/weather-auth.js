/**
 * Fetcha Weather - Authentication JavaScript
 * Version: v1.0 • Updated: 2025-10-28 19:46 AEST (Brisbane)
 * 
 * Handles login, signup, and email verification for Flask backend
 */

// ================================
// Tab Switching
// ================================

document.getElementById('loginTab').addEventListener('click', () => {
  switchTab('login');
});

document.getElementById('signupTab').addEventListener('click', () => {
  switchTab('signup');
});

function switchTab(tab) {
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  
  if (tab === 'login') {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
  } else {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
  
  hideStatus();
}

// ================================
// Login
// ================================

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  if (!email || !password) {
    showStatus('Please fill in all fields', 'error');
    return;
  }
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';
  
  try {
    const response = await fetch(`${window.API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    // Store JWT token
    localStorage.setItem('jwt_token', data.access_token);
    
    showStatus('Login successful! Redirecting...', 'success');
    
    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = 'weather-dashboard.html';
    }, 1000);
    
  } catch (error) {
    console.error('Login error:', error);
    showStatus(error.message, 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// ================================
// Signup
// ================================

document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const fullName = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  // Validation
  if (!fullName || !email || !password || !confirmPassword) {
    showStatus('Please fill in all fields', 'error');
    return;
  }
  
  if (password !== confirmPassword) {
    showStatus('Passwords do not match', 'error');
    return;
  }
  
  if (password.length < 8) {
    showStatus('Password must be at least 8 characters', 'error');
    return;
  }
  
  // Check password strength
  if (!/[A-Z]/.test(password)) {
    showStatus('Password must contain at least one uppercase letter', 'error');
    return;
  }
  
  if (!/[a-z]/.test(password)) {
    showStatus('Password must contain at least one lowercase letter', 'error');
    return;
  }
  
  if (!/[0-9]/.test(password)) {
    showStatus('Password must contain at least one number', 'error');
    return;
  }
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account...';
  
  try {
    const response = await fetch(`${window.API_BASE}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        full_name: fullName
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }
    
    // For development, we get the verification token in response
    if (data.verification_token) {
      showStatus('Account created! Redirecting to email verification...', 'success');
      
      // Store email and token for verification page
      localStorage.setItem('verify_email', email);
      localStorage.setItem('verify_token', data.verification_token);
      
      // Redirect to verification page
      setTimeout(() => {
        window.location.href = 'verify-email.html';
      }, 2000);
    } else {
      showStatus('Account created! Please check your email to verify your account.', 'success');
      
      // Switch to login tab after a delay
      setTimeout(() => {
        switchTab('login');
        document.getElementById('loginEmail').value = email;
      }, 3000);
    }
    
  } catch (error) {
    console.error('Signup error:', error);
    showStatus(error.message, 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// ================================
// Google Sign In (Placeholder)
// ================================

document.getElementById('googleSignIn').addEventListener('click', () => {
  showStatus('Google Sign In coming soon!', 'info');
});

// ================================
// Status Messages
// ================================

function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('authStatus');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.classList.remove('hidden');
}

function hideStatus() {
  const statusDiv = document.getElementById('authStatus');
  statusDiv.classList.add('hidden');
}

// ================================
// Check if already logged in
// ================================

window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    // Already logged in, redirect to dashboard
    window.location.href = 'weather-dashboard.html';
  }
});
