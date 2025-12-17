# backend/controllers/payment_controller.py
import stripe
import os
from datetime import datetime
from controllers.advertisement_controller import AdvertisementController
from models.advertisement import Advertisement

# Initialize Stripe with your secret key
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

class PaymentController:
    def __init__(self):
        self.advertisement_controller = AdvertisementController()
        self.advertisement_model = Advertisement()

    @staticmethod
    def create_checkout_session(advertisement_id, plan_name, plan_price_pkr, user_email):
        """
        Create a Stripe checkout session for advertisement payment
        plan_price_pkr: price in PKR (Rupees)
        """
        try:
            from utils.currency import get_pkr_to_usd_rate
            # Convert PKR to USD
            rate = get_pkr_to_usd_rate()
            plan_price_usd = plan_price_pkr * rate
            
            # Stripe requires minimum $0.50 USD
            if plan_price_usd < 0.50:
                return {
                    'success': False,
                    'error': f'Minimum payment amount is $0.50 USD. Current plan price is ${plan_price_usd:.2f}. Please update the plan price.'
                }

            # Create Stripe checkout session
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[
                    {
                        'price_data': {
                            'currency': 'usd',
                            'product_data': {
                                'name': f'Advertisement Plan: {plan_name}',
                                'description': f'Advertisement subscription for {plan_name} (Rs. {plan_price_pkr})',
                            },
                            'unit_amount': int(plan_price_usd * 100),  # Stripe uses cents
                        },
                        'quantity': 1,
                    },
                ],
                mode='payment',
                success_url=os.getenv('FRONTEND_URL', 'http://localhost:5173') + f'/payment-success?session_id={{CHECKOUT_SESSION_ID}}&ad_id={advertisement_id}',
                cancel_url=os.getenv('FRONTEND_URL', 'http://localhost:5173') + '/payment-cancelled',
                customer_email=user_email,
                metadata={
                    'advertisement_id': advertisement_id,
                    'plan_price_pkr': plan_price_pkr,
                    'plan_price_usd': plan_price_usd,
                    'conversion_rate': rate,
                    'plan_name': plan_name
                }
            )

            return {
                'success': True,
                'session_id': checkout_session.id,
                'checkout_url': checkout_session.url,
                'plan_price_pkr': plan_price_pkr,
                'plan_price_usd': round(plan_price_usd, 2),
                'conversion_rate': rate
            }

        except stripe.error.StripeError as e:
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Payment session creation failed: {str(e)}'
            }

    @staticmethod
    def verify_payment(session_id):
        """
        Verify payment status from Stripe
        """
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            
            return {
                'success': True,
                'payment_status': session.payment_status,
                'advertisement_id': session.metadata.get('advertisement_id'),
                'amount_total': session.amount_total / 100,  # Convert from cents
                'customer_email': session.customer_details.email if session.customer_details else None
            }

        except stripe.error.StripeError as e:
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Payment verification failed: {str(e)}'
            }

    def handle_payment_success(self, session_id):
        """
        Handle successful payment and update advertisement status
        """
        try:
            # Verify payment with Stripe
            verification = self.verify_payment(session_id)
            
            if not verification['success']:
                return verification

            if verification['payment_status'] != 'paid':
                return {
                    'success': False,
                    'error': 'Payment not completed'
                }

            advertisement_id = verification['advertisement_id']
            
            # Update advertisement to mark as paid
            # Note: Advertisement still remains 'pending' for admin approval
            # You can add a 'payment_status' field to track this
            ad = self.advertisement_model.get_advertisement_by_id(advertisement_id)
            
            if not ad:
                return {
                    'success': False,
                    'error': 'Advertisement not found'
                }

            # Update payment info (you may want to add these fields to your model)
            self.advertisement_model.update_advertisement(
                advertisement_id,
                {
                    'payment_status': 'paid',
                    'payment_id': session_id,
                    'paid_at': datetime.utcnow()
                }
            )

            return {
                'success': True,
                'message': 'Payment successful. Your advertisement is pending admin approval.',
                'advertisement': ad
            }

        except Exception as e:
            return {
                'success': False,
                'error': f'Payment processing failed: {str(e)}'
            }

    @staticmethod
    def handle_webhook(payload, sig_header):
        """
        Handle Stripe webhook events
        """
        try:
            webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
            
            # Skip webhook verification if webhook_secret not set (for development)
            if not webhook_secret:
                # Parse payload without verification (NOT for production)
                import json
                event = json.loads(payload)
            else:
                # Verify webhook signature (production)
                event = stripe.Webhook.construct_event(
                    payload, sig_header, webhook_secret
                )

            # Handle different event types
            if event['type'] == 'checkout.session.completed':
                session = event['data']['object']
                advertisement_id = session['metadata']['advertisement_id']
                
                # Update advertisement payment status
                advertisement_model = Advertisement()
                advertisement_model.update_advertisement(
                    advertisement_id,
                    {
                        'payment_status': 'paid',
                        'payment_id': session['id'],
                        'paid_at': datetime.utcnow()
                    }
                )
                
                return {'success': True, 'message': 'Webhook processed'}

            elif event['type'] == 'checkout.session.expired':
                session = event['data']['object']
                advertisement_id = session['metadata']['advertisement_id']
                
                # Mark payment as failed
                advertisement_model = Advertisement()
                advertisement_model.update_advertisement(
                    advertisement_id,
                    {'payment_status': 'failed'}
                )
                
                return {'success': True, 'message': 'Payment expired'}

            return {'success': True, 'message': 'Event received'}

        except ValueError as e:
            return {'success': False, 'error': 'Invalid payload'}
        except stripe.error.SignatureVerificationError as e:
            return {'success': False, 'error': 'Invalid signature'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
