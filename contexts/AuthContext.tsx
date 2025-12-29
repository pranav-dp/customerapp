import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { createCustomer, getCustomerByEmail } from '../services/firestore';

interface CustomerData {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  rollNumber?: string;
  hostel?: string;
  room?: string;
  friends?: Array<{ odid: string; odname: string; username: string }>;
  favorites?: string[];
  owes?: Record<string, number>; // { odid: amount }
}

interface AuthContextType {
  user: User | null;
  customer: CustomerData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, customerData: Omit<CustomerData, 'id'>) => Promise<void>;
  logout: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user?.email) {
        const result = await getCustomerByEmail(user.email);
        if (result.success) {
          setCustomer(result.data as CustomerData);
        } else {
          // Customer doc missing - create a basic one
          const createResult = await createCustomer({
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            username: user.email.split('@')[0].toLowerCase(),
            phone: '',
          });
          if (createResult.success) {
            const refetch = await getCustomerByEmail(user.email);
            if (refetch.success) setCustomer(refetch.data as CustomerData);
          }
        }
      } else {
        setCustomer(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string, customerData: Omit<CustomerData, 'id'>) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await createCustomer({ ...customerData, email });
  };

  const refreshCustomer = async () => {
    if (user?.email) {
      const result = await getCustomerByEmail(user.email);
      if (result.success) {
        setCustomer(result.data as CustomerData);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setCustomer(null);
  };

  return (
    <AuthContext.Provider value={{ user, customer, loading, login, signup, logout, refreshCustomer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
