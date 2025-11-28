// contexts/AccountContext.jsx
import { createClient } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useState } from 'react';
import apiClient from '../utils/apiClient'; // ✅ Changed from axios

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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

  const loadAccounts = useCallback(async (forceRefresh = false) => {
    // Only fetch if we haven't fetched yet or force refresh
    if (!forceRefresh && accounts.length > 0) {
      return;
    }

    setLoading(true);
    try {
      // ✅ Using apiClient instead of axios
      const response = await apiClient.get("/accounts");
      console.log('AccountContext response:', response);
      console.log('AccountContext data:', response.data);

      // Validate response data
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        console.log('❌ Account API returned HTML instead of JSON');
        throw new Error('API returned HTML');
      }

      setAccounts(Array.isArray(response.data) ? response.data : []);
      setLastFetch(new Date());
    } catch (error) {
      console.error("Error loading accounts from Laravel:", error);

      // Fallback to Supabase
      try {
        const { data: supabaseData, error: supabaseError } = await supabase
          .from("profiles") // Table name is 'profiles'
          .select("*")
          .order("created_at", { ascending: false });

        if (supabaseError) throw supabaseError;
        if (supabaseData) {
          setAccounts(supabaseData);
          setLastFetch(new Date());
          console.log('✅ Accounts loaded from Supabase fallback');
        }
      } catch (supabaseError) {
        console.error("Error loading accounts from Supabase:", supabaseError);
      }
    } finally {
      setLoading(false);
    }
  }, [accounts.length]);

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