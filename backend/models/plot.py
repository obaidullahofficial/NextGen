from datetime import datetime
from bson import ObjectId

class Plot:
    def __init__(self, plot_number, societyId, price, status='Available', type='Residential Plot', 
                 area='', dimension_x=0, dimension_y=0, location='', description=None, 
                 seller=None, amenities=None, image=None, plot_id=None, created_at=None, updated_at=None):
        
        self.plot_id = plot_id
        self.plot_number = plot_number
        self.societyId = societyId
        self.image = image
        self.price = price
        self.status = status
        self.type = type
        self.area = area
        self.dimension_x = dimension_x
        self.dimension_y = dimension_y
        self.location = location
        self.description = description or []
        self.seller = seller or {}
        self.amenities = amenities or []
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()
    
    def to_dict(self):
        return {
            "plot_id": self.plot_id,
            "plot_number": self.plot_number,
            "societyId": self.societyId,
            "image": self.image,
            "price": self.price,
            "status": self.status,
            "type": self.type,
            "area": self.area,
            "dimension_x": self.dimension_x,
            "dimension_y": self.dimension_y,
            "location": self.location,
            "description": self.description,
            "seller": self.seller,
            "amenities": self.amenities,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
        
    def validate(self):
        """Validate plot data"""
        required_fields = [
            self.plot_number, self.societyId, self.price,
            self.status, self.type, self.area
        ]
        
        # Check if all required fields have values
        return all(field and str(field).strip() for field in required_fields)


def plot_collection(db):
    return db['plots']
