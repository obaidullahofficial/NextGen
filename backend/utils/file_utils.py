import os
import uuid
from flask import current_app
from werkzeug.utils import secure_filename

class FileUploadUtils:
    """Utility class for handling file uploads"""
    
    ALLOWED_EXTENSIONS = {
        'images': {'png', 'jpg', 'jpeg', 'gif'},
        'documents': {'pdf', 'doc', 'docx'},
        'all': {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx'}
    }
    
    @staticmethod
    def allowed_file(filename, file_type='all'):
        """Check if the file has an allowed extension"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in FileUploadUtils.ALLOWED_EXTENSIONS.get(file_type, set())
    
    @staticmethod
    def save_file(file, upload_path, allowed_extensions=None):
        """Save uploaded file and return the file path"""
        if not file:
            return None
            
        if allowed_extensions and not FileUploadUtils.allowed_file(file.filename, allowed_extensions):
            return None
            
        # Create upload directory if it doesn't exist
        os.makedirs(upload_path, exist_ok=True)
        
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(upload_path, unique_filename)
        
        try:
            # Save file
            file.save(file_path)
            return file_path
        except Exception as e:
            print(f"Error saving file: {str(e)}")
            return None
    
    @staticmethod
    def delete_file(file_path):
        """Delete a file if it exists"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception as e:
            print(f"Error deleting file: {str(e)}")
            return False
    
    @staticmethod
    def get_file_url(file_path, base_url=""):
        """Get URL for accessing uploaded file"""
        if not file_path:
            return None
        return f"{base_url}/uploads/{file_path.replace(os.sep, '/')}"