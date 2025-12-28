import { collection, addDoc, doc, updateDoc, getDoc, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export interface ItemAssignment {
  friendId: string;
  friendName: string;
  quantity: number;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isVeg?: boolean;
  assignments?: ItemAssignment[];
}

export interface Order {
  id?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  restaurantId: string;
  restaurantName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentId?: string;
  razorpayOrderId?: string;
  orderNumber: string;
  splitSummary?: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

// Generate a short order number
const generateOrderNumber = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const createOrder = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'status' | 'paymentStatus'>) => {
  try {
    const order = {
      ...orderData,
      orderNumber: generateOrderNumber(),
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'orders'), order);
    return { success: true, id: docRef.id, orderNumber: order.orderNumber };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateOrderPayment = async (orderId: string, paymentId: string, razorpayOrderId?: string) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const updateData: any = {
      paymentStatus: 'paid',
      paymentId,
      status: 'confirmed',
      updatedAt: new Date(),
    };
    if (razorpayOrderId) {
      updateData.razorpayOrderId = razorpayOrderId;
    }
    await updateDoc(orderRef, updateData);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const markOrderPaymentFailed = async (orderId: string, reason?: string) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      paymentStatus: 'failed',
      status: 'cancelled',
      failureReason: reason || 'Payment failed',
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getCustomerOrders = async (customerId: string) => {
  try {
    const q = query(
      collection(db, 'orders'),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: orders };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getOrder = async (orderId: string) => {
  try {
    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } as Order };
    }
    return { success: false, error: 'Order not found' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Real-time order status listener
export const subscribeToOrder = (orderId: string, callback: (order: Order | null) => void) => {
  const orderRef = doc(db, 'orders', orderId);
  return onSnapshot(orderRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Order);
    } else {
      callback(null);
    }
  });
};
