import type { User } from 'firebase/auth';

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
};
