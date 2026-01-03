import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface Budget {
  monthlyLimit: number;
  currentMonth: string; // "2026-01"
  spent: number;
}

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const getBudget = async (customerId: string): Promise<{ success: boolean; data?: Budget; error?: string }> => {
  try {
    const docRef = doc(db, 'customers', customerId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'Customer not found' };
    }
    
    const data = docSnap.data();
    const currentMonth = getCurrentMonth();
    
    // Reset spent if new month
    if (data.budget?.currentMonth !== currentMonth) {
      return { 
        success: true, 
        data: { 
          monthlyLimit: data.budget?.monthlyLimit || 0, 
          currentMonth, 
          spent: 0 
        } 
      };
    }
    
    return { success: true, data: data.budget };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const setBudgetLimit = async (customerId: string, limit: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const docRef = doc(db, 'customers', customerId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'Customer not found' };
    }
    
    const currentMonth = getCurrentMonth();
    const existingBudget = docSnap.data().budget;
    
    await updateDoc(docRef, {
      budget: {
        monthlyLimit: limit,
        currentMonth,
        spent: existingBudget?.currentMonth === currentMonth ? (existingBudget?.spent || 0) : 0
      }
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const addToSpent = async (customerId: string, amount: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const docRef = doc(db, 'customers', customerId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'Customer not found' };
    }
    
    const currentMonth = getCurrentMonth();
    const existingBudget = docSnap.data().budget;
    const currentSpent = existingBudget?.currentMonth === currentMonth ? (existingBudget?.spent || 0) : 0;
    
    await updateDoc(docRef, {
      budget: {
        monthlyLimit: existingBudget?.monthlyLimit || 0,
        currentMonth,
        spent: currentSpent + amount
      }
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getBudgetStatus = (budget: Budget | null, orderAmount: number, splitCount: number = 1) => {
  if (!budget || budget.monthlyLimit <= 0) {
    return null;
  }
  
  const yourShare = Math.ceil(orderAmount / splitCount);
  const remaining = budget.monthlyLimit - budget.spent;
  const afterOrder = remaining - yourShare;
  const percentUsed = (budget.spent / budget.monthlyLimit) * 100;
  
  let status: 'good' | 'warning' | 'danger' = 'good';
  if (percentUsed >= 90 || afterOrder < 0) status = 'danger';
  else if (percentUsed >= 70) status = 'warning';
  
  return {
    limit: budget.monthlyLimit,
    spent: budget.spent,
    remaining,
    yourShare,
    afterOrder,
    percentUsed,
    status
  };
};
