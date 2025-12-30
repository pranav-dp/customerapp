require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'foood');

async function checkAllCollections() {
  console.log('=== RESTAURANTS ===');
  const restaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
  if (restaurantsSnapshot.empty) {
    console.log('No restaurants found!');
  } else {
    restaurantsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`${doc.id} => ${data.name} (Owner: ${data.ownerId || data.owner_id})`);
      console.log(`  Menu items: ${data.menu?.length || 0}`);
      console.log(`  Operating hours: ${data.operatingHours ? 'Set' : 'Not set'}`);
    });
  }

  console.log('\n=== ORDERS ===');
  const ordersSnapshot = await getDocs(collection(db, 'orders'));
  if (ordersSnapshot.empty) {
    console.log('No orders found!');
  } else {
    ordersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`${doc.id} => Order #${data.orderNumber}`);
      console.log(`  Restaurant: ${data.restaurantName}`);
      console.log(`  Customer: ${data.customerName}`);
      console.log(`  Status: ${data.status} | Payment: ${data.paymentStatus}`);
      console.log(`  Total: ₹${data.totalAmount} | Items: ${data.items?.length || 0}`);
    });
  }

  console.log('\n=== CUSTOMERS COUNT ===');
  const customersSnapshot = await getDocs(collection(db, 'customers'));
  console.log(`Total customers: ${customersSnapshot.size}`);
}

checkAllCollections().catch(console.error);
