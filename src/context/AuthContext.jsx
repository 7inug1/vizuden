import { createContext, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import {
  STORAGE_KEYS,
  getStoredBoolean,
  getStoredString,
  removeStoredValue,
  setStoredBoolean,
  setStoredString,
} from '../lib/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [isGuest, setIsGuest] = useState(() => getStoredBoolean(STORAGE_KEYS.guestMode));

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        removeStoredValue(STORAGE_KEYS.guestMode);
        setIsGuest(false);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  function continueAsGuest() {
    setStoredBoolean(STORAGE_KEYS.guestMode, true);
    setIsGuest(true);
  }

  function clearGuestMode() {
    removeStoredValue(STORAGE_KEYS.guestMode);
    setIsGuest(false);
  }

  function setPostAuthRedirect(path) {
    if (path) setStoredString(STORAGE_KEYS.authRedirect, path);
  }

  function consumePostAuthRedirect() {
    const redirect = getStoredString(STORAGE_KEYS.authRedirect);
    removeStoredValue(STORAGE_KEYS.authRedirect);
    return redirect;
  }

  async function signInWithGoogle(redirectTo) {
    if (!supabase) throw new Error('Supabase auth is not configured');
    clearGuestMode();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });
    if (error) throw error;
  }

  async function signInWithMagicLink(email, redirectTo) {
    if (!supabase) throw new Error('Supabase auth is not configured');
    clearGuestMode();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    if (error) throw error;
  }

  async function signOut() {
    clearGuestMode();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        isGuest,
        isSupabaseConfigured,
        signInWithGoogle,
        signInWithMagicLink,
        signOut,
        continueAsGuest,
        setPostAuthRedirect,
        consumePostAuthRedirect,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
