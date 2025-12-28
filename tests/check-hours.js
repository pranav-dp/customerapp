import { getApps, initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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

async function checkRestaurants() {
  const querySnapshot = await getDocs(collection(db, 'restaurants'));
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    console.log('Restaurant ID:', doc.id);
    console.log('Name:', data.name);
    console.log('Operating Hours:');
    console.log(JSON.stringify(data.operatingHours, null, 2));
    console.log('---');
  });
  process.exit(0);
}

checkRestaurants();
