import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, serverTimestamp, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface TreatCartItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  addedBy: { id: string; name: string };
}

export interface TreatInvite {
  id: string;
  name: string;
  username: string;
  status: 'pending' | 'joined' | 'declined';
}

export interface TreatRoom {
  id: string;
  hostId: string;
  hostName: string;
  restaurantId: string;
  restaurantName: string;
  status: 'open' | 'locked' | 'ordered' | 'cancelled';
  invitedFriends: TreatInvite[];
  cart: TreatCartItem[];
  totalAmount: number;
  expiresAt: any;
  createdAt: any;
}

const COLLECTION = 'treatRooms';

export const createTreatRoom = async (
  hostId: string,
  hostName: string,
  restaurantId: string,
  restaurantName: string
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    const docRef = await addDoc(collection(db, COLLECTION), {
      hostId,
      hostName,
      restaurantId,
      restaurantName,
      status: 'open',
      invitedFriends: [],
      cart: [],
      totalAmount: 0,
      expiresAt,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const inviteFriend = async (
  roomId: string,
  friend: { id: string; name: string; username: string }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const roomRef = doc(db, COLLECTION, roomId);
    await updateDoc(roomRef, {
      invitedFriends: arrayUnion({ ...friend, status: 'pending' }),
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const respondToInvite = async (
  roomId: string,
  odid: string,
  accept: boolean
): Promise<{ success: boolean; error?: string }> => {
  try {
    const roomRef = doc(db, COLLECTION, roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return { success: false, error: 'Room not found' };

    const room = roomSnap.data();
    const updatedFriends = room.invitedFriends.map((f: TreatInvite) =>
      f.id === odid ? { ...f, status: accept ? 'joined' : 'declined' } : f
    );

    await updateDoc(roomRef, { invitedFriends: updatedFriends });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const addToTreatCart = async (
  roomId: string,
  item: Omit<TreatCartItem, 'quantity'>,
  quantity: number = 1
): Promise<{ success: boolean; error?: string }> => {
  try {
    const roomRef = doc(db, COLLECTION, roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return { success: false, error: 'Room not found' };

    const room = roomSnap.data();
    const existingIdx = room.cart.findIndex(
      (c: TreatCartItem) => c.itemId === item.itemId && c.addedBy.id === item.addedBy.id
    );

    let newCart = [...room.cart];
    if (existingIdx >= 0) {
      newCart[existingIdx].quantity += quantity;
    } else {
      newCart.push({ ...item, quantity });
    }

    const totalAmount = newCart.reduce((sum, c) => sum + c.price * c.quantity, 0);
    await updateDoc(roomRef, { cart: newCart, totalAmount });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const removeFromTreatCart = async (
  roomId: string,
  itemId: string,
  odid: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const roomRef = doc(db, COLLECTION, roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return { success: false, error: 'Room not found' };

    const room = roomSnap.data();
    const newCart = room.cart.filter(
      (c: TreatCartItem) => !(c.itemId === itemId && c.addedBy.id === odid)
    );
    const totalAmount = newCart.reduce((sum: number, c: TreatCartItem) => sum + c.price * c.quantity, 0);

    await updateDoc(roomRef, { cart: newCart, totalAmount });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const lockTreatRoom = async (roomId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await updateDoc(doc(db, COLLECTION, roomId), { status: 'locked' });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const markTreatOrdered = async (roomId: string, orderId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await updateDoc(doc(db, COLLECTION, roomId), { status: 'ordered', orderId });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const cancelTreatRoom = async (roomId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await updateDoc(doc(db, COLLECTION, roomId), { status: 'cancelled' });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const subscribeToTreatRoom = (roomId: string, callback: (room: TreatRoom | null) => void) => {
  return onSnapshot(doc(db, COLLECTION, roomId), (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() } as TreatRoom);
    } else {
      callback(null);
    }
  });
};

export const getMyTreatInvites = (odid: string, callback: (rooms: TreatRoom[]) => void) => {
  const q = query(
    collection(db, COLLECTION),
    where('status', '==', 'open')
  );
  return onSnapshot(q, (snap) => {
    const rooms = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as TreatRoom))
      .filter(r => r.invitedFriends.some(f => f.id === odid && f.status === 'pending'));
    callback(rooms);
  });
};

export const getMyActiveTreatRoom = (odid: string, callback: (room: TreatRoom | null) => void) => {
  const q = query(
    collection(db, COLLECTION),
    where('status', 'in', ['open', 'locked'])
  );
  return onSnapshot(q, (snap) => {
    const room = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as TreatRoom))
      .find(r => r.hostId === odid || r.invitedFriends.some(f => f.id === odid && f.status === 'joined'));
    callback(room || null);
  });
};
