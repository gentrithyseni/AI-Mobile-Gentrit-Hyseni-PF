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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      try {
        // Check if there's a valid session
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.log('[auth] Session check error:', error);
            // If there's an error getting session (e.g., server down), sign out
            await supabaseClient.auth.signOut();
            setUser(null);
            setLoading(false);
            return;
          }

          const u = session?.user ?? null;
          
          // If no session or session is expired, ensure user is signed out
          // This happens when server restarts or session is lost
          if (!session || !u) {
            console.log('[auth] No valid session found (server may have restarted), signing out');
            await supabaseClient.auth.signOut();
            setUser(null);
            setLoading(false);
            return;
          }

          // Verify session is still valid by checking token
          const now = Math.floor(Date.now() / 1000);
          if (session.expires_at && session.expires_at < now) {
            console.log('[auth] Session expired, signing out');
            await supabaseClient.auth.signOut();
            setUser(null);
            setLoading(false);
            return;
          }

          setUser(u);
          setLoading(false);
          if (u) await ensureProfileExists(u);
        }
      } catch (e) {
        console.error('[auth] Exception getting session (server may be down):', e);
        if (mounted) {
          // On any error (network, server down, etc.), sign out to be safe
          try {
            await supabaseClient.auth.signOut();
          } catch (signOutError) {
            console.error('[auth] Error during sign out:', signOutError);
          }
          setUser(null);
          setLoading(false);
        }
      }
    };
    getUser();

    const { subscription } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      console.log('[auth] Auth state changed:', event, session ? 'has session' : 'no session');
      
      if (mounted) {
        const u = session?.user ?? null;
        
        // Handle different auth events
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
          setUser(null);
        } else if (u) {
          setUser(u);
          await ensureProfileExists(u);
        } else {
          // No user in session, ensure signed out
          setUser(null);
        }
      }
    });

    // Cleanup: sign out when component unmounts (e.g., server stops)
    return () => {
      mounted = false;
      subscription.unsubscribe();
      // Optional: sign out on unmount if you want strict session management
      // supabaseClient.auth.signOut();
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
