const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, orderBy, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDgQIgbMNx7pEY6Hhlq13ILdo4cd-aVFd8",
  authDomain: "unieat-99724.firebaseapp.com",
  projectId: "unieat-99724",
  storageBucket: "unieat-99724.firebasestorage.app",
  messagingSenderId: "118558491246",
  appId: "1:118558491246:web:b1ebc4e7db96ce80725c7f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'foood');

async function debugOrders() {
  console.log('=== DEBUG: Checking orders collection ===\n');

  // 1. Try to get ALL orders (no filters)
  console.log('1. Fetching ALL orders (no filters)...');
  try {
    const allSnapshot = await getDocs(collection(db, 'orders'));
    console.log(`   Total orders in DB: ${allSnapshot.size}`);
    allSnapshot.forEach(doc => {
      const d = doc.data();
      console.log(`   - ${doc.id}: customerId=${d.customerId}, status=${d.status}, paymentStatus=${d.paymentStatus}, restaurant=${d.restaurantName}, isTreat=${d.isTreat || false}`);
    });
  } catch (err) {
    console.log(`   ERROR: ${err.message}`);
  }

  // 2. Get all customers to find valid customerIds
  console.log('\n2. Fetching ALL customers...');
  try {
    const custSnapshot = await getDocs(collection(db, 'customers'));
    console.log(`   Total customers: ${custSnapshot.size}`);
    custSnapshot.forEach(doc => {
      const d = doc.data();
      console.log(`   - docId=${doc.id}, name=${d.name}, username=${d.username}, email=${d.email}`);
    });
  } catch (err) {
    console.log(`   ERROR: ${err.message}`);
  }

  // 3. Try getCustomerOrders style query (customerId + orderBy createdAt)
  console.log('\n3. Testing composite query: customerId + orderBy createdAt...');
  // We'll pick a customerId from step 1 if any
  try {
    const allSnapshot = await getDocs(collection(db, 'orders'));
    if (allSnapshot.size > 0) {
      const firstOrder = allSnapshot.docs[0].data();
      const testCustomerId = firstOrder.customerId;
      console.log(`   Using customerId: ${testCustomerId}`);

      const q = query(
        collection(db, 'orders'),
        where('customerId', '==', testCustomerId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      console.log(`   Query returned: ${snap.size} results`);
    } else {
      console.log('   No orders found, skipping composite query test');
    }
  } catch (err) {
    console.log(`   COMPOSITE QUERY ERROR: ${err.message}`);
    if (err.message.includes('index') || err.message.includes('Index')) {
      console.log('\n   ⚠️  MISSING FIRESTORE INDEX DETECTED!');
      console.log('   You need to create a composite index:');
      console.log('   Collection: orders');
      console.log('   Fields: customerId (Ascending), createdAt (Descending)');
    }
  }

  // 4. Try active orders style query (customerId + status in [...] + orderBy createdAt)
  console.log('\n4. Testing active orders query: customerId + status in [...] + orderBy createdAt...');
  try {
    const allSnapshot = await getDocs(collection(db, 'orders'));
    if (allSnapshot.size > 0) {
      const firstOrder = allSnapshot.docs[0].data();
      const testCustomerId = firstOrder.customerId;

      const q = query(
        collection(db, 'orders'),
        where('customerId', '==', testCustomerId),
        where('status', 'in', ['pending', 'confirmed', 'preparing', 'ready']),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      console.log(`   Active orders query returned: ${snap.size} results`);
    }
  } catch (err) {
    console.log(`   ACTIVE ORDERS QUERY ERROR: ${err.message}`);
    if (err.message.includes('index') || err.message.includes('Index')) {
      console.log('\n   ⚠️  MISSING FIRESTORE INDEX DETECTED!');
      console.log('   You need to create a composite index:');
      console.log('   Collection: orders');
      console.log('   Fields: customerId (Ascending), status (Ascending), createdAt (Descending)');
    }
  }

  // 5. Check reviews too
  console.log('\n5. Fetching ALL reviews...');
  try {
    const reviewSnapshot = await getDocs(collection(db, 'reviews'));
    console.log(`   Total reviews: ${reviewSnapshot.size}`);
    reviewSnapshot.forEach(doc => {
      const d = doc.data();
      console.log(`   - ${doc.id}: orderId=${d.orderId}, customerId=${d.customerId}, restaurant=${d.restaurantName}, rating=${d.rating}`);
    });
  } catch (err) {
    console.log(`   ERROR: ${err.message}`);
  }

  console.log('\n=== DEBUG COMPLETE ===');
  process.exit(0);
}

debugOrders();
