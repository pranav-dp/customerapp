const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, orderBy, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyA5Kp6yLkuJcsCnPV8ig7bH7hXpMtLqetE",
  authDomain: "restro-6f687.firebaseapp.com",
  projectId: "restro-6f687",
  storageBucket: "restro-6f687.firebasestorage.app",
  messagingSenderId: "1044651937012",
  appId: "1:1044651937012:web:a3f3c97500e889d5e3f2c0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'foood');

async function testOrders() {
  // First, get all orders to see what's there
  console.log('Fetching all orders...');
  const allOrdersSnapshot = await getDocs(collection(db, 'orders'));
  console.log(`Total orders in DB: ${allOrdersSnapshot.size}`);
  
  allOrdersSnapshot.forEach(doc => {
    const data = doc.data();
    console.log(`- ${doc.id}: customerId=${data.customerId}, status=${data.status}, paymentStatus=${data.paymentStatus}`);
  });

  // Now test with a specific customerId (replace with actual UID)
  const testCustomerId = 'YOUR_USER_UID_HERE'; // Replace this
  console.log(`\nFetching orders for customerId: ${testCustomerId}`);
  
  try {
    const q = query(
      collection(db, 'orders'),
      where('customerId', '==', testCustomerId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.size} orders for this customer`);
    snapshot.forEach(doc => {
      console.log(`- ${doc.id}:`, doc.data());
    });
  } catch (error) {
    console.error('Query error:', error.message);
    if (error.message.includes('index')) {
      console.log('\n⚠️  You need to create a Firestore composite index!');
      console.log('Go to Firebase Console > Firestore > Indexes and create:');
      console.log('Collection: orders');
      console.log('Fields: customerId (Ascending), createdAt (Descending)');
    }
  }
}

testOrders();
