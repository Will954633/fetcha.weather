// Forgot Password JavaScript
// Version: v1.0 • Updated: 2025-08-25 13:14 AEST (Brisbane)

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
    // Local development environment - prefer the API on port 8000.
    // If the frontend is already being served from the API (port 8000), use the origin.
    // Otherwise construct an API base with the same hostname but port 8000 to avoid CORS.
    const protocol = window.location.protocol;
    if (window.location.port === '8000') {
      return origin;
    }
    return `${protocol}//${hostname}:8000`;
  } else {
    // Fallback to origin if available, otherwise environment override or localhost
    return origin || window.CAMOUFOX_API_BASE || 'http://localhost:8000';
  }
}

const API_BASE = getApiBaseUrl();

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

// Email validation
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
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

// Forgot password form handler
async function handleForgotPassword(event) {
  event.preventDefault();
  
  const email = el("resetEmail").value.trim();
  
  if (!validateEmail(email)) {
    setStatus("Please enter a valid email address", true);
    return;
  }
  
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.classList.add("loading");
  submitBtn.textContent = "Sending reset link...";
  
  try {
    const response = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    
    if (response.ok) {
      const data = await response.json();
      setStatus("If an account with that email exists, a password reset link has been sent. Please check your email.", false, true);
      
      // Disable form after successful submission
      el("resetEmail").disabled = true;
      submitBtn.textContent = "Reset link sent";
      
      // Show additional instructions
      setTimeout(() => {
        setStatus("Check your email for the reset link. It will expire in 1 hour.", false, false);
      }, 3000);
      
    } else {
      const error = await response.json();
      setStatus(error.detail || "Failed to send reset link. Please try again.", true);
    }
  } catch (error) {
    setStatus("Network error. Please try again.", true);
  } finally {
    if (!el("resetEmail").disabled) {
      submitBtn.disabled = false;
      submitBtn.classList.remove("loading");
      submitBtn.textContent = originalText;
    }
  }
}

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  // Add form event listener
  el("forgotPasswordForm").addEventListener("submit", handleForgotPassword);
  
  // Add real-time email validation
  const resetEmail = el("resetEmail");
  if (resetEmail) {
    addEmailValidation(resetEmail);
    resetEmail.focus();
  }
  
  // Pre-fill email if coming from login page with error
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email');
  if (email && validateEmail(email)) {
    resetEmail.value = email;
  }
});
