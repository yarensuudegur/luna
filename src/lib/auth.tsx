import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  name: string | null;
  handle: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_time_known: boolean;
  birth_place: string | null;
  lat: number | null;
  lon: number | null;
  timezone: string | null;
  avatar: string | null;
  created_at: string;
};

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  /** Oturum ve profil ilk kez okunana kadar true. */
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

/** Onboarding'in istediği her alan dolu mu? */
export function isProfileComplete(p: Profile | null): boolean {
  return !!(p && p.name && p.handle && p.birth_date && p.birth_place);
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return (data as Profile | null) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!sessionReady) return;
    if (!userId) {
      setProfile(null);
      setProfileReady(true);
      return;
    }
    let cancelled = false;
    setProfileReady(false);
    fetchProfile(userId).then((p) => {
      if (cancelled) return;
      setProfile(p);
      setProfileReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionReady, userId]);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    setProfile(await fetchProfile(userId));
  }, [userId]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      loading: !sessionReady || !profileReady,
      refreshProfile,
      signOut,
    }),
    [session, profile, sessionReady, profileReady, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalı.');
  return ctx;
}
