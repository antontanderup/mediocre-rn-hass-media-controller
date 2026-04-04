# Essentials Plan

The essentials are the smallest set of changes that produce a working, usable app: configure → connect → see players → control playback. Everything else (polish, animations, media browser) is out of scope here.

---

## Current State

Infrastructure is done. The WebSocket connection, auth flow, entity state derivation, and utilities all work. What's missing is everything the user actually sees and touches.

| Layer | Status |
|---|---|
| Types (`src/types/hass.ts`) | Done |
| `useHassConnection` hook | Done |
| `useMediaPlayers` hook | Done |
| Utilities (`buildWsUrl`, `isMediaPlayerEntity`, `formatDuration`) | Done |
| Secure credential storage | Missing |
| Settings / onboarding screen | Missing |
| Home screen (real media list) | Missing |
| All UI components | Missing |
| Service call wiring | Missing |

---

## Phase 1 — Credential Storage & Settings Screen

**Goal:** user can enter their HA host and token; the app stores them and uses them on restart.

### 1.1 Add `expo-secure-store`

```
npx expo install expo-secure-store
```

### 1.2 `useHassConfig` hook (`src/hooks/useHassConfig.ts`)

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

### 1.3 Settings screen (`app/settings.tsx`)

A simple form with four fields:

| Field | Type | `HassConfig` key |
|---|---|---|
| Host / IP | text input | `host` |
| Port | numeric input | `port` (default 8123) |
| Use SSL | toggle/switch | `ssl` |
| Long-lived access token | secure text input | `token` |

- On save → call `saveConfig`, navigate back to home
- Accessible from home via a gear icon in the header
- No fancy validation — just "host and token are required"

---

## Phase 2 — Connection Provider

**Goal:** a single WebSocket connection shared across the whole app, not re-created per screen.

### 2.1 `HassContext` (`src/context/HassContext.tsx`)

Wrap `useHassConnection` and `useMediaPlayers` in a React context so any component can read `authState`, `players`, and call `send` without prop-drilling.

```ts
interface HassContextValue {
  authState: HassAuthState;
  players: MediaPlayerEntity[];
  isLoading: boolean;
  send: (msg: HassOutboundMessage) => void;
}
```

Add a `HassProvider` that:
1. Reads config from `useHassConfig`
2. Only starts a connection once `config` is non-null
3. Passes `send` down for service calls

Mount `<HassProvider>` in `app/_layout.tsx`.

New folder: `src/context/` with its own `index.ts` barrel.

---

## Phase 3 — Home Screen

**Goal:** display all discovered `media_player` entities in a scrollable list.

### 3.1 `MediaCard` component (`src/components/MediaCard/`)

Files:
- `MediaCard.tsx`
- `MediaCard.types.ts` — `MediaCardProps { player: MediaPlayerEntity; onPress: () => void }`
- `index.ts`

Content to show per card:
- Friendly name (fall back to `entity_id`)
- Current state badge (`playing`, `paused`, `idle`, `off`, …)
- Album art thumbnail (from `attributes.entity_picture`) — show a placeholder if absent
- Media title + artist (one line each, truncated)
- Inline play/pause button

Tapping the card opens the detail view (Phase 4).

### 3.2 Home screen (`app/index.tsx`) refactor

Replace placeholder text with:

```tsx
<FlatList
  data={players}
  keyExtractor={p => p.entity_id}
  renderItem={({ item }) => <MediaCard player={item} onPress={...} />}
  ListEmptyComponent={...}  // "No players found" or loading spinner
/>
```

Connection state banner at the top: show nothing when `authenticated`, a connecting spinner otherwise, an error message with a "retry" tap target on `error`.

---

## Phase 4 — Detail / Now Playing View

**Goal:** full-screen (or tall bottom sheet) with album art, track info, and controls.

### 4.1 `PlaybackControls` component (`src/components/PlaybackControls/`)

Props: `player: MediaPlayerEntity; onCommand: (cmd: PlaybackCommand) => void`

```ts
// src/types/index.ts additions
type PlaybackCommand =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'next' }
  | { type: 'previous' };
```

Buttons: previous, play/pause (toggle), next. Disable previous/next when the player doesn't support them (check `attributes.supported_features` bitmask).

### 4.2 `VolumeSlider` component (`src/components/VolumeSlider/`)

Props: `volume: number; onVolumeChange: (v: number) => void`

Use React Native's `<Slider>` (from `@react-native-community/slider`) or a lightweight custom one. Range 0–1, step 0.02. Debounce the `onVolumeChange` callback at ~200 ms to avoid flooding the WebSocket.

```
npx expo install @react-native-community/slider
```

### 4.3 `ProgressBar` component (`src/components/ProgressBar/`)

Props: `position: number; duration: number` (both in seconds)

Read-only scrub bar. Show `formatDuration(position)` / `formatDuration(duration)` labels either side.

### 4.4 Detail screen (`app/player/[entityId].tsx`)

- Receives `entityId` as a route param
- Reads the matching player from `HassContext`
- Full-bleed album art background (blurred), overlay with:
  - Track title + artist
  - `ProgressBar`
  - `PlaybackControls`
  - `VolumeSlider`

---

## Phase 5 — Service Call Wiring

**Goal:** buttons actually control the player.

### 5.1 `useMediaPlayerControls` hook (`src/hooks/useMediaPlayerControls.ts`)

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

Internally uses `send` from `HassContext` to call:

| Action | Service |
|---|---|
| play | `media_player.media_play` |
| pause | `media_player.media_pause` |
| next | `media_player.media_next_track` |
| previous | `media_player.media_previous_track` |
| volume | `media_player.volume_set` |

Pass the resulting callbacks into `PlaybackControls` and `VolumeSlider`.

---

## Phase 6 — Error Handling & Reconnect

**Goal:** the app is usable even when HA is temporarily unreachable.

- `useHassConnection` should attempt to reconnect with exponential back-off (1 s, 2 s, 4 s, 8 s, cap at 30 s) when the socket closes unexpectedly
- Connection state banner on home screen (Phase 3.2) covers the authenticated / connecting / error states
- Auth error (`auth_invalid`) should clear the stored token and push the user to the settings screen with an "invalid token" message

---

## Deliverables Checklist

```
Phase 1
  [ ] expo-secure-store installed
  [ ] useHassConfig hook
  [ ] Settings screen (app/settings.tsx)

Phase 2
  [ ] src/context/ folder + barrel
  [ ] HassContext + HassProvider
  [ ] _layout.tsx updated

Phase 3
  [ ] MediaCard component
  [ ] Home screen refactored

Phase 4
  [ ] PlaybackControls component
  [ ] VolumeSlider component (@react-native-community/slider installed)
  [ ] ProgressBar component
  [ ] Detail screen (app/player/[entityId].tsx)

Phase 5
  [ ] useMediaPlayerControls hook
  [ ] Controls wired to WebSocket

Phase 6
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
- Theming / dark mode
- Testing setup
