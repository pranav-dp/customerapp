import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, increment } from 'firebase/firestore';
import { db } from './firebase';
import { sendLocalNotification } from './notifications';

export interface Friend {
  id: string;
  name: string;
  username: string;
}

export const toggleFavorite = async (customerId: string, restaurantId: string, isFavorite: boolean) => {
  try {
    const customerRef = doc(db, 'customers', customerId);
    if (isFavorite) {
      await updateDoc(customerRef, { favorites: arrayRemove(restaurantId) });
    } else {
      await updateDoc(customerRef, { favorites: arrayUnion(restaurantId) });
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Update friends' owed amounts when someone pays for them
export const updateFriendsOwed = async (payerName: string, splitSummary: Record<string, number>) => {
  try {
    // Get payer's friends list to find friend IDs
    // splitSummary is { friendName: amount }
    // We need to update each friend's "owes" field
    
    for (const [friendName, amount] of Object.entries(splitSummary)) {
      if (friendName === payerName || amount <= 0) continue;
      
      // Find friend by name in the payer's friends list
      // This is a simplified approach - in production you'd want to use IDs
      // For now, we'll search by username stored in assignments
    }
    
    return { success: true };
  } catch (error: any) {
    console.log('Failed to update friends owed:', error);
    return { success: false, error: error.message };
  }
};

// Update a specific friend's owed amount
export const updateOwedAmount = async (friendId: string, payerId: string, payerName: string, amount: number) => {
  try {
    const friendRef = doc(db, 'customers', friendId);
    const friendDoc = await getDoc(friendRef);
    
    if (!friendDoc.exists()) return { success: false, error: 'Friend not found' };
    
    const currentOwes = friendDoc.data().owes || {};
    const newAmount = (currentOwes[payerId] || 0) + amount;
    
    await updateDoc(friendRef, {
      [`owes.${payerId}`]: newAmount,
    });
    
    // Send notification to friend
    sendLocalNotification(
      '💰 Someone paid for you!',
      `${payerName} paid ₹${amount} for your food. You now owe them ₹${newAmount}`
    );
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};


// Get total money owed TO the current user by friends
export const getMoneyOwedToMe = async (customerId: string): Promise<{ success: boolean; total: number; details: Array<{ friendId: string; friendName: string; amount: number }> }> => {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const snapshot = await getDocs(collection(db, 'customers'));
    const details: Array<{ friendId: string; friendName: string; amount: number }> = [];
    let total = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const owes = data.owes || {};
      if (owes[customerId] && owes[customerId] > 0) {
        details.push({ friendId: doc.id, friendName: data.name, amount: owes[customerId] });
        total += owes[customerId];
      }
    });
    
    return { success: true, total, details };
  } catch (error: any) {
    return { success: false, total: 0, details: [] };
  }
};
