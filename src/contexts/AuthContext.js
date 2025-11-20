import React, { createContext, useContext, useEffect, useState } from 'react';
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

// Session timeout: 24 hours (86400 seconds)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let subscription = null;
    let sessionCheckInterval = null;

    const getUser = async () => {
      try {
        // Check if there's a valid session
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.log('[auth] Session check error:', error);
          // Only sign out on critical errors, not network errors
          if (error.message?.includes('Invalid') || error.message?.includes('expired')) {
            await supabaseClient.auth.signOut();
          }
          setUser(null);
          setLoading(false);
          return;
        }

        const u = session?.user ?? null;
        
        // If no session, user is signed out (but don't force sign out)
        if (!session || !u) {
          console.log('[auth] No valid session found');
          setUser(null);
          setLoading(false);
          return;
        }

        // Check if session has expired based on custom timeout (24 hours)
        const sessionCreatedAt = session.user.created_at 
          ? new Date(session.user.created_at).getTime() 
          : Date.now();
        const now = Date.now();
        const sessionAge = now - sessionCreatedAt;

        if (sessionAge > SESSION_TIMEOUT) {
          console.log('[auth] Session expired (24 hours), signing out');
          await supabaseClient.auth.signOut();
          setUser(null);
          setLoading(false);
          return;
        }

        // Verify session token is still valid (Supabase's own expiration)
        const nowSeconds = Math.floor(now / 1000);
        if (session.expires_at && session.expires_at < nowSeconds) {
          console.log('[auth] Session token expired, signing out');
          await supabaseClient.auth.signOut();
          setUser(null);
          setLoading(false);
          return;
        }

        // Session is valid
        console.log('[auth] Valid session found, user logged in');
        setUser(u);
        setLoading(false);
        if (u) await ensureProfileExists(u);
      } catch (e) {
        console.error('[auth] Exception getting session:', e);
        if (mounted) {
          // Don't sign out on network errors, just clear local state temporarily
          setUser(null);
          setLoading(false);
        }
      }
    };

    // Initial session check
    getUser();

    // Set up auth state change listener
    try {
      subscription = supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        
        console.log('[auth] Auth state changed:', event, session ? 'has session' : 'no session');
        
        const u = session?.user ?? null;
        
        // Handle different auth events
        if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (u) {
            setUser(u);
            await ensureProfileExists(u);
          }
        } else if (!u) {
          // No user in session
          setUser(null);
        }
      });
    } catch (e) {
      console.error('[auth] Error setting up auth state listener:', e);
    }

    // Check session validity periodically (every 5 minutes)
    sessionCheckInterval = setInterval(() => {
      if (!mounted) return;
      
      supabaseClient.auth.getSession().then(({ data: { session }, error }) => {
        if (!mounted) return;
        
        if (error || !session?.user) {
          return;
        }

        // Check if session expired
        const now = Date.now();
        const sessionCreatedAt = session.user.created_at 
          ? new Date(session.user.created_at).getTime() 
          : Date.now();
        const sessionAge = now - sessionCreatedAt;

        if (sessionAge > SESSION_TIMEOUT) {
          console.log('[auth] Session expired during periodic check, signing out');
          supabaseClient.auth.signOut();
          setUser(null);
        }
      }).catch((e) => {
        console.error('[auth] Error in periodic session check:', e);
      });
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Cleanup function
    return () => {
      mounted = false;
      
      // Safely unsubscribe from auth state changes
      if (subscription?.unsubscribe) {
        try {
          subscription.unsubscribe();
        } catch (e) {
          console.error('[auth] Error unsubscribing:', e);
        }
      }
      
      // Clear interval
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
      }
    };
  }, []);

  const signUp = async ({ email, password, username }) => {
    console.log('[auth] signUp called with email:', email);
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    console.log('[auth] signUp response:', { data, error });
    if (error) {
      console.error('[auth] signUp error:', error);
      return { error };
    }

    const user = data?.user;
    if (user) {
      try {
        console.log('[auth] Creating profile for user:', user.id);
        await supabaseClient.from('profiles').insert({ id: user.id, email: user.email, username: username || user.email?.split('@')[0] }).select();
        console.log('[auth] Profile created successfully');
      } catch (e) {
        console.warn('create profile after signUp failed', e?.message ?? e);
      }
    }
    return { data, error };
  };

  const signIn = async ({ email, password }) => {
    console.log('[auth] signIn called with email:', email);
    try {
      const result = await supabaseClient.auth.signInWithPassword({ email, password });
      console.log('[auth] signIn response:', result);
      
      if (result.error) {
        console.error('[auth] signIn error:', result.error);
        // Clear any stale session on error
        await supabaseClient.auth.signOut();
        return result;
      }

      // Verify session was created
      if (result.data?.session) {
        console.log('[auth] Session created successfully');
        setUser(result.data.session.user);
      } else {
        console.warn('[auth] No session in signIn response');
        await supabaseClient.auth.signOut();
      }
      
      return result;
    } catch (e) {
      console.error('[auth] SignIn exception:', e);
      await supabaseClient.auth.signOut();
      return { error: e, data: null };
    }
  };

  const signOut = async () => {
    try {
      console.log('[auth] Signing out...');
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        console.error('[auth] SignOut error:', error);
      }
      setUser(null);
      console.log('[auth] Signed out successfully');
    } catch (e) {
      console.error('[auth] SignOut exception:', e);
      // Even if there's an error, clear local user state
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
