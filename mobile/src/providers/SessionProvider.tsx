import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { Platform } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/src/lib/supabase';
import { googleSignIn, signOutGoogle } from '@/src/services/googleAuthService';
import { appleSignIn, isAppleAuthAvailable } from '@/src/services/appleAuthService';
import { useBookmarkStore } from '@/src/stores/bookmarkStore';
import { useLikeStore } from '@/src/stores/likeStore';
import { useUserFollowStore } from '@/src/stores/userFollowStore';
import { useYouTubeStore } from '@/src/stores/youtubeStore';
import { useSettingsStore } from '@/src/stores/settingsStore';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
}

interface AuthContextValue {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => void;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signOut: () => {},
  session: null,
  user: null,
  profile: null,
  isLoading: true,
});

export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== 'production') {
    if (!value) {
      throw new Error('useSession must be wrapped in a <SessionProvider />');
    }
  }
  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        clearStoresIfUserChanged(s.user.id);
        loadProfile(s.user.id);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        if (s?.user) {
          clearStoresIfUserChanged(s.user.id);
          loadProfile(s.user.id);
        } else {
          setProfile(null);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  /** Clear all per-user stores when a different user signs in */
  function clearStoresIfUserChanged(userId: string) {
    const settings = useSettingsStore.getState();
    if (settings.lastUserId !== userId) {
      // Different user (or first run with stale data) — wipe all local stores
      useBookmarkStore.getState().clear();
      useLikeStore.getState().clear();
      useUserFollowStore.getState().clear();
      useYouTubeStore.getState().clear();
      if (settings.lastUserId) settings.clear(); // only reset prefs on actual user switch
      useSettingsStore.getState().setLastUserId(userId);
    }
  }

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();
    if (data) setProfile(data);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
  }

  async function handleGoogleSignIn() {
    const { idToken } = await googleSignIn();
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) throw error;
  }

  async function handleAppleSignIn() {
    if (!isAppleAuthAvailable()) {
      throw new Error('Apple Sign-In is only available on iOS');
    }
    const { idToken, nonce } = await appleSignIn();
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: idToken,
      nonce,
    });
    if (error) throw error;
  }

  function signOut() {
    signOutGoogle();
    // Clear all user-scoped local stores so next user starts fresh
    useBookmarkStore.getState().clear();
    useLikeStore.getState().clear();
    useUserFollowStore.getState().clear();
    useYouTubeStore.getState().clear();
    useSettingsStore.getState().clear();
    supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signUp,
        signInWithGoogle: handleGoogleSignIn,
        signInWithApple: handleAppleSignIn,
        signOut,
        session,
        user: session?.user ?? null,
        profile,
        isLoading,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
