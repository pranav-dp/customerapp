const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
require('dotenv').config();

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'foood');

async function getCustomerData() {
  try {
    console.log('=== CUSTOMERS ===');
    const customersSnap = await getDocs(collection(db, 'customers'));
    
    customersSnap.forEach(doc => {
      const data = doc.data();
      console.log(`\nCustomer ID: ${doc.id}`);
      console.log(`Name: ${data.name || 'No name'}`);
      console.log(`Username: ${data.username || 'No username'}`);
      console.log(`Email: ${data.email}`);
      console.log(`Phone: ${data.phone || 'No phone'}`);
      console.log(`Friends: ${data.friends?.length || 0}`);
      
      if (data.friends?.length > 0) {
        console.log(`Friend list: ${data.friends.slice(0, 3).map(f => f.name || f.username).join(', ')}`);
      }
      
      if (data.owes && Object.keys(data.owes).length > 0) {
        console.log('Money owed:');
        Object.entries(data.owes).forEach(([friendId, amount]) => {
          console.log(`  - ${friendId}: ₹${amount}`);
        });
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getCustomerData();
