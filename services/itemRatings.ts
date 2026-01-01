import { collection, addDoc, doc, updateDoc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface ItemRating {
  id?: string;
  itemId: string;
  itemName: string;
  restaurantId: string;
  customerId: string;
  orderId: string;
  rating: number;
  createdAt: Date;
}

// Submit rating for a menu item
export const submitItemRating = async (ratingData: Omit<ItemRating, 'id' | 'createdAt'>) => {
  try {
    // Check if user already rated this item from this order
    const existingQuery = query(
      collection(db, 'itemRatings'),
      where('itemId', '==', ratingData.itemId),
      where('customerId', '==', ratingData.customerId),
      where('orderId', '==', ratingData.orderId)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      // Update existing rating
      const existingDoc = existingSnapshot.docs[0];
      await updateDoc(doc(db, 'itemRatings', existingDoc.id), {
        rating: ratingData.rating,
        updatedAt: new Date(),
      });
    } else {
      // Create new rating
      await addDoc(collection(db, 'itemRatings'), {
        ...ratingData,
        createdAt: new Date(),
      });
    }
    
    // Update the menu item's average rating
    await updateMenuItemRating(ratingData.restaurantId, ratingData.itemId);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Calculate and update menu item's average rating
export const updateMenuItemRating = async (restaurantId: string, itemId: string) => {
  try {
    // Get all ratings for this item
    const q = query(
      collection(db, 'itemRatings'),
      where('itemId', '==', itemId),
      where('restaurantId', '==', restaurantId)
    );
    const snapshot = await getDocs(q);
    const ratings = snapshot.docs.map(doc => doc.data().rating as number);
    
    if (ratings.length === 0) return { success: true, rating: 0 };
    
    // Calculate average
    const avgRating = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
    
    // Update the restaurant's menu item
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const restaurantSnap = await getDoc(restaurantRef);
    
    if (restaurantSnap.exists()) {
      const restaurantData = restaurantSnap.data();
      const menu = restaurantData.menu || [];
      
      const updatedMenu = menu.map((item: any) => {
        if (item.id === itemId) {
          return { ...item, rating: avgRating, ratingCount: ratings.length };
        }
        return item;
      });
      
      await updateDoc(restaurantRef, { menu: updatedMenu, updatedAt: new Date() });
    }
    
    return { success: true, rating: avgRating };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get item ratings for a specific order (to show existing ratings when viewing review)
export const getItemRatingsForOrder = async (orderId: string, customerId: string) => {
  try {
    const q = query(
      collection(db, 'itemRatings'),
      where('orderId', '==', orderId),
      where('customerId', '==', customerId)
    );
    const snapshot = await getDocs(q);
    const ratings: Record<string, number> = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      ratings[data.itemId] = data.rating;
    });
    return { success: true, data: ratings };
  } catch (error: any) {
    return { success: false, error: error.message, data: {} };
  }
};

// Get average rating for a menu item
export const getMenuItemRating = async (restaurantId: string, itemId: string) => {
  try {
    const q = query(
      collection(db, 'itemRatings'),
      where('itemId', '==', itemId),
      where('restaurantId', '==', restaurantId)
    );
    const snapshot = await getDocs(q);
    const ratings = snapshot.docs.map(doc => doc.data().rating as number);
    
    if (ratings.length === 0) return { success: true, rating: 0, count: 0 };
    
    const avgRating = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
    return { success: true, rating: avgRating, count: ratings.length };
  } catch (error: any) {
    return { success: false, error: error.message, rating: 0, count: 0 };
  }
};
