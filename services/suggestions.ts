import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCustomerOrders } from './orders';

export interface SuggestedCombo {
  restaurantId: string;
  items: { id: string; name: string; price: number; isVeg: boolean }[];
  totalPrice: number;
  orderCount: number;
}

const CACHE_KEY = 'suggested_combos';

export const getSuggestedCombo = async (
  customerId: string,
  restaurantId: string
): Promise<SuggestedCombo | null> => {
  try {
    // Check cache first
    const cached = await AsyncStorage.getItem(`${CACHE_KEY}_${restaurantId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) { // 7 days
        return parsed.combo;
      }
    }

    // Fetch orders for this restaurant
    const result = await getCustomerOrders(customerId);
    if (!result.success) return null;

    const restaurantOrders = (result.data as any[])
      .filter(o => o.restaurantId === restaurantId && o.paymentStatus === 'paid')
      .slice(0, 10);

    if (restaurantOrders.length < 3) return null;

    // Count item combinations
    const itemCounts: Record<string, { item: any; count: number }> = {};
    
    restaurantOrders.forEach(order => {
      order.items?.forEach((item: any) => {
        const key = item.itemId || item.id;
        if (!itemCounts[key]) {
          itemCounts[key] = { 
            item: { id: key, name: item.name, price: item.price, isVeg: item.isVeg ?? true }, 
            count: 0 
          };
        }
        itemCounts[key].count++;
      });
    });

    // Get items ordered 3+ times
    const frequentItems = Object.values(itemCounts)
      .filter(i => i.count >= 3)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(i => i.item);

    if (frequentItems.length === 0) return null;

    const combo: SuggestedCombo = {
      restaurantId,
      items: frequentItems,
      totalPrice: frequentItems.reduce((sum, i) => sum + i.price, 0),
      orderCount: Math.min(...Object.values(itemCounts).filter(i => frequentItems.some(f => f.id === i.item.id)).map(i => i.count))
    };

    // Cache it
    await AsyncStorage.setItem(`${CACHE_KEY}_${restaurantId}`, JSON.stringify({ combo, timestamp: Date.now() }));

    return combo;
  } catch (error) {
    return null;
  }
};
