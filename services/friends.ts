import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from './firebase';

export interface Friend {
  id: string;
  name: string;
  phone?: string;
}

export const addFriend = async (customerId: string, friend: Omit<Friend, 'id'>) => {
  try {
    const newFriend: Friend = {
      id: Date.now().toString(),
      name: friend.name,
      ...(friend.phone && { phone: friend.phone }),
    };
    const customerRef = doc(db, 'customers', customerId);
    await updateDoc(customerRef, {
      friends: arrayUnion(newFriend),
    });
    return { success: true, friend: newFriend };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const removeFriend = async (customerId: string, friend: Friend) => {
  try {
    const customerRef = doc(db, 'customers', customerId);
    await updateDoc(customerRef, {
      friends: arrayRemove(friend),
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateFriend = async (customerId: string, friends: Friend[]) => {
  try {
    const customerRef = doc(db, 'customers', customerId);
    await updateDoc(customerRef, { friends });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
