from datetime import datetime
from utils.db import get_db
from models.society_profile import SocietyProfile, society_profile_collection
from models.registration_form import registration_form_collection
from bson import ObjectId

class SocietyProfileController:
    
    @staticmethod
    def create_profile_from_registration(user_id, user_email):
        """Create initial society profile from approved registration form"""
        try:
            db = get_db()
            reg_forms = registration_form_collection(db)
            profiles = society_profile_collection(db)
            
            # Check if profile already exists
            existing_profile = profiles.find_one({'user_email': user_email})
            if existing_profile:
                return str(existing_profile['_id']), "Profile already exists"
            
            # Get registration form data
            registration = reg_forms.find_one({'user_email': user_email})
            if not registration:
                return None, "Registration form not found"
            
            # Create initial profile from registration data
            profile = SocietyProfile.create_from_registration(registration, user_id, user_email)
            
            # Insert into database
            result = profiles.insert_one(profile.to_dict())
            return str(result.inserted_id), "Initial profile created successfully"
            
        except Exception as e:
            return None, f"Error creating profile: {str(e)}"
    
    @staticmethod
    def get_profile_by_user_email(user_email):
        """Get society profile by user email"""
        try:
            db = get_db()
            profiles = society_profile_collection(db)
            
            profile = profiles.find_one({'user_email': user_email})
            if not profile:
                return None, "Profile not found"
            
            # Convert ObjectId to string for JSON serialization
            profile['_id'] = str(profile['_id'])
            return profile, "Profile retrieved successfully"
            
        except Exception as e:
            return None, f"Error retrieving profile: {str(e)}"
    
    @staticmethod
    def update_profile(user_email, profile_data):
        """Update society profile with complete information"""
        try:
            print(f"[DEBUG] Starting profile update for {user_email}")
            print(f"[DEBUG] Profile data received: {profile_data}")
            
            db = get_db()
            profiles = society_profile_collection(db)
            
            # Get existing profile or create if doesn't exist
            existing_profile = profiles.find_one({'user_email': user_email})
            if not existing_profile:
                # Try to create profile from registration data first
                db = get_db()
                reg_forms = registration_form_collection(db)
                registration = reg_forms.find_one({'user_email': user_email})
                
                if registration:
                    # Create basic profile structure
                    basic_profile = {
                        'user_id': registration.get('user_id', user_email),
                        'user_email': user_email,
                        'name': registration.get('name', ''),
                        'description': '',
                        'location': '',
                        'available_plots': '',
                        'price_range': '',
                        'society_logo': None,
                        'is_complete': False,
                        'created_at': datetime.utcnow(),
                        'updated_at': datetime.utcnow()
                    }
                    
                    # Insert basic profile
                    result = profiles.insert_one(basic_profile)
                    existing_profile = profiles.find_one({'_id': result.inserted_id})
                else:
                    return None, "Profile not found and registration data not available"
            
            # Update profile data
            profile_data['updated_at'] = datetime.utcnow()
            
            # Create SocietyProfile object to validate completeness
            # Ensure all string fields are properly converted to strings
            updated_profile = SocietyProfile(
                user_id=str(existing_profile['user_id']) if existing_profile['user_id'] else '',
                user_email=str(existing_profile['user_email']) if existing_profile['user_email'] else '',
                name=str(profile_data.get('name', existing_profile.get('name', ''))),
                description=str(profile_data.get('description', existing_profile.get('description', ''))),
                location=str(profile_data.get('location', existing_profile.get('location', ''))),
                available_plots=str(profile_data.get('available_plots', existing_profile.get('available_plots', ''))),
                price_range=str(profile_data.get('price_range', existing_profile.get('price_range', ''))),
                society_logo=profile_data.get('society_logo', existing_profile.get('society_logo')),  # Keep as is for base64 data
                created_at=existing_profile.get('created_at'),
                updated_at=profile_data['updated_at']
            )
            
            print(f"[DEBUG] Created SocietyProfile object with data:")
            print(f"  name: {repr(updated_profile.name)}")
            print(f"  description: {repr(updated_profile.description)}")
            print(f"  location: {repr(updated_profile.location)}")
            print(f"  available_plots: {repr(updated_profile.available_plots)}")
            print(f"  price_range: {repr(updated_profile.price_range)}")
            print(f"  has_logo: {bool(updated_profile.society_logo)}")
            
            # Check completeness
            print(f"[DEBUG] Validating profile completeness...")
            try:
                is_complete = updated_profile.validate_completeness()
                profile_data['is_complete'] = is_complete
                print(f"[DEBUG] Profile completeness result: {is_complete}")
            except Exception as completeness_error:
                print(f"[ERROR] Error during completeness validation: {completeness_error}")
                print(f"[ERROR] Error type: {type(completeness_error)}")
                # Set completeness to False if validation fails
                profile_data['is_complete'] = False
                is_complete = False
            
            # Update in database
            print(f"[DEBUG] Updating database with data: {profile_data}")
            try:
                result = profiles.update_one(
                    {'user_email': user_email},
                    {'$set': profile_data}
                )
                print(f"[DEBUG] Database update result: modified_count={result.modified_count}, matched_count={result.matched_count}")
            except Exception as db_error:
                print(f"[ERROR] Database update error: {db_error}")
                print(f"[ERROR] Database error type: {type(db_error)}")
                raise
            
            if result.modified_count > 0:
                return True, "Profile updated successfully"
            else:
                return False, "No changes made to profile"
                
        except Exception as e:
            return None, f"Error updating profile: {str(e)}"
    
    @staticmethod
    def check_profile_completeness(user_email):
        """Check if society profile is complete"""
        try:
            profile, message = SocietyProfileController.get_profile_by_user_email(user_email)
            if not profile:
                return False, "Profile not found"
            
            return profile.get('is_complete', False), "Profile completeness checked"
            
        except Exception as e:
            return False, f"Error checking profile completeness: {str(e)}"
    
    @staticmethod
    def get_missing_fields(user_email):
        """Get list of missing required fields"""
        try:
            profile, message = SocietyProfileController.get_profile_by_user_email(user_email)
            if not profile:
                return [], "Profile not found"
            
            required_fields = {
                'name': 'Society Name',
                'description': 'Description',
                'location': 'Location',
                'available_plots': 'Available Plots',
                'price_range': 'Price Range'
            }
            
            missing_fields = []
            
            for field_key, field_name in required_fields.items():
                field_value = profile.get(field_key, '')
                if not field_value or str(field_value).strip() == '':
                    missing_fields.append(field_name)
            
            # Check society logo
            if not profile.get('society_logo'):
                missing_fields.append('Society Logo (PNG file required)')
            
            return missing_fields, "Missing fields retrieved"
            
        except Exception as e:
            return [], f"Error getting missing fields: {str(e)}"
