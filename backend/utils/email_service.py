"""
Email Service for Account Verification
Handles token generation, email sending, and verification
"""
import secrets
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from models.email_verification import EmailVerification, email_verification_collection
from utils.db import get_db

class EmailService:
    """Service for handling email verification operations"""
    
    @staticmethod
    def generate_verification_token():
        """
        Generate a secure random token for email verification
        Returns a 32-character URL-safe token
        """
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def create_verification_token(email, token_expiry_hours=24):
        """
        Create and store a verification token in the database
        
        Args:
            email: User's email address
            token_expiry_hours: Hours until token expires (default 24)
            
        Returns:
            tuple: (token_string, token_document) or (None, error_message)
        """
        try:
            db = get_db()
            if db is None:
                return None, "Database connection failed"
            
            # Generate unique token
            token = EmailService.generate_verification_token()
            
            # Calculate expiration time
            expires_at = datetime.utcnow() + timedelta(hours=token_expiry_hours)
            
            # Create verification token document
            verification = EmailVerification(
                email=email,
                token=token,
                expires_at=expires_at,
                is_used=False
            )
            
            # Store in database
            collection = email_verification_collection(db)
            token_doc = {
                'email': verification.email,
                'token': verification.token,
                'created_at': verification.created_at,
                'expires_at': verification.expires_at,
                'is_used': verification.is_used
            }
            collection.insert_one(token_doc)
            
            print(f"[EMAIL SERVICE] Token created for {email}, expires at {expires_at}")
            return token, token_doc
            
        except Exception as e:
            print(f"[EMAIL SERVICE ERROR] Failed to create token: {str(e)}")
            return None, str(e)
    
    @staticmethod
    def send_verification_email(email, username, token):
        """
        Send verification email to user
        
        Args:
            email: Recipient's email address
            username: User's username
            token: Verification token
            
        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            # Get SMTP configuration from environment
            smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
            smtp_port = int(os.getenv('SMTP_PORT', 587))
            sender_email = os.getenv('SENDER_EMAIL')
            sender_password = os.getenv('SENDER_PASSWORD')
            verification_link_base = os.getenv('VERIFICATION_LINK_BASE', 'http://localhost:5173')
            
            # Validate configuration
            if not sender_email or not sender_password:
                return False, "Email configuration is incomplete. Please set SENDER_EMAIL and SENDER_PASSWORD in .env"
            
            # Construct verification link
            verification_link = f"{verification_link_base}/verify-email?token={token}"
            
            # Create email message
            message = MIMEMultipart('alternative')
            message['Subject'] = 'Verify Your Email - NextGenArchitect'
            message['From'] = f"NextGenArchitect <{sender_email}>"
            message['To'] = email
            
            # Plain text version
            text_content = f"""
Hello {username},

Thank you for signing up for NextGenArchitect!

To complete your registration and activate your account, please verify your email address by clicking the link below:

{verification_link}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

Best regards,
NextGenArchitect Team
"""
            
            # HTML version
            html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }}
        .header {{
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }}
        .content {{
            background-color: white;
            padding: 30px;
            border-radius: 0 0 5px 5px;
        }}
        .button {{
            display: inline-block;
            padding: 15px 30px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
        }}
        .footer {{
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to NextGenArchitect!</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{username}</strong>,</p>
            
            <p>Thank you for signing up for NextGenArchitect!</p>
            
            <p>To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
            
            <center>
                <a href="{verification_link}" class="button">Verify Email Address</a>
            </center>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">{verification_link}</p>
            
            <p><strong>Important:</strong> This link will expire in 24 hours.</p>
            
            <p>If you didn't create an account, please ignore this email.</p>
            
            <p>Best regards,<br>NextGenArchitect Team</p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
        </div>
    </div>
</body>
</html>
"""
            
            # Attach both versions
            part1 = MIMEText(text_content, 'plain')
            part2 = MIMEText(html_content, 'html')
            message.attach(part1)
            message.attach(part2)
            
            # Send email
            print(f"[EMAIL SERVICE] Connecting to {smtp_server}:{smtp_port}")
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                print(f"[EMAIL SERVICE] Logging in as {sender_email}")
                server.login(sender_email, sender_password)
                print(f"[EMAIL SERVICE] Sending email to {email}")
                server.send_message(message)
            
            print(f"[EMAIL SERVICE] ✅ Verification email sent successfully to {email}")
            return True, "Verification email sent successfully"
            
        except smtplib.SMTPAuthenticationError:
            error_msg = "Email authentication failed. Please check your SENDER_EMAIL and SENDER_PASSWORD (app password)"
            print(f"[EMAIL SERVICE ERROR] {error_msg}")
            return False, error_msg
        except smtplib.SMTPException as e:
            error_msg = f"SMTP error: {str(e)}"
            print(f"[EMAIL SERVICE ERROR] {error_msg}")
            return False, error_msg
        except Exception as e:
            error_msg = f"Failed to send email: {str(e)}"
            print(f"[EMAIL SERVICE ERROR] {error_msg}")
            return False, error_msg
    
    @staticmethod
    def verify_token(token):
        """
        Verify a token and mark it as used
        
        Args:
            token: Verification token string
            
        Returns:
            tuple: (success: bool, email_or_error: str)
        """
        try:
            db = get_db()
            if db is None:
                return False, "Database connection failed"
            
            collection = email_verification_collection(db)
            
            # Find the token
            token_doc = collection.find_one({'token': token})
            
            if not token_doc:
                return False, "Invalid or expired verification token"
            
            # Check if already used
            if token_doc.get('is_used', False):
                return False, "This verification link has already been used"
            
            # Check if expired
            if datetime.utcnow() > token_doc['expires_at']:
                return False, "This verification link has expired. Please request a new one"
            
            # Mark token as used
            collection.update_one(
                {'token': token},
                {'$set': {'is_used': True}}
            )
            
            print(f"[EMAIL SERVICE] ✅ Token verified for {token_doc['email']}")
            return True, token_doc['email']
            
        except Exception as e:
            print(f"[EMAIL SERVICE ERROR] Token verification failed: {str(e)}")
            return False, str(e)
    
    @staticmethod
    def delete_user_tokens(email):
        """
        Delete all verification tokens for a user
        
        Args:
            email: User's email address
        """
        try:
            db = get_db()
            if db is None:
                return
            
            collection = email_verification_collection(db)
            result = collection.delete_many({'email': email})
            print(f"[EMAIL SERVICE] Deleted {result.deleted_count} tokens for {email}")
            
        except Exception as e:
            print(f"[EMAIL SERVICE ERROR] Failed to delete tokens: {str(e)}")
    
    @staticmethod
    def delete_expired_tokens():
        """
        Manually delete expired tokens (TTL index handles this automatically)
        This is a fallback method
        """
        try:
            db = get_db()
            if db is None:
                return
            
            collection = email_verification_collection(db)
            result = collection.delete_many({
                'expires_at': {'$lt': datetime.utcnow()}
            })
            print(f"[EMAIL SERVICE] Deleted {result.deleted_count} expired tokens")
            
        except Exception as e:
            print(f"[EMAIL SERVICE ERROR] Failed to delete expired tokens: {str(e)}")
