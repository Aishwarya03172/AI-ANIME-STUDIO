# AI Anime Studio

React Native Expo app (TypeScript) with Expo Router, Firebase, and NativeWind.

## Stack

- **Expo SDK 57** + TypeScript
- **Expo Router** — file-based navigation
- **Firebase Auth** — email/password with AsyncStorage persistence
- **Cloud Firestore** — user profiles and app data
- **Firebase Storage** — file uploads
- **NativeWind v4** — Tailwind CSS for React Native

## Getting started

```bash
npm install
cp .env.example .env
npm start
```

Fill in Firebase web config values in `.env`. In the Firebase console:

1. Authentication → Sign-in method → enable **Email/Password**
2. Firestore Database → create database
3. Storage → get started
4. Use a **valid** Browser API key (Google Cloud → Credentials). If signup returns `auth/api-key-not-valid`, regenerate the key.

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start Expo dev server |
| `npm run ios` | Open iOS simulator |
| `npm run android` | Open Android emulator |
| `npm run web` | Run in the browser |

## Folder structure

```
app/                 # Expo Router screens
  (auth)/            # Login & signup (public)
  (tabs)/            # Authenticated tabs
components/ui/       # Reusable UI primitives
lib/                 # Firebase client + helpers
providers/           # AuthProvider
services/            # Auth, Firestore, Storage
types/               # Shared TypeScript types
```

## Firebase modules

| Path | Role |
| --- | --- |
| `lib/firebase.ts` | Initializes App, Auth, Firestore, Storage |
| `providers/AuthProvider.tsx` | Auth state + `useAuth()` |
| `services/auth.ts` | Email/password sign-in helpers |
| `services/firestore.ts` | User profiles + generic document helpers |
| `services/storage.ts` | Upload / download / delete files |

## Auth flow

- `AuthProvider` listens to `onAuthStateChanged`
- Sign-up also writes a `users/{uid}` Firestore profile
- Unauthenticated users → `/(auth)/login`
- Authenticated users → `/(tabs)`
