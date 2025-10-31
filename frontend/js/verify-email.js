/**
 * Email Verification Page JavaScript - Enhanced with Auto-Resend
 * Version: v1.1 • Updated: 2025-08-17 10:20 AEST (Brisbane)
 * • 2025-08-16 18:00 AEST (Brisbane)
 */

class EmailVerification {
    constructor() {
        this.apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://127.0.0.1:8000' 
            : 'https://api.fetcha.net';
        
        this.userEmail = null; // Store user email for automatic resend
        this.init();
    }

    init() {
        // Get verification token and email from URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const email = urlParams.get('email');

        // Try to get email from URL params, localStorage, or referrer
        this.userEmail = email || this.extractEmailFromStorage() || this.extractEmailFromReferrer();

        if (token) {
            this.verifyEmail(token);
        } else {
            this.showError('No verification token provided');
        }

        // Set up event listeners
        this.setupEventListeners();
    }

    extractEmailFromStorage() {
        // Try to get email from recent signup session
        try {
            const recentSignup = localStorage.getItem('camoufox_recent_signup');
            if (recentSignup) {
                const signupData = JSON.parse(recentSignup);
                return signupData.email;
            }
        } catch (error) {
            console.log('Could not extract email from storage');
        }
        return null;
    }

    extractEmailFromReferrer() {
        // Try to extract email from document referrer if coming from signup
        try {
            const referrer = document.referrer;
            if (referrer && referrer.includes('login.html#signup')) {
                // Could implement more sophisticated email extraction if needed
                return null;
            }
        } catch (error) {
            console.log('Could not extract email from referrer');
        }
        return null;
    }

    setupEventListeners() {
        // Go to login button
        document.getElementById('goToLogin')?.addEventListener('click', () => {
            window.location.href = 'login.html';
        });

        // Go to signup button
        document.getElementById('goToSignup')?.addEventListener('click', () => {
            window.location.href = 'login.html#signup';
        });

        // Resend email button
        document.getElementById('resendEmail')?.addEventListener('click', () => {
            this.showResendForm();
        });

        // Cancel resend button
        document.getElementById('cancelResend')?.addEventListener('click', () => {
            this.showError('Verification failed');
        });

        // Resend email form
        document.getElementById('resendEmailForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleResendEmail();
        });
    }

    async verifyEmail(token) {
        try {
            this.showLoading();

            const response = await fetch(`${this.apiBaseUrl}/auth/verify-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token })
            });

            const data = await response.json();

            if (response.ok) {
                this.showSuccess();
            } else {
                this.showError(data.detail || 'Verification failed');
            }
        } catch (error) {
            console.error('Verification error:', error);
            this.showError('Network error. Please check your connection and try again.');
        }
    }

    async handleResendEmail() {
        const email = document.getElementById('resendEmailInput').value;
        
        if (!email) {
            this.showStatus('Please enter your email address', 'error');
            return;
        }

        try {
            this.showStatus('Sending verification email...', 'info');

            const response = await fetch(`${this.apiBaseUrl}/auth/resend-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                this.showStatus('Verification email sent! Please check your inbox.', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            } else {
                this.showStatus(data.detail || 'Failed to send verification email', 'error');
            }
        } catch (error) {
            console.error('Resend email error:', error);
            this.showStatus('Network error. Please try again.', 'error');
        }
    }

    showLoading() {
        this.hideAllStates();
        document.getElementById('loadingState').classList.remove('hidden');
        document.getElementById('verificationMessage').textContent = 'Verifying your email address...';
    }

    showSuccess() {
        this.hideAllStates();
        document.getElementById('successState').classList.remove('hidden');
        document.getElementById('verificationMessage').textContent = 'Email verified successfully!';
    }

    showError(message) {
        this.hideAllStates();
        document.getElementById('errorState').classList.remove('hidden');
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('verificationMessage').textContent = 'Verification failed';
        
        // If we have the user's email and the error indicates invalid/expired token, offer automatic resend
        if (this.userEmail && this.isTokenError(message)) {
            this.offerAutomaticResend(message);
        }
    }

    isTokenError(message) {
        // Check if the error message indicates an invalid or expired token
        const tokenErrorKeywords = [
            'invalid', 'expired', 'token', 'verification failed'
        ];
        const lowerMessage = message.toLowerCase();
        return tokenErrorKeywords.some(keyword => lowerMessage.includes(keyword));
    }

    async offerAutomaticResend(originalError) {
        // Wait a moment to let the error display, then offer automatic resend
        setTimeout(async () => {
            const shouldResend = confirm(
                `${originalError}\n\nWould you like us to send you a fresh verification email to ${this.userEmail}?`
            );
            
            if (shouldResend) {
                await this.automaticResend(this.userEmail);
            }
        }, 2000);
    }

    showAutoResendState(email) {
        this.hideAllStates();
        document.getElementById('autoResendState').classList.remove('hidden');
        document.getElementById('autoResendMessage').textContent = 
            `We're automatically sending you a new verification email to ${email}...`;
        document.getElementById('verificationMessage').textContent = 'Sending fresh verification email';
    }

    async automaticResend(email) {
        try {
            this.showAutoResendState(email);

            const response = await fetch(`${this.apiBaseUrl}/auth/resend-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                // Show success state with updated message
                this.hideAllStates();
                document.getElementById('successState').classList.remove('hidden');
                document.getElementById('verificationMessage').textContent = 'Fresh verification email sent!';
                
                // Update success message
                const successState = document.getElementById('successState');
                successState.querySelector('h2').textContent = 'Fresh Verification Email Sent!';
                successState.querySelector('p').textContent = 
                    `We've sent a new verification email to ${email}. Please check your inbox and click the new verification link.`;
                
                // Change button text
                const loginBtn = document.getElementById('goToLogin');
                if (loginBtn) {
                    loginBtn.textContent = 'Back to Sign In';
                }
            } else {
                this.showError('Failed to send fresh verification email. Please try the manual resend option.');
            }
        } catch (error) {
            console.error('Automatic resend error:', error);
            this.showError('Network error during automatic resend. Please try the manual resend option.');
        }
    }

    showResendForm() {
        this.hideAllStates();
        document.getElementById('resendForm').classList.remove('hidden');
        document.getElementById('verificationMessage').textContent = 'Resend verification email';
        
        // Pre-fill email if we have it
        if (this.userEmail) {
            const emailInput = document.getElementById('resendEmailInput');
            if (emailInput) {
                emailInput.value = this.userEmail;
            }
        }
    }

    hideAllStates() {
        const states = ['loadingState', 'successState', 'errorState', 'resendForm', 'autoResendState'];
        states.forEach(stateId => {
            document.getElementById(stateId)?.classList.add('hidden');
        });
    }

    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('verificationStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status ${type}`;
            statusElement.classList.remove('hidden');

            // Auto-hide after 5 seconds for success/info messages
            if (type === 'success' || type === 'info') {
                setTimeout(() => {
                    statusElement.classList.add('hidden');
                }, 5000);
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EmailVerification();
});
