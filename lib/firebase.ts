import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  // @ts-expect-error — available in the React Native Firebase Auth bundle
  getReactNativePersistence,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

function logFirebaseConfig(config: typeof firebaseConfig) {
  const apiKey = config.apiKey;
  const maskedKey =
    apiKey.length > 12 ? `${apiKey.slice(0, 8)}…${apiKey.slice(-6)}` : '(missing)';

  console.log('[firebase] runtime config', {
    apiKey: maskedKey,
    authDomain: config.authDomain || '(missing)',
    projectId: config.projectId || '(missing)',
    storageBucket: config.storageBucket || '(missing)',
    messagingSenderId: config.messagingSenderId || '(missing)',
    appId: config.appId || '(missing)',
  });
}

function createFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }

  logFirebaseConfig(firebaseConfig);
  return initializeApp(firebaseConfig);
}

function createAuth(firebaseApp: FirebaseApp): Auth {
  if (Platform.OS === 'web') {
    return getAuth(firebaseApp);
  }

  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Auth already initialized (Fast Refresh / HMR)
    return getAuth(firebaseApp);
  }
}

/** Single Firebase app instance for the whole JS runtime. */
export const app = createFirebaseApp();
export const auth: Auth = createAuth(app);
export const db: Firestore = getFirestore(app);
