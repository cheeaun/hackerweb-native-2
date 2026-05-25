# HackerWeb — Agent Guide

## Project Overview

A read-only Hacker News client for iOS, built with React Native and Expo.

## Tech Stack

- **Expo SDK 56** (managed workflow)
- **React Native 0.85.3**
- **React 19.2.3**
- **Navigation**: React Navigation (`@react-navigation/native-stack`) — NOT Expo Router
- **Node.js**: >= 20.x
- **iOS only** (platforms: `["ios"]`)
- **Min iOS version**: 26.0
- **All source files are `.js`/`.jsx`** (no TypeScript)

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@react-navigation/native-stack` | Native stack navigation |
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
App.js            — App entry, navigation setup
screens/           — Screen components
components/        — Reusable UI components
hooks/             — Custom hooks (useStore, useTheme, etc.)
utils/             — Utility functions
assets/            — Icons, splash images
```

## Conventions

- Use `SymbolView` from `expo-symbols` for icons (SF Symbols)
- Theming via `useTheme` hook (dark mode aware)
- Navigation uses React Navigation native stack — NOT Expo Router
- All OTA update logic is in `App.js`
