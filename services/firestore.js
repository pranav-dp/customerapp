import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc,
  getDocs,
  query, 
  where 
} from 'firebase/firestore';
import { db } from './firebase';

// Customer operations
export const createCustomer = async (customerData) => {
  try {
    const docRef = await addDoc(collection(db, 'customers'), {
      ...customerData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCustomerByEmail = async (email) => {
  try {
    const q = query(collection(db, 'customers'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { success: true, data: { id: doc.id, ...doc.data() } };
    }
    return { success: false, error: 'Customer not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCustomer = async (customerId) => {
  try {
    const docRef = doc(db, 'customers', customerId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Customer not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateCustomer = async (customerId, updates) => {
  try {
    const docRef = doc(db, 'customers', customerId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Restaurant operations
export const getRestaurants = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'restaurants'));
    const restaurants = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: restaurants };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getRestaurant = async (restaurantId) => {
  try {
    const docRef = doc(db, 'restaurants', restaurantId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Restaurant not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Helper to check if restaurant is currently open
export const isRestaurantOpen = (operatingHours) => {
  if (!operatingHours) return false;
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  const today = days[now.getDay()];
  const todayHours = operatingHours[today];
  
  if (!todayHours?.isOpen) return false;
  
  const currentTime = now.getHours() * 100 + now.getMinutes();
  const [openHour, openMin] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
  
  const openTime = openHour * 100 + openMin;
  const closeTime = closeHour * 100 + closeMin;
  
  return currentTime >= openTime && currentTime <= closeTime;
};
