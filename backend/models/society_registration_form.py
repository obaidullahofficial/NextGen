class SocietyRegistrationForm:
    def __init__(self, name, type, regNo, established, authority, contact, website, plots, 
                 status="pending", user_id=None):
        self.name = name
        self.type = type
        self.regNo = regNo
        self.established = established
        self.authority = authority
        self.contact = contact
        self.website = website
        self.plots = plots
        self.status = status
        self.user_id = user_id  # ID of the user who owns this society

    def to_dict(self):
        return {
            "name": self.name,
            "type": self.type,
            "regNo": self.regNo,
            "established": self.established,
            "authority": self.authority,
            "contact": self.contact,
            "website": self.website,
            "plots": self.plots,
            "status": self.status,
            "user_id": self.user_id
        }


def society_registration_form_collection(db):
    return db['society_registration_forms']