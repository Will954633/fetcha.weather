// Reset Password JavaScript
// Version: v1.0 • Updated: 2025-08-25 13:15 AEST (Brisbane)

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
    // Local development environment - use API server port
    return 'http://localhost:8000';
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

// Password validation
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
  
  // Accept password if it meets minimum length and has at least 3 of the 4 character types
  const characterTypes = [requirements.hasUpper, requirements.hasLower, requirements.hasNumber, requirements.hasSpecial].filter(Boolean).length;
  const isValid = requirements.minLength && characterTypes >= 3;
  
  return {
    isValid,
    requirements,
    characterTypes,
    message: isValid ? "Password meets requirements" : "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
  };
}

// Real-time password validation
function addPasswordValidation(passwordInput, confirmInput) {
  passwordInput.addEventListener('input', function() {
    const password = this.value;
    const validation = validatePasswordStrength(password);
    
    if (password.length > 0) {
      if (validation.isValid) {
        this.style.borderColor = '#27ae60';
      } else {
        this.style.borderColor = '#e74c3c';
      }
    } else {
      this.style.borderColor = '';
    }
    
    // Update confirm password validation if it has content
    if (confirmInput.value.length > 0) {
      confirmInput.dispatchEvent(new Event('input'));
    }
  });
  
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

// Get reset token from URL
function getResetToken() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token');
}

// Reset password form handler
async function handleResetPassword(event) {
  event.preventDefault();
  
  const token = getResetToken();
  if (!token) {
    setStatus("Invalid reset link. Please request a new password reset.", true);
    return;
  }
  
  const newPassword = el("newPassword").value;
  const confirmPassword = el("confirmNewPassword").value;
  
  const validation = validatePasswordStrength(newPassword);
  if (!validation.isValid) {
    setStatus(validation.message, true);
    return;
  }
  
  if (newPassword !== confirmPassword) {
    setStatus("Passwords do not match", true);
    return;
  }
  
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.classList.add("loading");
  submitBtn.textContent = "Resetting password...";
  
  try {
    const response = await fetch(`${API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        token: token,
        new_password: newPassword 
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      setStatus("Password reset successfully! Redirecting to login...", false, true);
      
      // Disable form after successful submission
      el("newPassword").disabled = true;
      el("confirmNewPassword").disabled = true;
      submitBtn.textContent = "Password reset";
      
      // Redirect to login page after delay
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
      
    } else {
      const error = await response.json();
      let errorMessage = "Failed to reset password. Please try again.";
      
      if (error.detail) {
        if (typeof error.detail === 'string') {
          errorMessage = error.detail;
        } else if (error.detail.message) {
          errorMessage = error.detail.message;
        }
      }
      
      setStatus(errorMessage, true);
      
      // If token is invalid/expired, suggest requesting new reset
      if (errorMessage.includes('Invalid') || errorMessage.includes('expired')) {
        setTimeout(() => {
          setStatus("Your reset link may have expired. Please request a new password reset.", true);
        }, 3000);
      }
    }
  } catch (error) {
    setStatus("Network error. Please try again.", true);
  } finally {
    if (!el("newPassword").disabled) {
      submitBtn.disabled = false;
      submitBtn.classList.remove("loading");
      submitBtn.textContent = originalText;
    }
  }
}

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  // Check if reset token is present
  const token = getResetToken();
  if (!token) {
    setStatus("Invalid reset link. Please request a new password reset from the login page.", true);
    return;
  }
  
  // Add form event listener
  el("resetPasswordForm").addEventListener("submit", handleResetPassword);
  
  // Add real-time password validation
  const newPassword = el("newPassword");
  const confirmPassword = el("confirmNewPassword");
  
  if (newPassword && confirmPassword) {
    addPasswordValidation(newPassword, confirmPassword);
    newPassword.focus();
  }
});
