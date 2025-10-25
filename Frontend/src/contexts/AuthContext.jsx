import { createContext, useContext, useEffect, useState } from "react";
import supabase from "../supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user role from profiles table
  const fetchUserRole = async (userId) => {
    console.log("🔵 fetchUserRole called for userId:", userId);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);
      console.log("🔵 fetchUserRole response - data:", data, "error:", error);

      if (error) {
        console.error('🔴 Error fetching user role:', error);
        setUserRole('user');
        return 'user';
      }
      
      const role = data?.role || 'user';
      console.log("✅ User role set to:", role);
      setUserRole(role);
      return role;
    } catch (error) {
      console.error('🔴 Exception in fetchUserRole:', error);
      setUserRole('user');
      return 'user';
    }
  };

  useEffect(() => {
    console.log("🔵 AuthContext: Initializing...");
    
    supabase.auth.getSession().then(async ({ data, error }) => {
      console.log("🔵 getSession response - data:", data?.session?.user?.id, "error:", error);
      
      if (error) {
        console.error('🔴 Error getting session:', error);
        setLoading(false);
        return;
      }

      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await fetchUserRole(currentUser.id);
      }
      
      console.log("✅ Initial auth check complete, setting loading to false");
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("🔵 Auth state changed - event:", _event);
      
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await fetchUserRole(currentUser.id);
      } else {
        setUserRole(null);
      }
    });

    return () => {
      console.log("🔵 Cleaning up auth listener");
      if (listener?.subscription) listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async ({ email, password }) => {
    console.log("🔵 signIn called with email:", email);
    
    try {
      console.log("🔵 Calling supabase.auth.signInWithPassword...");
      console.time("signInWithPassword");
      
      // Add timeout to the auth call
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sign in timeout after 15 seconds')), 15000)
      );
      
      const signInPromise = supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      const { data, error } = await Promise.race([signInPromise, timeoutPromise]);
      
      console.timeEnd("signInWithPassword");
      console.log("🔵 signInWithPassword response - user:", data?.user?.id, "error:", error);
      
      if (error) {
        console.error('🔴 Sign in error:', error);
        return { data: null, error };
      }
      
      console.log("✅ Sign in successful");
      
      // Don't fetch role here - let the onAuthStateChange handle it
      // This prevents duplicate calls
      
      return { data, error: null };
    } catch (error) {
      console.error('🔴 Sign in exception:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    console.log("🔵 signOut called");
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
      console.log("✅ Sign out successful");
    } catch (error) {
      console.error('🔴 Sign out error:', error);
      setUser(null);
      setUserRole(null);
    }
  };

  const refreshUserRole = async () => {
    console.log("🔵 refreshUserRole called");
    if (user) {
      await fetchUserRole(user.id);
    }
  };

  const value = { 
    user, 
    userRole, 
    setUser, 
    loading, 
    signIn, 
    signOut,
    refreshUserRole,
    isAdmin: userRole === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);