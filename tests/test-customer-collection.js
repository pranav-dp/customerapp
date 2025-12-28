import { getApps, initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
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

async function testCustomerOperations() {
  console.log('🧪 Testing Customer Collection Operations...\n');

  try {
    // Test 1: Create a test customer
    console.log('📝 Test 1: Creating test customer...');
    const testCustomer = {
      name: 'Test Student',
      email: 'test.student@example.com',
      phone: '9876543210',
      rollNumber: '2024TEST001',
      hostel: 'Test Hostel',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'customers'), testCustomer);
    console.log(`✅ Customer created with ID: ${docRef.id}`);

    // Test 2: Query customer by email
    console.log('\n🔍 Test 2: Querying customer by email...');
    const q = query(collection(db, 'customers'), where('email', '==', 'test.student@example.com'));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const foundCustomer = querySnapshot.docs[0].data();
      console.log(`✅ Customer found: ${foundCustomer.name}`);
      console.log(`   Email: ${foundCustomer.email}`);
      console.log(`   Roll Number: ${foundCustomer.rollNumber}`);
    } else {
      throw new Error('Customer not found after creation');
    }

    // Test 3: Clean up - delete test customer
    console.log('\n🧹 Test 3: Cleaning up test customer...');
    await deleteDoc(doc(db, 'customers', docRef.id));
    console.log('✅ Test customer deleted');

    // Verify deletion
    const verifyQuery = await getDocs(q);
    if (verifyQuery.empty) {
      console.log('✅ Deletion verified - customer no longer exists');
    }

    console.log('\n🎉 All customer collection tests PASSED!');

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    throw error;
  }
}

testCustomerOperations()
  .then(() => {
    console.log('\n✅ Customer collection is ready for use!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Customer collection test failed:', error);
    process.exit(1);
  });
