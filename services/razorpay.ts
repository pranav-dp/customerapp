import { Platform } from 'react-native';

let RazorpayCheckout: any = null;

function loadRazorpayModule() {
  if (RazorpayCheckout !== null) return RazorpayCheckout;

  try {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      const RazorpayModule = require('react-native-razorpay');
      RazorpayCheckout = RazorpayModule.default || RazorpayModule;
      return RazorpayCheckout;
    }
  } catch (error) {
    console.log('Razorpay not available:', error);
  }
  return null;
}

const RAZORPAY_KEY = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';

export interface PaymentOptions {
  orderId?: string; // Optional - only needed for production with backend
  amount: number; // in paisa (₹100 = 10000)
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description?: string;
}

export interface PaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

class RazorpayService {
  private isAvailable(): boolean {
    const razorpay = loadRazorpayModule();
    return razorpay !== null && typeof razorpay?.open === 'function';
  }

  async openPayment(options: PaymentOptions): Promise<PaymentResponse> {
    return new Promise((resolve, reject) => {
      if (!this.isAvailable()) {
        reject(new Error('Payment not available. Please use a physical device with a proper build.'));
        return;
      }

      if (!RAZORPAY_KEY) {
        reject(new Error('Payment gateway not configured.'));
        return;
      }

      const razorpay = loadRazorpayModule();

      const checkoutOptions: any = {
        key: RAZORPAY_KEY,
        amount: options.amount,
        currency: 'INR',
        name: 'Campus Food',
        description: options.description || 'Food Order',
        prefill: {
          name: options.customerName,
          email: options.customerEmail,
          contact: options.customerPhone,
        },
        theme: { color: '#FFBC0D' },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay via UPI',
                instruments: [
                  { method: 'upi', flows: ['intent', 'collect'] }
                ]
              },
              other: {
                name: 'Other Payment Methods',
                instruments: [
                  { method: 'card' },
                  { method: 'netbanking' },
                  { method: 'wallet' }
                ]
              }
            },
            sequence: ['block.upi', 'block.other'],
            preferences: { show_default_blocks: false }
          }
        }
      };
      
      // Only add order_id if provided (production with backend)
      if (options.orderId) {
        checkoutOptions.order_id = options.orderId;
      }

      razorpay.open(checkoutOptions)
        .then((data: PaymentResponse) => resolve(data))
        .catch((error: any) => {
          if (error.code === 'PAYMENT_CANCELLED') {
            reject(new Error('Payment cancelled'));
          } else {
            reject(new Error(error.description || 'Payment failed'));
          }
        });
    });
  }

  // Convert rupees to paisa
  toPaisa(rupees: number): number {
    return Math.round(rupees * 100);
  }
}

export default new RazorpayService();
