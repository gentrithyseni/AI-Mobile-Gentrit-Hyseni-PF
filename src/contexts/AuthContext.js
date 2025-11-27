import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import supabaseClient from '../config/supabase';

const AuthContext = createContext();

async function ensureProfileExists(user) {
  if (!user) return;
  try {
    const { data: existing, error: selectErr } = await supabaseClient.from('profiles').select('id').eq('id', user.id).limit(1).maybeSingle();
    if (selectErr) return;
    if (!existing) {
      await supabaseClient.from('profiles').insert({ id: user.id, email: user.email, username: user.email?.split('@')[0] ?? null }).select();
    }
  } catch (e) {
    console.warn('ensureProfileExists error', e?.message ?? e);
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.log('[auth] Error getting session:', error);
          }
          
          if (session?.user) {
            console.log('[auth] Initial session found for:', session.user.email);
            setUser(session.user);
            ensureProfileExists(session.user);
          } else {
            console.log('[auth] No initial session');
            setUser(null);
          }
          setLoading(false);
        }
      } catch (e) {
        console.error('[auth] Exception initializing auth:', e);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log(`[auth] Auth state changed: ${event}`);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user);
          ensureProfileExists(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        // On Web, sometimes local storage isn't cleared instantly, but setUser(null) should update UI
        if (Platform.OS === 'web') {
           // Optional: Force clear if needed, but Supabase SDK usually handles it.
           // localStorage.removeItem('sb-<your-project-id>-auth-token'); 
        }
      } else if (event === 'USER_UPDATED') {
         if (session?.user) setUser(session.user);
      }
      
      // If we receive a session but user is null, ensure we clear user
      if (!session) {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []); // user dependency not needed here as we listen to auth state changes

  const signUp = async ({ email, password, username }) => {
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) return { error };

    if (data?.user) {
      await ensureProfileExists(data.user);
    }
    return { data, error };
  };

  const signIn = async ({ email, password }) => {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) return { error };
      return { data, error: null };
    } catch (e) {
      return { error: e };
    }
  };

  const signOut = async () => {
    try {
      console.log('[auth] Signing out...');
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      setUser(null); // Immediate UI update
    } catch (e) {
      console.error('[auth] SignOut error:', e);
      // Force UI logout even if API fails
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
