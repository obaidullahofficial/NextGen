# backend/controllers/advertisement_controller.py
from models.advertisement import Advertisement
from bson import ObjectId
import re

class AdvertisementController:
    
    @staticmethod
    def create_advertisement(advertisement_data, user_email):
        """Create a new advertisement"""
        try:
            # Validate required fields
            required_fields = ['society_name', 'location', 'plot_sizes', 'price_start', 'contact_number']
            for field in required_fields:
                if field not in advertisement_data or not advertisement_data[field]:
                    return {
                        "success": False,
                        "error": f"{field.replace('_', ' ').title()} is required"
                    }
            
            # Validate plot sizes
            valid_plot_sizes = ['5 Marla', '10 Marla', '1 Kanal', '2 Kanal', '5 Kanal', '1 Acre']
            plot_sizes = advertisement_data.get('plot_sizes', [])
            if not isinstance(plot_sizes, list) or not plot_sizes:
                return {
                    "success": False,
                    "error": "At least one plot size must be selected"
                }
            
            for size in plot_sizes:
                if size not in valid_plot_sizes:
                    return {
                        "success": False,
                        "error": f"Invalid plot size: {size}"
                    }
            
            # Validate price
            price_start = advertisement_data.get('price_start')
            if not isinstance(price_start, (int, float)) or price_start <= 0:
                return {
                    "success": False,
                    "error": "Price must be a positive number"
                }
            
            # Validate contact number
            contact_number = advertisement_data.get('contact_number', '')
            if not re.match(r'^[\+]?[\d\s\-\(\)]{10,15}$', contact_number):
                return {
                    "success": False,
                    "error": "Please provide a valid contact number"
                }
            
            # Validate status
            valid_statuses = ['active', 'inactive', 'pending', 'expired']
            status = advertisement_data.get('status', 'active')
            if status not in valid_statuses:
                advertisement_data['status'] = 'active'
            
            # Add user email as creator
            advertisement_data['created_by'] = user_email
            
            # Create advertisement
            advertisement_model = Advertisement()
            advertisement_id = advertisement_model.create_advertisement(advertisement_data)
            
            # Get the created advertisement
            new_advertisement = advertisement_model.get_advertisement_by_id(advertisement_id)
            
            return {
                "success": True,
                "data": new_advertisement,
                "message": "Advertisement created successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to create advertisement: {str(e)}"
            }

    @staticmethod
    def get_all_advertisements(page=1, per_page=10, filters=None, sort_by="created_at", sort_order="desc"):
        """Get all advertisements with pagination and filtering"""
        try:
            # Convert sort order
            sort_order_value = -1 if sort_order == "desc" else 1
            
            advertisement_model = Advertisement()
            result = advertisement_model.get_all_advertisements(
                filters=filters,
                page=page,
                per_page=per_page,
                sort_by=sort_by,
                sort_order=sort_order_value
            )
            
            return {
                "success": True,
                "data": result['advertisements'],
                "pagination": {
                    "current_page": result['page'],
                    "per_page": result['per_page'],
                    "total_pages": result['total_pages'],
                    "total_count": result['total_count']
                },
                "message": "Advertisements fetched successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to fetch advertisements: {str(e)}"
            }

    @staticmethod
    def get_advertisement_by_id(advertisement_id):
        """Get advertisement by ID"""
        try:
            # Validate ObjectId
            if not ObjectId.is_valid(advertisement_id):
                return {
                    "success": False,
                    "error": "Invalid advertisement ID format"
                }
            
            advertisement_model = Advertisement()
            advertisement = advertisement_model.get_advertisement_by_id(advertisement_id)
            
            if not advertisement:
                return {
                    "success": False,
                    "error": "Advertisement not found"
                }
            
            return {
                "success": True,
                "data": advertisement,
                "message": "Advertisement fetched successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to fetch advertisement: {str(e)}"
            }

    @staticmethod
    def update_advertisement(advertisement_id, update_data, user_email, user_role=None):
        """Update advertisement (only by creator or admin)"""
        try:
            # Validate ObjectId
            if not ObjectId.is_valid(advertisement_id):
                return {
                    "success": False,
                    "error": "Invalid advertisement ID format"
                }
            
            advertisement_model = Advertisement()
            
            # Check if advertisement exists and user has permission
            existing_ad = advertisement_model.get_advertisement_by_id(advertisement_id)
            if not existing_ad:
                return {
                    "success": False,
                    "error": "Advertisement not found"
                }
            
            # Debug logging
            print(f"[UPDATE AD] User: {user_email}, Role: {user_role}")
            print(f"[UPDATE AD] Creator: {existing_ad.get('created_by')}")
            print(f"[UPDATE AD] Is Admin: {user_role == 'admin'}")
            
            # Check permission (creator or admin can update)
            if existing_ad['created_by'] != user_email and user_role != 'admin':
                return {
                    "success": False,
                    "error": "You don't have permission to update this advertisement"
                }
            
            # Validate fields if provided
            if 'plot_sizes' in update_data:
                valid_plot_sizes = ['5 Marla', '10 Marla', '1 Kanal', '2 Kanal', '5 Kanal', '1 Acre']
                plot_sizes = update_data['plot_sizes']
                if not isinstance(plot_sizes, list) or not plot_sizes:
                    return {
                        "success": False,
                        "error": "At least one plot size must be selected"
                    }
                
                for size in plot_sizes:
                    if size not in valid_plot_sizes:
                        return {
                            "success": False,
                            "error": f"Invalid plot size: {size}"
                        }
            
            if 'price_start' in update_data:
                price_start = update_data['price_start']
                if not isinstance(price_start, (int, float)) or price_start <= 0:
                    return {
                        "success": False,
                        "error": "Price must be a positive number"
                    }
            
            if 'contact_number' in update_data:
                contact_number = update_data['contact_number']
                if not re.match(r'^[\+]?[\d\s\-\(\)]{10,15}$', contact_number):
                    return {
                        "success": False,
                        "error": "Please provide a valid contact number"
                    }
            
            if 'status' in update_data:
                valid_statuses = ['active', 'inactive', 'pending', 'expired']
                if update_data['status'] not in valid_statuses:
                    return {
                        "success": False,
                        "error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
                    }
            
            # Update advertisement
            updated_advertisement = advertisement_model.update_advertisement(advertisement_id, update_data)
            
            if not updated_advertisement:
                return {
                    "success": False,
                    "error": "Failed to update advertisement"
                }
            
            return {
                "success": True,
                "data": updated_advertisement,
                "message": "Advertisement updated successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to update advertisement: {str(e)}"
            }

    @staticmethod
    def delete_advertisement(advertisement_id, user_email, user_role=None):
        """Delete advertisement (only by creator or admin)"""
        try:
            # Validate ObjectId
            if not ObjectId.is_valid(advertisement_id):
                return {
                    "success": False,
                    "error": "Invalid advertisement ID format"
                }
            
            advertisement_model = Advertisement()
            
            # Check if advertisement exists
            existing_ad = advertisement_model.get_advertisement_by_id(advertisement_id)
            if not existing_ad:
                return {
                    "success": False,
                    "error": "Advertisement not found"
                }
            
            # Check permission (creator or admin can delete)
            if existing_ad['created_by'] != user_email and user_role != 'admin':
                return {
                    "success": False,
                    "error": "You don't have permission to delete this advertisement"
                }
            
            # Delete advertisement
            deleted = advertisement_model.delete_advertisement(advertisement_id)
            
            if not deleted:
                return {
                    "success": False,
                    "error": "Failed to delete advertisement"
                }
            
            return {
                "success": True,
                "message": "Advertisement deleted successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to delete advertisement: {str(e)}"
            }

    @staticmethod
    def get_advertisements_by_user(user_email, page=1, per_page=10):
        """Get advertisements created by a specific user"""
        try:
            advertisement_model = Advertisement()
            result = advertisement_model.get_advertisements_by_user(user_email, page, per_page)
            
            return {
                "success": True,
                "data": result['advertisements'],
                "pagination": {
                    "current_page": result['page'],
                    "per_page": result['per_page'],
                    "total_pages": result['total_pages'],
                    "total_count": result['total_count']
                },
                "message": "User advertisements fetched successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to fetch user advertisements: {str(e)}"
            }

    @staticmethod
    def search_advertisements(search_term, page=1, per_page=10):
        """Search advertisements"""
        try:
            if not search_term or len(search_term.strip()) < 2:
                return {
                    "success": False,
                    "error": "Search term must be at least 2 characters long"
                }
            
            advertisement_model = Advertisement()
            result = advertisement_model.search_advertisements(search_term.strip(), page, per_page)
            
            return {
                "success": True,
                "data": result['advertisements'],
                "pagination": {
                    "current_page": result['page'],
                    "per_page": result['per_page'],
                    "total_pages": result['total_pages'],
                    "total_count": result['total_count']
                },
                "message": f"Search results for '{search_term}'"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to search advertisements: {str(e)}"
            }

    @staticmethod
    def get_featured_advertisements(limit=5):
        """Get featured advertisements"""
        try:
            advertisement_model = Advertisement()
            advertisements = advertisement_model.get_featured_advertisements(limit)
            
            return {
                "success": True,
                "data": advertisements,
                "message": "Featured advertisements fetched successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to fetch featured advertisements: {str(e)}"
            }

    @staticmethod
    def increment_view_count(advertisement_id):
        """Increment view count"""
        try:
            if not ObjectId.is_valid(advertisement_id):
                return {
                    "success": False,
                    "error": "Invalid advertisement ID format"
                }
            
            advertisement_model = Advertisement()
            updated = advertisement_model.increment_view_count(advertisement_id)
            
            return {
                "success": updated,
                "message": "View count updated" if updated else "Failed to update view count"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to update view count: {str(e)}"
            }

    @staticmethod
    def increment_contact_count(advertisement_id):
        """Increment contact count"""
        try:
            if not ObjectId.is_valid(advertisement_id):
                return {
                    "success": False,
                    "error": "Invalid advertisement ID format"
                }
            
            advertisement_model = Advertisement()
            updated = advertisement_model.increment_contact_count(advertisement_id)
            
            return {
                "success": updated,
                "message": "Contact count updated" if updated else "Failed to update contact count"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to update contact count: {str(e)}"
            }

    @staticmethod
    def get_advertisement_stats():
        """Get advertisement statistics"""
        try:
            advertisement_model = Advertisement()
            stats = advertisement_model.get_advertisement_stats()
            
            return {
                "success": True,
                "data": stats,
                "message": "Advertisement statistics fetched successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to fetch advertisement statistics: {str(e)}"
            }
