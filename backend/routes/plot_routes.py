from flask import Blueprint
from controllers.plot_controller import PlotController

plot_bp = Blueprint('plot_bp', __name__)

# Plot routes
plot_bp.route('/plots', methods=['POST'])(PlotController.create_plot)
plot_bp.route('/plots', methods=['GET'])(PlotController.get_all_plots)
plot_bp.route('/plots/<plot_id>', methods=['GET'])(PlotController.get_plot)
plot_bp.route('/plots/<plot_id>', methods=['PUT'])(PlotController.update_plot)
plot_bp.route('/plots/<plot_id>', methods=['DELETE'])(PlotController.delete_plot)