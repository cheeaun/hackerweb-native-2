# HackerWeb — Agent Guide

## Project Overview

A read-only Hacker News client for iOS, built with React Native and Expo.

## Tech Stack

- **Expo SDK 56** (managed workflow)
- **React Native 0.85.3**
- **React 19.2.3**
- **Navigation**: Expo Router (file-based routing)
- **Node.js**: >= 20.x
- **iOS only** (platforms: `["ios"]`)
- **Min iOS version**: 26.0
- **All source files are `.js`/`.jsx`** (no TypeScript)

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo-router` | File-based routing |
| `react-native-gesture-handler` | Gesture handling |
| `react-native-reanimated` | Animations |
| `react-native-safe-area-context` | Safe area insets |
| `react-native-screens` | Native screen containers |
| `react-native-webview` | In-app browser |
| `react-native-worklets` | Worklet support (used by reanimated) |
| `ky` | HTTP client (wraps `fetch`) |
| `zustand` | State management |
| `expo-updates` | OTA updates |
| `expo-symbols` | SF Symbols |

## Commands

```sh
npm start              # Start Expo dev server
npm run ios            # Start on iOS simulator
npm run web            # Start on web
npm run eas-build-sim  # Build iOS simulator dev build
```

### Deployment

Two EAS profiles in `eas.json`:
- **preview**: staging channel, auto-submit to TestFlight
- **production**: production channel, auto-submit to App Store

GitHub Actions deploy on push to `main`:
- `.github/workflows/main.yml` — staging deploy (preview build or OTA update)
- `.github/workflows/deploy-prod.yml` — production deploy (manual trigger)

## Project Structure

```
App.js            — App entry, passes to Expo Router
app/              — File-based routes (Expo Router)
screens/           — Screen components
components/        — Reusable UI components
hooks/             — Custom hooks (useStore, useTheme, etc.)
utils/             — Utility functions
assets/            — Icons, splash images
```

## Rules

- **Never commit or push without explicit permission.** Wait for the user to say "commit", "push", or similar before staging/committing/pushing.

## Conventions

- Use `SymbolView` from `expo-symbols` for icons (SF Symbols)
- Theming via `useTheme` hook (dark mode aware)
- Navigation uses Expo Router native stack
- **Formatting**: `oxfmt` (0.52.0), config in `.oxfmtrc.json`. Run `npx oxfmt --write <files>` or `npx oxfmt --write .` to format.

## Navigation

- **Expo Router** with file-based routing
- Stack.Screen presentation: `modal` for overlays, `formSheet` for user screen
- Use `useLocalSearchParams` for route params, `useRouter` for navigation
- OTA update logic is in `app/_layout.jsx`
