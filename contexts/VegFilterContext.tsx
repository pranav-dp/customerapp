import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type VegFilter = 'all' | 'veg' | 'nonveg';

interface VegFilterContextType {
  vegFilter: VegFilter;
  setVegFilter: (filter: VegFilter) => void;
}

const VegFilterContext = createContext<VegFilterContextType | undefined>(undefined);

const STORAGE_KEY = '@veg_filter';

export function VegFilterProvider({ children }: { children: ReactNode }) {
  const [vegFilter, setVegFilterState] = useState<VegFilter>('all');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(value => {
      if (value === 'veg' || value === 'nonveg' || value === 'all') {
        setVegFilterState(value);
      }
    });
  }, []);

  const setVegFilter = (filter: VegFilter) => {
    setVegFilterState(filter);
    AsyncStorage.setItem(STORAGE_KEY, filter);
  };

  return (
    <VegFilterContext.Provider value={{ vegFilter, setVegFilter }}>
      {children}
    </VegFilterContext.Provider>
  );
}

export function useVegFilter() {
  const context = useContext(VegFilterContext);
  if (!context) {
    throw new Error('useVegFilter must be used within VegFilterProvider');
  }
  return context;
}
