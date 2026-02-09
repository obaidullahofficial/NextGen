class SocietyRegistrationForm:
    def __init__(self, name, type, regNo, established, authority, contact, website, city, 
                 noc_issued=False, status="pending", user_id=None, land_acquisition_status=None, 
                 procurement_status=None):
        self.name = name
        self.type = type
        self.regNo = regNo
        self.established = established
        self.authority = authority
        self.contact = contact
        self.website = website
        self.city = city
        self.noc_issued = noc_issued
        self.status = status
        self.user_id = user_id  # ID of the user who owns this society
        self.land_acquisition_status = land_acquisition_status
        self.procurement_status = procurement_status

    def to_dict(self):
        return {
            "name": self.name,
            "type": self.type,
            "regNo": self.regNo,
            "established": self.established,
            "authority": self.authority,
            "contact": self.contact,
            "website": self.website,
            "city": self.city,
            "noc_issued": self.noc_issued,
            "status": self.status,
            "user_id": self.user_id,
            "land_acquisition_status": self.land_acquisition_status,
            "procurement_status": self.procurement_status
        }


def society_registration_form_collection(db):
    return db['society_registration_forms']