import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import supabase from "../supabaseClient";

const AuthContext = createContext();

const ROLE_CACHE_KEY = 'user_role_cache';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const isFetchingRole = useRef(false);

  // Get cached role from localStorage
  const getCachedRole = (userId) => {
    try {
      const cached = localStorage.getItem(ROLE_CACHE_KEY);
      if (cached) {
        const { userId: cachedUserId, role, timestamp } = JSON.parse(cached);
        // Cache valid for 24 hours
        if (cachedUserId === userId && Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          return role;
        }
      }
    } catch (e) {
      console.error('Error reading cached role:', e);
    }
    return null;
  };

  // Save role to localStorage
  const setCachedRole = (userId, role) => {
    try {
      localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify({
        userId,
        role,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error('Error caching role:', e);
    }
  };

  // Fetch user role from profiles table
  const fetchUserRole = useCallback(async (userId) => {
    if (isFetchingRole.current) {
      return userRole || 'user';
    }

    // Check cache first
    const cachedRole = getCachedRole(userId);
    if (cachedRole) {
      console.log('Using cached role:', cachedRole);
      setUserRole(cachedRole);
      return cachedRole;
    }

    isFetchingRole.current = true;
    console.log('Fetching role for user:', userId);
    
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Role fetch timeout')), 15000)
      );
      
      const startTime = performance.now();
      const fetchPromise = supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      const endTime = performance.now();
      
      console.log(`Role fetch completed in ${Math.round(endTime - startTime)}ms`);

      if (error) {
        console.error('Error fetching user role:', error);
        const fallbackRole = userRole || 'user';
        setUserRole(fallbackRole);
        setCachedRole(userId, fallbackRole);
        return fallbackRole;
      }
      
      const role = data?.role || 'user';
      console.log('User role fetched:', role);
      setUserRole(role);
      setCachedRole(userId, role);
      return role;
    } catch (error) {
      console.error('Exception in fetchUserRole:', error);
      const fallbackRole = userRole || 'user';
      setUserRole(fallbackRole);
      setCachedRole(userId, fallbackRole);
      return fallbackRole;
    } finally {
      isFetchingRole.current = false;
    }
  }, [userRole]);

  useEffect(() => {
    let mounted = true;
    
    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth loading timeout reached');
        setLoading(false);
        if (!userRole) {
          setUserRole('user');
        }
      }
    }, 15000);
    
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error('Error getting session:', error);
        clearTimeout(loadingTimeout);
        setLoading(false);
        return;
      }

      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await fetchUserRole(currentUser.id);
      }
      
      clearTimeout(loadingTimeout);
      setLoading(false);
    }).catch((err) => {
      if (!mounted) return;
      console.error('getSession exception:', err);
      clearTimeout(loadingTimeout);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth event:', event);
      
      // Ignore token refresh and initial session events
      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        return;
      }
      
      const currentUser = session?.user ?? null;
      const currentUserId = user?.id;
      
      // Only update if user actually changed
      if (currentUser?.id !== currentUserId) {
        setUser(currentUser);
        
        if (currentUser && event === 'SIGNED_IN') {
          await fetchUserRole(currentUser.id);
        } else if (!currentUser && event === 'SIGNED_OUT') {
          setUserRole(null);
          localStorage.removeItem(ROLE_CACHE_KEY);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      if (listener?.subscription) listener.subscription.unsubscribe();
    };
  }, [fetchUserRole, user?.id, userRole]);

  const signIn = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Sign in exception:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
      localStorage.removeItem(ROLE_CACHE_KEY);
    } catch (error) {
      console.error('Sign out error:', error);
      setUser(null);
      setUserRole(null);
      localStorage.removeItem(ROLE_CACHE_KEY);
    }
  };

  const refreshUserRole = async () => {
    if (user) {
      localStorage.removeItem(ROLE_CACHE_KEY);
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