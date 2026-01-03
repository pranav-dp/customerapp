import { Platform, Alert } from 'react-native';

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
const DEV_MODE = __DEV__; // Skip real payment in development

export interface PaymentOptions {
  orderId?: string;
  amount: number;
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
    // Dev mode - simulate payment
    if (DEV_MODE && !this.isAvailable()) {
      return new Promise((resolve, reject) => {
        Alert.alert(
          'Dev Mode Payment',
          `Pay ₹${options.amount / 100}?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => reject(new Error('Payment cancelled')) },
            { text: 'Pay', onPress: () => resolve({
              razorpay_payment_id: `dev_pay_${Date.now()}`,
              razorpay_order_id: `dev_order_${Date.now()}`,
              razorpay_signature: 'dev_signature',
            })},
          ]
        );
      });
    }

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
      };
      
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

  toPaisa(rupees: number): number {
    return Math.round(rupees * 100);
  }
}

export default new RazorpayService();
