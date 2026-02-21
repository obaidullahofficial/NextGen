from flask import Blueprint
from controllers.template_controller import (
    approve_as_template,
    unapprove_template,
    get_society_templates,
    get_all_society_floorplans
)

template_bp = Blueprint('template', __name__)

# Template routes
template_bp.route('/approve', methods=['POST'])(approve_as_template)
template_bp.route('/unapprove', methods=['POST'])(unapprove_template)
template_bp.route('/society/<society_id>', methods=['GET'])(get_society_templates)
template_bp.route('/all/<society_id>', methods=['GET'])(get_all_society_floorplans)
