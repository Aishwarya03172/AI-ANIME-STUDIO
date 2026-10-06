import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';

import { auth } from '@/lib/firebase';
import {
  createUserProfile,
  signInWithEmail,
  signOut as signOutRequest,
  signUpWithEmail,
} from '@/services';
import type { AuthContextValue } from '@/types/auth';

const AuthContext = createContext<AuthContextValue | null>(null);

async function ensureUserDocument(user: User) {
  await createUserProfile({
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName,
    photoURL: user.photoURL,
    subscription: 'Free',
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);

      if (nextUser) {
        // Fire-and-forget: create profile on first auth, never overwrite.
        void ensureUserDocument(nextUser).catch((error) => {
          console.warn('[auth] Failed to ensure user profile', error);
        });
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async signIn(email, password) {
        const credential = await signInWithEmail({ email, password });
        await ensureUserDocument(credential.user);
        return credential.user;
      },
      async signUp(email, password) {
        const credential = await signUpWithEmail({ email, password });
        await ensureUserDocument(credential.user);
        return credential.user;
      },
      async signOut() {
        await signOutRequest();
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
