# backend/routes/payment_routes.py
from flask import Blueprint, request, jsonify
from functools import wraps
from controllers.payment_controller import PaymentController
import jwt
import os

payment_bp = Blueprint('payment', __name__)
payment_controller = PaymentController()

# Use the same JWT secret as app.py
JWT_SECRET = os.getenv('JWT_SECRET_KEY', '6b30c0cdbdc749228ae16f07492b441310eac85611cbd607e1e110237218f89b')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'success': False, 'error': 'Token is missing'}), 401
        try:
            token = token.split(' ')[1] if ' ' in token else token
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            kwargs['current_user'] = data
        except Exception as e:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated

@payment_bp.route('/create-checkout-session', methods=['POST'])
@token_required
def create_checkout_session(current_user):
    """
    Create Stripe checkout session for advertisement payment
    POST /api/payment/create-checkout-session
    Body: {
        "advertisement_id": "ad_id",
        "plan_name": "Weekly Plan",
        "plan_price": 150.00  # PKR
    }
    Returns PKR and USD price for display.
    """
    try:
        data = request.get_json()
        advertisement_id = data.get('advertisement_id')
        plan_name = data.get('plan_name')
        plan_price = data.get('plan_price')  # PKR
        user_email = current_user.get('email')

        if not all([advertisement_id, plan_name, plan_price]):
            return jsonify({
                'success': False,
                'error': 'Missing required fields'
            }), 400

        result = payment_controller.create_checkout_session(
            advertisement_id,
            plan_name,
            plan_price,
            user_email
        )

        if result['success']:
            # Add explicit PKR and USD price to response for frontend display
            return jsonify({
                **result,
                'display_message': f"You will be charged Rs. {result.get('plan_price_pkr')} (converted to ${result.get('plan_price_usd')} USD at rate {result.get('conversion_rate'):.4f})"
            }), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@payment_bp.route('/verify-payment', methods=['POST'])
@token_required
def verify_payment(current_user):
    """
    Verify payment status
    POST /api/payment/verify-payment
    Body: {
        "session_id": "stripe_session_id"
    }
    """
    try:
        data = request.get_json()
        session_id = data.get('session_id')

        if not session_id:
            return jsonify({
                'success': False,
                'error': 'Session ID is required'
            }), 400

        result = payment_controller.verify_payment(session_id)

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@payment_bp.route('/payment-success', methods=['POST'])
@token_required
def payment_success(current_user):
    """
    Handle successful payment
    POST /api/payment/payment-success
    Body: {
        "session_id": "stripe_session_id"
    }
    """
    try:
        data = request.get_json()
        session_id = data.get('session_id')

        if not session_id:
            return jsonify({
                'success': False,
                'error': 'Session ID is required'
            }), 400

        result = payment_controller.handle_payment_success(session_id)

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@payment_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """
    Handle Stripe webhook events
    POST /api/payment/webhook
    """
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')

    try:
        result = payment_controller.handle_webhook(payload, sig_header)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
