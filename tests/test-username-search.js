// Test script for username and friends functionality
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, limit } = require('firebase/firestore');

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

async function testUsernameSearch() {
  console.log('Testing username search...');
  
  try {
    const searchQuery = 'pra';
    const q = query(
      collection(db, 'customers'),
      where('username', '>=', searchQuery),
      where('username', '<=', searchQuery + '\uf8ff'),
      limit(10)
    );
    
    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.size} users matching "${searchQuery}":`);
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.name} (@${data.username})`);
    });
  } catch (error) {
    console.error('Search error:', error.message);
    if (error.message.includes('index')) {
      console.log('\n⚠️  You need to create a Firestore index for username search!');
    }
  }
}

testUsernameSearch();
