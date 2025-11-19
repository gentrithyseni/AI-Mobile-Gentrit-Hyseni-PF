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
      const { data } = await supabaseClient.auth.getUser();
      if (mounted) {
        const u = data?.user ?? null;
        setUser(u);
        setLoading(false);
        if (u) await ensureProfileExists(u);
      }
    };
    getUser();

    const { subscription } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) await ensureProfileExists(u);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
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
    const result = await supabaseClient.auth.signInWithPassword({ email, password });
    console.log('[auth] signIn response:', result);
    if (result.error) {
      console.error('[auth] signIn error:', result.error);
    }
    return result;
  };

  const signOut = async () => {
    await supabaseClient.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
