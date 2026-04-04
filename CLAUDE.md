# CLAUDE.md — mediocre-rn-hass-media-controller

## Before editing or creating any component, hook, or utility

**Read [`STYLE_GUIDE.md`](./STYLE_GUIDE.md) first.** It covers exports, path aliases, TypeScript rules, component structure, theming tokens, the `createUseStyles` pattern, and the TanStack Form + ArkType form pattern.

---

## Project Overview

A native mobile app (React Native + Expo) that replicates and extends the multi-card UI from [mediocre-hass-media-player-cards](https://github.com/antontanderup/mediocre-hass-media-player-cards) — a Home Assistant Lovelace card project. The goal is an **app-like** experience: smooth transitions, native gestures, bottom-sheet controls, album art, and multi-room media management — all talking directly to a Home Assistant instance via WebSocket.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React Native 0.81 (New Architecture enabled) |
| Platform | Expo ~54 (Managed Workflow) |
| Routing | Expo Router v4 (file-based, similar to Next.js App Router) |
| Language | TypeScript 5.9 (strict mode) |
| Package manager | Yarn |
| Form state | TanStack Form v1 |
| Validation | ArkType v2 |
| CI | GitHub Actions → Android APK |

---

## Project Structure

```
mediocre-rn-hass-media-controller/
├── app/                    # Expo Router screens (file-based routing)
│   ├── _layout.tsx         # Root layout / navigation shell
│   ├── index.tsx           # Home screen (media player list)
│   └── settings.tsx        # Settings / onboarding screen
├── src/
│   ├── types/              # Shared TypeScript types and interfaces
│   │   └── index.ts        # Barrel export
│   ├── utils/              # Pure helper functions (no side-effects)
│   │   └── index.ts        # Barrel export
│   ├── hooks/              # Custom React hooks
│   │   └── index.ts        # Barrel export
│   ├── context/            # React context providers
│   │   └── index.ts        # Barrel export
│   └── components/         # Reusable UI components
│       └── index.ts        # Barrel export
├── assets/                 # Static assets (icons, images)
├── app.json                # Expo config
├── CLAUDE.md               # This file
└── STYLE_GUIDE.md          # Component & coding conventions
```

Screens live in `app/`. Everything reusable lives under `src/`. Keep the boundary clear.

---

## Home Assistant Integration

The app connects to a user-configured Home Assistant instance via the **WebSocket API** (`ws://<host>/api/websocket`). Key concepts:

- **Authentication** — long-lived access token stored in `expo-secure-store`
- **Entity subscription** — subscribe to `state_changed` events for `media_player.*` entities
- **Service calls** — `media_player.media_play`, `media_player.media_pause`, `media_player.volume_set`, etc.
- **Entity state** — `HassEntity.state` is one of the `MediaPlayerState` union values

Connection logic lives in `src/hooks/useHassConnection.ts` and `src/hooks/useMediaPlayers.ts`. Credential storage is in `src/hooks/useHassConfig.ts`. Raw API types live in `src/types/hass.ts`.

---

## UI Goals (replicating mediocre-hass-media-player-cards)

- **Multi-player list** — scrollable list of all `media_player` entities
- **Now Playing card** — large album art, track info, play/pause/skip controls
- **Volume control** — native slider per player, with group volume support
- **Media browser** — browse sources/playlists (stretch goal)
- **App-like feel** — bottom sheets, shared element transitions, haptic feedback

---

## Key Rules

1. Named exports only — no default exports (screens in `app/` are the exception; Expo Router requires defaults there)
2. Barrel exports from every `src/` subfolder
3. Never use `any` — use `unknown` + type guards
4. All types go in `src/types/`
5. Screens in `app/`, reusables in `src/`
6. Import from barrel paths (`@/utils`, not `@/utils/formatDuration`)
7. All colors from `useTheme()` — no hardcoded color strings in components
8. See `STYLE_GUIDE.md` for the full coding and component conventions
