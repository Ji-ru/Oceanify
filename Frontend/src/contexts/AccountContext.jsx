// contexts/AccountContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../utils/apiClient'; // ✅ Changed from axios

const AccountContext = createContext();

export const useAccounts = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccounts must be used within AccountProvider');
  }
  return context;
};

export const AccountProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);

  const loadAccounts = async (forceRefresh = false) => {
    // Only fetch if we haven't fetched yet or force refresh
    if (!forceRefresh && accounts.length > 0) {
      return;
    }

    setLoading(true);
    try {
      // ✅ Using apiClient instead of axios
      const response = await apiClient.get("/accounts");
      setAccounts(response.data);
      setLastFetch(new Date());
    } catch (error) {
      console.error("Error loading accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const addAccount = (account) => {
    setAccounts(prev => [...prev, account]);
  };

  const updateAccount = (id, updatedData) => {
    setAccounts(prev => 
      prev.map(acc => acc.id === id ? { ...acc, ...updatedData } : acc)
    );
  };

  const removeAccount = (id) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  return (
    <AccountContext.Provider
      value={{
        accounts,
        loading,
        lastFetch,
        loadAccounts,
        addAccount,
        updateAccount,
        removeAccount,
        setAccounts
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};