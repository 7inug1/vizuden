import { createContext, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import {
  STORAGE_KEYS,
  getStoredBoolean,
  getStoredString,
  removeStoredValue,
  removeStoredSessionValue,
  setStoredBoolean,
  setStoredString,
} from '../lib/storage';

function migrateGuestData(accessToken, guestSessionId) {
  if (!guestSessionId) return;
  fetch('/api/migrate-guest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ guestSessionId }),
  }).catch(() => {});
}

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
        if (_event === 'SIGNED_IN') {
          migrateGuestData(nextSession.access_token, getStoredString(STORAGE_KEYS.guestSessionId));
        }
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
    removeStoredValue(STORAGE_KEYS.authRedirect);
    removeStoredSessionValue(STORAGE_KEYS.prescriptionAccessCode);
    removeStoredSessionValue(STORAGE_KEYS.consultingAccessCode);
    removeStoredSessionValue(STORAGE_KEYS.trackingSessionId);
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
