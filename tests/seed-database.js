require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, updateDoc, addDoc, getDocs, getDoc } = require('firebase/firestore');

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

// Sample menu items for different restaurant types
const menuTemplates = {
  canteen: [
    { name: 'Veg Thali', price: 80, category: 'Main Course', isVeg: true, description: 'Complete vegetarian meal with rice, dal, sabzi, roti' },
    { name: 'Chicken Biryani', price: 120, category: 'Main Course', isVeg: false, description: 'Aromatic basmati rice with tender chicken pieces' },
    { name: 'Paneer Butter Masala', price: 100, category: 'Main Course', isVeg: true, description: 'Creamy paneer curry with butter and spices' },
    { name: 'Masala Dosa', price: 60, category: 'South Indian', isVeg: true, description: 'Crispy dosa with spiced potato filling' },
    { name: 'Samosa (2 pcs)', price: 30, category: 'Snacks', isVeg: true, description: 'Deep fried pastry with spiced potato filling' },
    { name: 'Tea', price: 15, category: 'Beverages', isVeg: true, description: 'Hot masala chai' },
    { name: 'Coffee', price: 20, category: 'Beverages', isVeg: true, description: 'Fresh filter coffee' }
  ],
  cafe: [
    { name: 'Cappuccino', price: 80, category: 'Beverages', isVeg: true, description: 'Rich espresso with steamed milk foam' },
    { name: 'Chicken Sandwich', price: 120, category: 'Sandwiches', isVeg: false, description: 'Grilled chicken with fresh vegetables' },
    { name: 'Veg Burger', price: 90, category: 'Burgers', isVeg: true, description: 'Crispy veg patty with cheese and sauces' },
    { name: 'Pasta Arrabiata', price: 140, category: 'Italian', isVeg: true, description: 'Penne pasta in spicy tomato sauce' },
    { name: 'French Fries', price: 60, category: 'Snacks', isVeg: true, description: 'Crispy golden potato fries' },
    { name: 'Chocolate Shake', price: 100, category: 'Beverages', isVeg: true, description: 'Thick chocolate milkshake' }
  ]
};

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  // 1. Get all restaurants
  const restaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
  const restaurants = [];
  restaurantsSnapshot.forEach(doc => {
    restaurants.push({ id: doc.id, ...doc.data() });
  });

  console.log(`Found ${restaurants.length} restaurants`);

  // 2. Add menu items to restaurants with empty menus
  for (const restaurant of restaurants) {
    if (!restaurant.menu || restaurant.menu.length === 0) {
      console.log(`\n📋 Adding menu to: ${restaurant.name}`);
      
      // Determine menu type based on restaurant name
      let menuItems;
      if (restaurant.name.toLowerCase().includes('canteen')) {
        menuItems = menuTemplates.canteen;
      } else {
        menuItems = menuTemplates.cafe;
      }

      // Create menu items with proper structure
      const menu = menuItems.map((item, index) => ({
        id: `item_${Date.now()}_${index}`,
        ...item,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // Update restaurant with menu
      await updateDoc(doc(db, 'restaurants', restaurant.id), {
        menu,
        updatedAt: new Date()
      });

      console.log(`  ✅ Added ${menu.length} menu items`);
    } else {
      console.log(`\n📋 ${restaurant.name}: Already has ${restaurant.menu.length} menu items`);
    }
  }

  // 3. Get customers for creating sample orders
  const customersSnapshot = await getDocs(collection(db, 'customers'));
  const customers = [];
  customersSnapshot.forEach(doc => {
    customers.push({ id: doc.id, ...doc.data() });
  });

  console.log(`\n👥 Found ${customers.length} customers`);

  // 4. Create sample orders for testing (only if needed)
  const ordersSnapshot = await getDocs(collection(db, 'orders'));
  const validOrders = [];
  ordersSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.restaurantName && data.totalAmount) {
      validOrders.push(data);
    }
  });

  console.log(`\n📦 Found ${validOrders.length} valid orders out of ${ordersSnapshot.size} total`);

  // 5. Add operating hours to restaurants that don't have them
  for (const restaurant of restaurants) {
    if (!restaurant.operatingHours) {
      console.log(`\n🕒 Adding operating hours to: ${restaurant.name}`);
      
      const operatingHours = {
        monday: { open: "08:00", close: "22:00", isOpen: true },
        tuesday: { open: "08:00", close: "22:00", isOpen: true },
        wednesday: { open: "08:00", close: "22:00", isOpen: true },
        thursday: { open: "08:00", close: "22:00", isOpen: true },
        friday: { open: "08:00", close: "22:00", isOpen: true },
        saturday: { open: "09:00", close: "23:00", isOpen: true },
        sunday: { open: "09:00", close: "21:00", isOpen: true }
      };

      await updateDoc(doc(db, 'restaurants', restaurant.id), {
        operatingHours,
        updatedAt: new Date()
      });

      console.log(`  ✅ Added operating hours`);
    }
  }

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📊 Summary:');
  console.log(`  • ${restaurants.length} restaurants processed`);
  console.log(`  • ${customers.length} customers available`);
  console.log(`  • ${validOrders.length} valid orders in system`);
  console.log('\n✨ Your apps are ready for testing!');
}

seedDatabase().catch(console.error);
