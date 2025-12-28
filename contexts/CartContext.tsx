import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';

export interface ItemAssignment {
  friendId: string;
  friendName: string;
  quantity: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isVeg?: boolean;
  restaurantId: string;
  restaurantName: string;
  assignments?: ItemAssignment[];
}

interface CartContextType {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  addItem: (item: Omit<CartItem, 'quantity' | 'assignments'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateAssignments: (itemId: string, assignments: ItemAssignment[]) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  getSplitSummary: (myName: string) => Record<string, number>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);

  const addItem = (item: Omit<CartItem, 'quantity' | 'assignments'>) => {
    if (restaurantId && restaurantId !== item.restaurantId) {
      setItems([{ ...item, quantity: 1 }]);
      setRestaurantId(item.restaurantId);
      setRestaurantName(item.restaurantName);
      return;
    }

    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    
    if (!restaurantId) {
      setRestaurantId(item.restaurantId);
      setRestaurantName(item.restaurantName);
    }
  };

  const removeItem = (itemId: string) => {
    setItems(prev => {
      const updated = prev.filter(i => i.id !== itemId);
      if (updated.length === 0) {
        setRestaurantId(null);
        setRestaurantName(null);
      }
      return updated;
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems(prev => prev.map(i => {
      if (i.id !== itemId) return i;
      // Clear assignments if quantity changed (user needs to reassign)
      return { ...i, quantity, assignments: undefined };
    }));
  };

  const updateAssignments = (itemId: string, assignments: ItemAssignment[]) => {
    setItems(prev => prev.map(i => 
      i.id === itemId ? { ...i, assignments } : i
    ));
  };

  const clearCart = () => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName(null);
  };

  const { totalItems, totalAmount } = useMemo(() => ({
    totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
    totalAmount: items.reduce((sum, i) => sum + (i.price * i.quantity), 0),
  }), [items]);

  // Calculate how much each person owes
  const getSplitSummary = (myName: string): Record<string, number> => {
    const summary: Record<string, number> = {};
    
    items.forEach(item => {
      if (item.assignments && item.assignments.length > 0) {
        item.assignments.forEach(a => {
          const name = a.friendName;
          summary[name] = (summary[name] || 0) + (item.price * a.quantity);
        });
      } else {
        // Unassigned items go to "Me"
        summary[myName] = (summary[myName] || 0) + (item.price * item.quantity);
      }
    });
    
    return summary;
  };

  return (
    <CartContext.Provider value={{
      items, restaurantId, restaurantName,
      addItem, removeItem, updateQuantity, updateAssignments, clearCart,
      totalItems, totalAmount, getSplitSummary
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
