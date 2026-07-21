# AI Anime Studio

React Native Expo app (TypeScript) with Expo Router, Firebase Authentication, and NativeWind.

## Stack

- **Expo SDK 57** + TypeScript
- **Expo Router** — file-based navigation
- **Firebase Auth** — email/password with AsyncStorage persistence
- **NativeWind v4** — Tailwind CSS for React Native

## Getting started

```bash
npm install
cp .env.example .env
npm start
```

Fill in Firebase values in `.env` (Expo public env vars). In the Firebase console, enable **Email/Password** under Authentication → Sign-in method.

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
components/
  ui/                # Reusable UI primitives
constants/           # Theme tokens
hooks/               # Shared hooks
lib/                 # Firebase & third-party clients
providers/           # React context providers
services/            # API / business logic (ready for features)
types/               # Shared TypeScript types
assets/              # Images & fonts
```

## Auth flow

- `AuthProvider` listens to Firebase `onAuthStateChanged`
- Unauthenticated users are redirected to `/(auth)/login`
- Authenticated users land on `/(tabs)`
