"""
Email Service for Account Verification
Handles code generation, email sending, and verification
"""
import secrets
import random
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
    def generate_verification_code():
        """
        Generate a 6-digit verification code
        Returns a string like "123456"
        """
        return ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    @staticmethod
    def generate_verification_token():
        """
        Generate a secure random token (kept for backward compatibility)
        Returns a 32-character URL-safe token
        """
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def create_verification_code(email, code_expiry_minutes=10):
        """
        Create and store a verification code in the database
        
        Args:
            email: User's email address
            code_expiry_minutes: Minutes until code expires (default 10)
            
        Returns:
            tuple: (code_string, code_document) or (None, error_message)
        """
        try:
            db = get_db()
            if db is None:
                return None, "Database connection failed"
            
            # Generate unique 6-digit code
            code = EmailService.generate_verification_code()
            
            # Calculate expiration time
            expires_at = datetime.utcnow() + timedelta(minutes=code_expiry_minutes)
            
            # Create verification code document
            verification = EmailVerification(
                email=email,
                code=code,
                expires_at=expires_at,
                is_used=False
            )
            
            # Store in database
            collection = email_verification_collection(db)
            code_doc = {
                'email': verification.email,
                'code': verification.code,
                'token': EmailService.generate_verification_token(),  # Keep token for backward compatibility
                'created_at': verification.created_at,
                'expires_at': verification.expires_at,
                'is_used': verification.is_used
            }
            collection.insert_one(code_doc)
            
            print(f"[EMAIL SERVICE] Code created for {email}, expires at {expires_at}")
            return code, code_doc
            
        except Exception as e:
            print(f"[EMAIL SERVICE ERROR] Failed to create code: {str(e)}")
            return None, str(e)
    
    @staticmethod
    def send_verification_email(email, username, code):
        """
        Send verification email to user
        
        Args:
            email: Recipient's email address
            username: User's username
            code: 6-digit verification code
            
        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            # Get SMTP configuration from environment
            smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
            smtp_port = int(os.getenv('SMTP_PORT', 587))
            sender_email = os.getenv('SENDER_EMAIL')
            sender_password = os.getenv('SENDER_PASSWORD')
            
            # Validate configuration
            if not sender_email or not sender_password:
                return False, "Email configuration is incomplete. Please set SENDER_EMAIL and SENDER_PASSWORD in .env"
            
            # Create email message
            message = MIMEMultipart('alternative')
            message['Subject'] = 'Verify Your Email - NextGenArchitect'
            message['From'] = f"NextGenArchitect <{sender_email}>"
            message['To'] = email
            
            # Plain text version
            text_content = f"""
Hello {username},

Thank you for signing up for NextGenArchitect!

To complete your registration and activate your account, please enter the following verification code:

{code}

This code will expire in 10 minutes.

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
        .code-box {{
            background-color: #f0f0f0;
            border: 2px dashed #4CAF50;
            padding: 20px;
            text-align: center;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #4CAF50;
            margin: 20px 0;
            border-radius: 5px;
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
            
            <p>To complete your registration and activate your account, please enter the following verification code:</p>
            
            <div class="code-box">{code}</div>
            
            <p><strong>Important:</strong> This code will expire in 10 minutes.</p>
            
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
    def verify_code(code):
        """
        Verify a 6-digit code and mark it as used
        
        Args:
            code: 6-digit verification code string
            
        Returns:
            tuple: (success: bool, email_or_error: str)
        """
        try:
            db = get_db()
            if db is None:
                return False, "Database connection failed"
            
            collection = email_verification_collection(db)
            
            # Find the code
            code_doc = collection.find_one({'code': code})
            
            if not code_doc:
                return False, "Invalid or expired verification code"
            
            # Check if already used
            if code_doc.get('is_used', False):
                return False, "This verification code has already been used"
            
            # Check if expired
            if datetime.utcnow() > code_doc['expires_at']:
                return False, "This verification code has expired. Please request a new one"
            
            # Mark code as used
            collection.update_one(
                {'code': code},
                {'$set': {'is_used': True}}
            )
            
            print(f"[EMAIL SERVICE] ✅ Code verified for {code_doc['email']}")
            return True, code_doc['email']
            
        except Exception as e:
            print(f"[EMAIL SERVICE ERROR] Code verification failed: {str(e)}")
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
