import { collection, addDoc, doc, updateDoc, deleteDoc, getDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface Review {
  id?: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  username: string;
  restaurantId: string;
  restaurantName: string;
  rating: number;
  description: string;
  photoUrl?: string;
  items: { name: string; quantity: number }[];
  createdAt: Date;
  updatedAt: Date;
}

export const createReview = async (reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    // Filter out undefined values to prevent Firestore errors
    const cleanData: Record<string, any> = {};
    Object.entries(reviewData).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    });

    const review = {
      ...cleanData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'reviews'), review);
    
    // Mark order as reviewed
    await markOrderAsReviewed(reviewData.orderId, docRef.id);
    
    // Update restaurant rating
    await updateRestaurantRating(reviewData.restaurantId);
    
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getReviewsByRestaurant = async (restaurantId: string, filters?: { rating?: number; sortBy?: 'recent' | 'oldest' }) => {
  try {
    let q;
    
    if (filters?.rating) {
      // Query with rating filter - requires composite index
      q = query(
        collection(db, 'reviews'),
        where('restaurantId', '==', restaurantId),
        where('rating', '==', filters.rating),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Simple query - just filter by restaurantId and order by createdAt
      q = query(
        collection(db, 'reviews'),
        where('restaurantId', '==', restaurantId),
        orderBy('createdAt', filters?.sortBy === 'oldest' ? 'asc' : 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: reviews as Review[] };
  } catch (error: any) {
    console.log('getReviewsByRestaurant error:', error.message);
    // Fallback: try without orderBy if index doesn't exist
    try {
      const fallbackQuery = query(
        collection(db, 'reviews'),
        where('restaurantId', '==', restaurantId)
      );
      const snapshot = await getDocs(fallbackQuery);
      let reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];
      
      // Sort in memory
      reviews.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : (a.createdAt as any)?.toDate?.() || new Date();
        const dateB = b.createdAt instanceof Date ? b.createdAt : (b.createdAt as any)?.toDate?.() || new Date();
        return dateB.getTime() - dateA.getTime();
      });
      
      // Filter by rating in memory if needed
      if (filters?.rating) {
        reviews = reviews.filter(r => r.rating === filters.rating);
      }
      
      return { success: true, data: reviews };
    } catch (fallbackError: any) {
      return { success: false, error: fallbackError.message, data: [] };
    }
  }
};

export const getReviewsByCustomer = async (customerId: string) => {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: reviews as Review[] };
  } catch (error: any) {
    console.log('getReviewsByCustomer error:', error.message);
    // Fallback: try without orderBy if index doesn't exist
    try {
      const fallbackQuery = query(
        collection(db, 'reviews'),
        where('customerId', '==', customerId)
      );
      const snapshot = await getDocs(fallbackQuery);
      let reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];
      
      // Sort in memory
      reviews.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : (a.createdAt as any)?.toDate?.() || new Date();
        const dateB = b.createdAt instanceof Date ? b.createdAt : (b.createdAt as any)?.toDate?.() || new Date();
        return dateB.getTime() - dateA.getTime();
      });
      
      return { success: true, data: reviews };
    } catch (fallbackError: any) {
      return { success: false, error: fallbackError.message, data: [] };
    }
  }
};

export const deleteReview = async (reviewId: string, restaurantId: string, orderId: string) => {
  try {
    // Delete the review
    await deleteDoc(doc(db, 'reviews', reviewId));
    
    // Mark order as not reviewed
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      isReviewed: false,
      reviewId: null,
      updatedAt: new Date(),
    });
    
    // Update restaurant rating
    await updateRestaurantRating(restaurantId);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const markOrderAsReviewed = async (orderId: string, reviewId: string) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      isReviewed: true,
      reviewId,
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateRestaurantRating = async (restaurantId: string) => {
  try {
    // Get all reviews for this restaurant
    const q = query(
      collection(db, 'reviews'),
      where('restaurantId', '==', restaurantId)
    );
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map(doc => doc.data());
    
    // Calculate average rating
    let rating = 0;
    const reviewCount = reviews.length;
    
    if (reviewCount > 0) {
      const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
      rating = Math.round((sum / reviewCount) * 10) / 10;
    }
    
    // Update restaurant
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    await updateDoc(restaurantRef, {
      rating,
      reviewCount,
      updatedAt: new Date(),
    });
    
    return { success: true, rating, reviewCount };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getReview = async (reviewId: string) => {
  try {
    const docRef = doc(db, 'reviews', reviewId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } as Review };
    }
    return { success: false, error: 'Review not found' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
