import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface RestaurantStats {
  currentHourOrders: number;
  avgPrepTime: number; // minutes
  lastUpdated: Date;
}

export type BusynessLevel = 'low' | 'medium' | 'high';

export const getBusynessLevel = (ordersPerHour: number): BusynessLevel => {
  if (ordersPerHour <= 5) return 'low';
  if (ordersPerHour <= 15) return 'medium';
  return 'high';
};

export const getBusynessInfo = (stats: RestaurantStats | null) => {
  if (!stats) {
    return { level: 'low' as BusynessLevel, label: 'Not Busy', waitTime: null, ordersPerHour: 0 };
  }
  
  const level = getBusynessLevel(stats.currentHourOrders);
  const labels = {
    low: 'Not Busy',
    medium: 'Busy',
    high: 'Very Busy'
  };
  
  // Estimate wait time based on orders and avg prep time
  const waitTime = stats.avgPrepTime > 0 
    ? Math.ceil(stats.avgPrepTime * (1 + stats.currentHourOrders * 0.1))
    : null;
  
  return {
    level,
    label: labels[level],
    waitTime,
    ordersPerHour: stats.currentHourOrders
  };
};

// Called by hotel app when order status changes
export const updateRestaurantStats = async (
  restaurantId: string, 
  currentHourOrders: number,
  avgPrepTime: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const docRef = doc(db, 'restaurants', restaurantId);
    await updateDoc(docRef, {
      stats: {
        currentHourOrders,
        avgPrepTime,
        lastUpdated: new Date()
      }
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getRestaurantStats = async (restaurantId: string): Promise<RestaurantStats | null> => {
  try {
    const docRef = doc(db, 'restaurants', restaurantId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    const stats = docSnap.data().stats;
    if (!stats) return null;
    
    // Check if stats are stale (more than 1 hour old)
    const lastUpdated = stats.lastUpdated?.toDate?.() || new Date(stats.lastUpdated);
    const hourAgo = new Date();
    hourAgo.setHours(hourAgo.getHours() - 1);
    
    if (lastUpdated < hourAgo) {
      return { currentHourOrders: 0, avgPrepTime: stats.avgPrepTime || 10, lastUpdated };
    }
    
    return {
      currentHourOrders: stats.currentHourOrders || 0,
      avgPrepTime: stats.avgPrepTime || 10,
      lastUpdated
    };
  } catch (error) {
    return null;
  }
};
