# Essentials Plan

The essentials are the smallest set of changes that produce a working, usable app: configure → connect → see players → control playback. Theming comes first because every component consumes tokens — retrofitting is expensive.

---

## Current State

Infrastructure is done. The WebSocket connection, auth flow, entity state derivation, and utilities all work. What's missing is everything the user actually sees and touches.

| Layer | Status |
|---|---|
| Types (`src/types/hass.ts`) | Done |
| `useHassConnection` hook | Done |
| `useMediaPlayers` hook | Done |
| Utilities (`buildWsUrl`, `isMediaPlayerEntity`, `formatDuration`) | Done |
| Theming (Material tokens, source color) | Missing |
| Secure credential storage | Missing |
| Settings / onboarding screen | Missing |
| Home screen (real media list) | Missing |
| All UI components | Missing |
| Service call wiring | Missing |

---

## Phase 1 — Theming Foundation

**Goal:** establish a Material Design 3 token system driven by a single source color, so every component built after this is already themed.

### 1.1 Install `@material/material-color-utilities`

```
yarn add @material/material-color-utilities
```

This is Google's official library for generating M3 tonal palettes and color schemes from an arbitrary source color (the "Material You" algorithm).

### 1.2 `AppTheme` type (`src/types/theme.ts`)

Define a flat record of hex-string token values that mirrors the M3 `Scheme` surface. All values are plain hex strings (`#rrggbb`) so they drop directly into `StyleSheet`.

```ts
export interface AppTheme {
  // source
  sourceColor: string;
  colorScheme: 'light' | 'dark';

  // primary
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;

  // secondary
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;

  // tertiary
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;

  // error
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;

  // surface / background
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;

  // utility
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  shadow: string;
  scrim: string;
}
```

Export from `src/types/index.ts`.

### 1.3 `buildTheme` utility (`src/utils/buildTheme.ts`)

Pure function — no hooks, no side effects, easy to test.

```ts
import {
  argbFromHex,
  hexFromArgb,
  themeFromSourceColor,
} from '@material/material-color-utilities';

export const buildTheme = (
  sourceHex: string,
  colorScheme: 'light' | 'dark',
): AppTheme => {
  const argb = argbFromHex(sourceHex);
  const { schemes } = themeFromSourceColor(argb);
  const s = colorScheme === 'dark' ? schemes.dark : schemes.light;

  return {
    sourceColor: sourceHex,
    colorScheme,
    primary: hexFromArgb(s.primary),
    onPrimary: hexFromArgb(s.onPrimary),
    // … all tokens mapped from s.*
  };
};
```

Export from `src/utils/index.ts`.

### 1.4 `ThemeContext` (`src/context/ThemeContext.tsx`)

```ts
interface ThemeContextValue {
  theme: AppTheme;
  setSourceColor: (hex: string) => void;
}
```

`ThemeProvider`:
1. Reads `source_color` from `AsyncStorage` (or SecureStore — whichever is added in Phase 2) on mount; falls back to a default brand hex (e.g. `#6750A4` — M3's reference purple)
2. Calls `useColorScheme()` from React Native to detect system light/dark preference
3. Derives `theme` via `buildTheme(sourceColor, systemScheme)`
4. Re-derives whenever `sourceColor` or system scheme changes
5. Persists new `sourceColor` to storage when `setSourceColor` is called

Mount `<ThemeProvider>` as the outermost wrapper in `app/_layout.tsx`.

### 1.5 `useTheme` hook (`src/hooks/useTheme.ts`)

Thin consumer hook — components import this, not the context directly:

```ts
export const useTheme = (): AppTheme => {
  const { theme } = useContext(ThemeContext);
  return theme;
};
```

### Usage in components

```tsx
const MyComponent = () => {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.surface }}>
      <Text style={{ color: theme.onSurface }}>…</Text>
    </View>
  );
};
```

No hardcoded color strings anywhere in component code.

---

## Phase 2 — Credential Storage & Settings Screen

**Goal:** user can enter their HA host and token; the app stores them and uses them on restart. The settings screen also exposes the source color picker.

### 2.1 Add `expo-secure-store`

```
npx expo install expo-secure-store
```

### 2.2 `useHassConfig` hook (`src/hooks/useHassConfig.ts`)

Responsibilities:
- Read `HassConfig` from SecureStore on mount
- Expose `config`, `saveConfig(c: HassConfig): Promise<void>`, `isLoaded` (prevents flash of wrong state)
- Key: `hass_config` (JSON-serialised `HassConfig`)

Return type:

```ts
interface HassConfigState {
  config: HassConfig | null;
  isLoaded: boolean;
  saveConfig: (c: HassConfig) => Promise<void>;
}
```

### 2.3 Settings screen (`app/settings.tsx`)

Fields:

| Field | Type | Storage key |
|---|---|---|
| Host / IP | text input | `HassConfig.host` |
| Port | numeric input | `HassConfig.port` (default 8123) |
| Use SSL | toggle | `HassConfig.ssl` |
| Long-lived access token | secure text input | `HassConfig.token` |
| Source color | hex text input + color swatch | `source_color` (AsyncStorage) |

- On save → call `saveConfig` + `setSourceColor`, navigate back to home
- Accessible from home via a gear icon in the header
- No fancy validation — just "host and token are required"
- The source color field updates the theme live (the swatch previews the color as you type a valid hex)

---

## Phase 3 — Connection Provider

**Goal:** a single WebSocket connection shared across the whole app, not re-created per screen.

### 3.1 `HassContext` (`src/context/HassContext.tsx`)

Wrap `useHassConnection` and `useMediaPlayers` in a React context so any component can read `authState`, `players`, and call `send` without prop-drilling.

```ts
interface HassContextValue {
  authState: HassAuthState;
  players: MediaPlayerEntity[];
  isLoading: boolean;
  send: (msg: HassOutboundMessage) => void;
}
```

`HassProvider`:
1. Reads config from `useHassConfig`
2. Only starts a connection once `config` is non-null
3. Passes `send` down for service calls

Mount `<HassProvider>` inside `<ThemeProvider>` in `app/_layout.tsx`.

New folder: `src/context/` with its own `index.ts` barrel. Both `ThemeContext` and `HassContext` live here.

---

## Phase 4 — Home Screen

**Goal:** display all discovered `media_player` entities in a scrollable list.

### 4.1 `MediaCard` component (`src/components/MediaCard/`)

Files:
- `MediaCard.tsx`
- `MediaCard.types.ts` — `MediaCardProps { player: MediaPlayerEntity; onPress: () => void }`
- `index.ts`

Content per card:
- Friendly name (fall back to `entity_id`)
- Current state badge (`playing`, `paused`, `idle`, `off`, …)
- Album art thumbnail (from `attributes.entity_picture`) — placeholder if absent
- Media title + artist (one line each, truncated)
- Inline play/pause button

All colors from `useTheme()`. Card background → `theme.surfaceContainer`. State badge → `theme.secondaryContainer` / `theme.onSecondaryContainer`. Play button → `theme.primary`.

Tapping the card opens the detail view (Phase 5).

### 4.2 Home screen (`app/index.tsx`) refactor

Replace placeholder text with:

```tsx
<FlatList
  data={players}
  keyExtractor={p => p.entity_id}
  renderItem={({ item }) => <MediaCard player={item} onPress={...} />}
  ListEmptyComponent={...}  // "No players found" or loading spinner
/>
```

Background → `theme.background`. Connection state banner → `theme.errorContainer` / `theme.onErrorContainer` when in error state.

---

## Phase 5 — Detail / Now Playing View

**Goal:** full-screen view with album art, track info, and controls.

### 5.1 `PlaybackControls` component (`src/components/PlaybackControls/`)

Props: `player: MediaPlayerEntity; onCommand: (cmd: PlaybackCommand) => void`

```ts
// src/types additions
type PlaybackCommand =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'next' }
  | { type: 'previous' };
```

Buttons: previous, play/pause (toggle), next. Disable previous/next when not supported (check `attributes.supported_features` bitmask). Button tint → `theme.primary`.

### 5.2 `VolumeSlider` component (`src/components/VolumeSlider/`)

Props: `volume: number; onVolumeChange: (v: number) => void`

```
npx expo install @react-native-community/slider
```

Range 0–1, step 0.02. Debounce `onVolumeChange` at ~200 ms. Track active color → `theme.primary`, inactive → `theme.surfaceVariant`.

### 5.3 `ProgressBar` component (`src/components/ProgressBar/`)

Props: `position: number; duration: number` (seconds)

Read-only. Show `formatDuration(position)` / `formatDuration(duration)` labels. Fill → `theme.primary`, track → `theme.surfaceVariant`, label text → `theme.onSurfaceVariant`.

### 5.4 Detail screen (`app/player/[entityId].tsx`)

- `entityId` from route param
- Player from `HassContext`
- Full-bleed album art background (blurred), overlay with track info, `ProgressBar`, `PlaybackControls`, `VolumeSlider`
- Overlay scrim → `theme.scrim` at reduced opacity

---

## Phase 6 — Service Call Wiring

**Goal:** buttons actually control the player.

### 6.1 `useMediaPlayerControls` hook (`src/hooks/useMediaPlayerControls.ts`)

```ts
interface MediaPlayerControls {
  play: () => void;
  pause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setVolume: (level: number) => void;
}

const useMediaPlayerControls = (entityId: string): MediaPlayerControls => { ... };
```

Internally calls `send` from `HassContext`:

| Action | Service |
|---|---|
| play | `media_player.media_play` |
| pause | `media_player.media_pause` |
| next | `media_player.media_next_track` |
| previous | `media_player.media_previous_track` |
| volume | `media_player.volume_set` |

---

## Phase 7 — Error Handling & Reconnect

**Goal:** the app is usable even when HA is temporarily unreachable.

- `useHassConnection` reconnects with exponential back-off (1 s, 2 s, 4 s, 8 s, cap 30 s) on unexpected socket close
- Connection state banner uses `theme.errorContainer` / `theme.onErrorContainer`
- Auth error (`auth_invalid`) clears the stored token and redirects to settings with an "invalid token" message

---

## Deliverables Checklist

```
Phase 1 — Theming
  [ ] @material/material-color-utilities installed
  [ ] AppTheme type (src/types/theme.ts)
  [ ] buildTheme utility (src/utils/buildTheme.ts)
  [ ] ThemeContext + ThemeProvider (src/context/ThemeContext.tsx)
  [ ] useTheme hook (src/hooks/useTheme.ts)
  [ ] ThemeProvider mounted in _layout.tsx

Phase 2 — Config & Settings
  [ ] expo-secure-store installed
  [ ] useHassConfig hook
  [ ] Settings screen with source color field (app/settings.tsx)

Phase 3 — Connection
  [ ] HassContext + HassProvider (src/context/HassContext.tsx)
  [ ] src/context/index.ts barrel
  [ ] _layout.tsx updated (ThemeProvider > HassProvider)

Phase 4 — Home Screen
  [ ] MediaCard component (themed)
  [ ] Home screen refactored

Phase 5 — Detail View
  [ ] PlaybackControls component (themed)
  [ ] VolumeSlider component + @react-native-community/slider
  [ ] ProgressBar component (themed)
  [ ] Detail screen (app/player/[entityId].tsx)

Phase 6 — Service Calls
  [ ] useMediaPlayerControls hook
  [ ] Controls wired to WebSocket

Phase 7 — Resilience
  [ ] Reconnect logic in useHassConnection
  [ ] Auth error → settings redirect
```

---

## What This Explicitly Excludes

- Media browser / source selection
- Group volume sync
- Shared element transitions / fancy animations
- Seek-to-position gesture
- Haptic feedback
- Testing setup
