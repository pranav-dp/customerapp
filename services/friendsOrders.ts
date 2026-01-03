import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from './firebase';

interface FriendOrder {
  friendId: string;
  friendName: string;
  itemId: string;
  itemName: string;
  orderedAt: Date;
}

export const getFriendsWhoOrdered = async (
  restaurantId: string, 
  friendIds: string[]
): Promise<{ success: boolean; data?: Record<string, FriendOrder>; error?: string }> => {
  try {
    if (!friendIds.length) {
      return { success: true, data: {} };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Query orders from friends at this restaurant in last 30 days
    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurantId),
      where('customerId', 'in', friendIds.slice(0, 10)), // Firestore limit
      where('paymentStatus', '==', 'paid'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    
    // Map item IDs to most recent friend who ordered
    const itemToFriend: Record<string, FriendOrder> = {};
    
    snapshot.docs.forEach(doc => {
      const order = doc.data();
      const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
      
      if (orderDate < thirtyDaysAgo) return;
      
      order.items?.forEach((item: any) => {
        // Only keep most recent order per item
        if (!itemToFriend[item.id] || orderDate > itemToFriend[item.id].orderedAt) {
          itemToFriend[item.id] = {
            friendId: order.customerId,
            friendName: order.customerName?.split(' ')[0] || 'Friend',
            itemId: item.id,
            itemName: item.name,
            orderedAt: orderDate
          };
        }
      });
    });

    return { success: true, data: itemToFriend };
  } catch (error: any) {
    console.log('getFriendsWhoOrdered error:', error.message);
    return { success: true, data: {} }; // Fail silently
  }
};

export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
};
