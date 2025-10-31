"""
Fetcha Weather - Email Service
Version: v1.0 • Updated: 2025-10-31 19:46 AEST (Brisbane)

Handles sending emails via Gmail SMTP
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """
    Email service for sending transactional emails via Gmail SMTP
    """
    
    def __init__(self, config):
        """
        Initialize email service with configuration
        
        Args:
            config: Flask config object
        """
        self.smtp_server = config.get('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = config.get('SMTP_PORT', 587)
        self.smtp_use_ssl = config.get('SMTP_USE_SSL', 'false').lower() == 'true'
        self.smtp_username = config.get('SMTP_USERNAME')
        self.smtp_password = config.get('SMTP_PASSWORD')
        self.email_from = config.get('EMAIL_FROM', 'noreply@fetcha.net')
        self.email_from_name = config.get('EMAIL_FROM_NAME', 'Fetcha Weather')
        self.frontend_url = config.get('FRONTEND_URL', 'http://localhost:3000')
        
    def send_email(self, to_email: str, subject: str, html_body: str, text_body: Optional[str] = None) -> Dict:
        """
        Send an email via Gmail SMTP
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_body: HTML version of email body
            text_body: Plain text version of email body (optional)
            
        Returns:
            Dict with success status and message
        """
        try:
            # Validate SMTP credentials
            if not self.smtp_username or not self.smtp_password:
                logger.error('SMTP credentials not configured')
                return {
                    'success': False,
                    'error': 'Email service not configured'
                }
            
            # Create message
            message = MIMEMultipart('alternative')
            message['Subject'] = subject
            message['From'] = f"{self.email_from_name} <{self.email_from}>"
            message['To'] = to_email
            
            # Add plain text version if provided, otherwise create simple version
            if text_body:
                text_part = MIMEText(text_body, 'plain')
            else:
                # Create simple text version by stripping HTML
                import re
                text_body = re.sub('<[^<]+?>', '', html_body)
                text_part = MIMEText(text_body, 'plain')
            
            html_part = MIMEText(html_body, 'html')
            
            # Attach parts
            message.attach(text_part)
            message.attach(html_part)
            
            # Send email - use SSL or STARTTLS based on configuration
            if self.smtp_use_ssl:
                # Use SSL (port 465) - for GoDaddy/SecureServer
                with smtplib.SMTP_SSL(self.smtp_server, self.smtp_port) as server:
                    server.login(self.smtp_username, self.smtp_password)
                    server.sendmail(self.email_from, to_email, message.as_string())
            else:
                # Use STARTTLS (port 587) - for Gmail
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.smtp_username, self.smtp_password)
                    server.sendmail(self.email_from, to_email, message.as_string())
            
            logger.info(f'Email sent successfully to {to_email}')
            return {
                'success': True,
                'message': 'Email sent successfully'
            }
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f'SMTP authentication failed: {str(e)}')
            return {
                'success': False,
                'error': 'Email authentication failed'
            }
        except smtplib.SMTPException as e:
            logger.error(f'SMTP error sending email to {to_email}: {str(e)}')
            return {
                'success': False,
                'error': 'Failed to send email'
            }
        except Exception as e:
            logger.error(f'Unexpected error sending email to {to_email}: {str(e)}')
            return {
                'success': False,
                'error': 'An error occurred while sending email'
            }
    
    def send_verification_email(self, to_email: str, verification_token: str, user_name: str = None) -> Dict:
        """
        Send email verification email
        
        Args:
            to_email: User's email address
            verification_token: Verification token
            user_name: User's name (optional)
            
        Returns:
            Dict with success status and message
        """
        verification_url = f"{self.frontend_url}/verify-email.html?token={verification_token}&email={to_email}"
        
        subject = "Verify Your Fetcha Account"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .container {{
                    background: #ffffff;
                    border-radius: 8px;
                    padding: 30px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 30px;
                }}
                .logo {{
                    font-size: 28px;
                    font-weight: 600;
                    color: #2c3e50;
                }}
                .button {{
                    display: inline-block;
                    padding: 14px 28px;
                    background: #3b82f6;
                    color: #ffffff !important;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: 600;
                    margin: 20px 0;
                }}
                .button:hover {{
                    background: #2563eb;
                }}
                .footer {{
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    font-size: 14px;
                    color: #6b7280;
                    text-align: center;
                }}
                .link {{
                    color: #3b82f6;
                    word-break: break-all;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">Fetcha ⚡</div>
                    <h1 style="color: #2c3e50; margin: 10px 0;">Verify Your Email Address</h1>
                </div>
                
                <p>{"Hi " + user_name + "," if user_name else "Hi there,"}</p>
                
                <p>Thanks for signing up for Fetcha! To complete your registration and start accessing Australian weather data, please verify your email address.</p>
                
                <div style="text-align: center;">
                    <a href="{verification_url}" class="button">Verify Email Address</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p class="link">{verification_url}</p>
                
                <p><strong>This link will expire in 24 hours.</strong></p>
                
                <div class="footer">
                    <p>If you didn't create an account with Fetcha, you can safely ignore this email.</p>
                    <p>© 2025 Fetcha Weather. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Verify Your Email Address
        
        {"Hi " + user_name + "," if user_name else "Hi there,"}
        
        Thanks for signing up for Fetcha! To complete your registration and start accessing Australian weather data, please verify your email address.
        
        Click the link below to verify your email:
        {verification_url}
        
        This link will expire in 24 hours.
        
        If you didn't create an account with Fetcha, you can safely ignore this email.
        
        © 2025 Fetcha Weather. All rights reserved.
        """
        
        return self.send_email(to_email, subject, html_body, text_body)
    
    def send_password_reset_email(self, to_email: str, reset_token: str, user_name: str = None) -> Dict:
        """
        Send password reset email
        
        Args:
            to_email: User's email address
            reset_token: Password reset token
            user_name: User's name (optional)
            
        Returns:
            Dict with success status and message
        """
        reset_url = f"{self.frontend_url}/reset-password.html?token={reset_token}"
        
        subject = "Reset Your Fetcha Password"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .container {{
                    background: #ffffff;
                    border-radius: 8px;
                    padding: 30px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 30px;
                }}
                .logo {{
                    font-size: 28px;
                    font-weight: 600;
                    color: #2c3e50;
                }}
                .button {{
                    display: inline-block;
                    padding: 14px 28px;
                    background: #3b82f6;
                    color: #ffffff !important;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: 600;
                    margin: 20px 0;
                }}
                .button:hover {{
                    background: #2563eb;
                }}
                .footer {{
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    font-size: 14px;
                    color: #6b7280;
                    text-align: center;
                }}
                .link {{
                    color: #3b82f6;
                    word-break: break-all;
                }}
                .warning {{
                    background: #fef3c7;
                    border-left: 4px solid #f59e0b;
                    padding: 12px;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">Fetcha ⚡</div>
                    <h1 style="color: #2c3e50; margin: 10px 0;">Reset Your Password</h1>
                </div>
                
                <p>{"Hi " + user_name + "," if user_name else "Hi there,"}</p>
                
                <p>We received a request to reset your password for your Fetcha account. Click the button below to choose a new password:</p>
                
                <div style="text-align: center;">
                    <a href="{reset_url}" class="button">Reset Password</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p class="link">{reset_url}</p>
                
                <div class="warning">
                    <strong>⚠️ This link will expire in 1 hour.</strong>
                </div>
                
                <div class="footer">
                    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                    <p>© 2025 Fetcha Weather. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Reset Your Password
        
        {"Hi " + user_name + "," if user_name else "Hi there,"}
        
        We received a request to reset your password for your Fetcha account. Click the link below to choose a new password:
        
        {reset_url}
        
        ⚠️ This link will expire in 1 hour.
        
        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        
        © 2025 Fetcha Weather. All rights reserved.
        """
        
        return self.send_email(to_email, subject, html_body, text_body)
