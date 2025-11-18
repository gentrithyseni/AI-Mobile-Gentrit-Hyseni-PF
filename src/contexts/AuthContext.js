import React, { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../config/supabase';

const AuthContext = createContext();

async function ensureProfileExists(user) {
  if (!user) return;
  try {
    const { data: existing, error: selectErr } = await supabase.from('profiles').select('id').eq('id', user.id).limit(1).maybeSingle();
    if (selectErr) return;
    if (!existing) {
      await supabase.from('profiles').insert({ id: user.id, email: user.email, username: user.email?.split('@')[0] ?? null }).select();
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
      const { data } = await supabase.auth.getUser();
      if (mounted) {
        const u = data?.user ?? null;
        setUser(u);
        setLoading(false);
        if (u) await ensureProfileExists(u);
      }
    };
    getUser();

    const { subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error };

    const user = data?.user;
    if (user) {
      try {
        await supabase.from('profiles').insert({ id: user.id, email: user.email, username: username || user.email?.split('@')[0] }).select();
      } catch (e) {
        console.warn('create profile after signUp failed', e?.message ?? e);
      }
    }
    return { data, error };
  };

  const signIn = async ({ email, password }) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    return result;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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
