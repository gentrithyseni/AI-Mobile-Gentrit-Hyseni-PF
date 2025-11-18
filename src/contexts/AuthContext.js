import React, { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../config/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (mounted) {
        setUser(data?.user ?? null);
        setLoading(false);
      }
    };
    getUser();

    const { subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async ({ email, password }) => {
    const result = await supabase.auth.signUp({ email, password });
    return result;
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
