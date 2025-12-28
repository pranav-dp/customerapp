import { getApps, initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, deleteField } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app, 'foood');

async function deleteBusinessHours() {
  const restaurantId = 'ealQV1vEMTTJ8LqE4jRW';
  const restaurantRef = doc(db, 'restaurants', restaurantId);
  
  await updateDoc(restaurantRef, {
    businessHours: deleteField()
  });
  
  console.log('✅ Deleted businessHours field from restaurant');
  process.exit(0);
}

deleteBusinessHours();
