const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

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

async function verifyFallback() {
    console.log('=== VERIFY: Testing fallback query (no orderBy) ===\n');

    // Get a customerId from existing orders
    const allSnapshot = await getDocs(collection(db, 'orders'));
    if (allSnapshot.size === 0) { console.log('No orders found!'); process.exit(1); }

    const firstOrder = allSnapshot.docs[0].data();
    const testCustomerId = firstOrder.customerId;
    console.log(`Testing with customerId: ${testCustomerId}\n`);

    // 1. Fallback query (what the fixed code does)
    console.log('1. Fallback query (customerId only, no orderBy):');
    const fallbackQuery = query(collection(db, 'orders'), where('customerId', '==', testCustomerId));
    const fallbackSnap = await getDocs(fallbackQuery);
    console.log(`   ✅ Returned ${fallbackSnap.size} orders`);
    fallbackSnap.forEach(doc => {
        const d = doc.data();
        console.log(`   - ${doc.id}: status=${d.status}, payment=${d.paymentStatus}, total=₹${d.totalAmount}, treat=${d.isTreat || false}`);
    });

    // 2. Paid orders filter (what insights page does)
    console.log('\n2. Paid orders (insights filter):');
    const paidOrders = fallbackSnap.docs.filter(d => d.data().paymentStatus === 'paid');
    console.log(`   ✅ ${paidOrders.length} paid orders`);
    const totalSpent = paidOrders.reduce((sum, d) => sum + d.data().totalAmount, 0);
    console.log(`   Total spent: ₹${totalSpent}`);

    // 3. Past orders filter (orders tab filter)
    console.log('\n3. Past orders (completed/cancelled):');
    const pastOrders = fallbackSnap.docs.filter(d => ['completed', 'cancelled'].includes(d.data().status));
    console.log(`   ✅ ${pastOrders.length} past orders`);

    console.log('\n=== VERIFICATION COMPLETE: Fallback queries work! ===');
    process.exit(0);
}

verifyFallback();
