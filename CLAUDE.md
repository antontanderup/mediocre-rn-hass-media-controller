# CLAUDE.md — mediocre-rn-hass-media-controller

## Project Overview

A native mobile app (React Native + Expo) that replicates and extends the multi-card UI from [mediocre-hass-media-player-cards](https://github.com/antontanderup/mediocre-hass-media-player-cards) — a Home Assistant Lovelace card project. The goal is an **app-like** experience: smooth transitions, native gestures, bottom-sheet controls, album art, and multi-room media management — all talking directly to a Home Assistant instance via WebSocket.

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React Native 0.81 (New Architecture enabled) |
| Platform | Expo ~54 (Managed Workflow) |
| Routing | Expo Router v4 (file-based, similar to Next.js App Router) |
| Language | TypeScript 5.9 (strict mode) |
| Package manager | Yarn |
| CI | GitHub Actions → Android APK |

## Project Structure

```
mediocre-rn-hass-media-controller/
├── app/                    # Expo Router screens (file-based routing)
│   ├── _layout.tsx         # Root layout / navigation shell
│   └── index.tsx           # Home screen (media player list)
├── src/
│   ├── types/              # Shared TypeScript types and interfaces
│   │   └── index.ts        # Barrel export
│   ├── utils/              # Pure helper functions (no side-effects)
│   │   └── index.ts        # Barrel export
│   ├── hooks/              # Custom React hooks
│   │   └── index.ts        # Barrel export
│   └── components/         # Reusable UI components
│       └── index.ts        # Barrel export
├── assets/                 # Static assets (icons, images)
├── app.json                # Expo config
└── CLAUDE.md               # This file
```

Screens live in `app/`. Everything reusable lives under `src/`. Keep the boundary clear.

## Coding Conventions

### Exports — always named, always barrel-exported

```ts
// GOOD — named export
export const formatDuration = (seconds: number): string => { ... };

// BAD — default export
export default function formatDuration() { ... }
```

Every folder under `src/` has an `index.ts` that re-exports everything from that folder:

```ts
// src/utils/index.ts
export { formatDuration } from './formatDuration';
export { formatEntityId } from './formatEntityId';
```

Consumers import from the barrel, never from deep paths:

```ts
// GOOD
import { formatDuration } from '@/utils';

// BAD
import { formatDuration } from '@/utils/formatDuration';
```

### TypeScript — no `any`, ever

- Prefer `unknown` over `any` when the type is genuinely unknown, then narrow with guards.
- Use `satisfies` to validate literal objects against a type without widening.
- Define explicit return types on all hooks and non-trivial functions.
- Shared data-shape types go in `src/types/`, not co-located with components.

```ts
// GOOD
const parseEntity = (raw: unknown): HassEntity => { ... };

// BAD
const parseEntity = (raw: any) => { ... };
```

### Component structure

Each component gets its own folder with an `index.ts` barrel:

```
src/components/
└── MediaCard/
    ├── MediaCard.tsx       # Component implementation
    ├── MediaCard.types.ts  # Props type (re-exported via barrel)
    └── index.ts            # export { MediaCard } from './MediaCard';
```

Props interfaces are always named `<ComponentName>Props`:

```ts
export interface MediaCardProps {
  entityId: string;
  onPress: () => void;
}
```

### Hooks

Hooks live in `src/hooks/`. One hook per file, named `use<Thing>.ts`.

```ts
// src/hooks/useHassConnection.ts
export const useHassConnection = (): HassConnectionState => { ... };
```

### Path aliases

`@/` maps to `src/` (configured in tsconfig). Use it everywhere:

```ts
import { HassEntity } from '@/types';
import { formatDuration } from '@/utils';
import { useMediaPlayers } from '@/hooks';
import { MediaCard } from '@/components';
```

## Home Assistant Integration

The app connects to a user-configured Home Assistant instance via the **WebSocket API** (`ws://<host>/api/websocket`). Key concepts:

- **Authentication** — long-lived access token stored securely on device
- **Entity subscription** — subscribe to `state_changed` events for `media_player.*` entities
- **Service calls** — `media_player.play`, `media_player.pause`, `media_player.volume_set`, etc.
- **Entity state** — `HassEntity.state` is one of the `MediaPlayerState` union values

Connection logic lives in `src/hooks/useHassConnection.ts` and `src/hooks/useMediaPlayers.ts`. Raw API types live in `src/types/hass.ts`.

## UI Goals (replicating mediocre-hass-media-player-cards)

- **Multi-player list** — scrollable list of all `media_player` entities, similar to the multi-card
- **Now Playing card** — large album art, track info, play/pause/skip controls
- **Volume control** — native slider per player, with group volume support
- **Media browser** — browse sources/playlists (stretch goal)
- **App-like feel** — bottom sheets, shared element transitions, haptic feedback

## Key Rules (summary)

1. Named exports only — no default exports
2. Barrel exports from every `src/` subfolder
3. Never use `any` — use `unknown` + type guards
4. All types go in `src/types/`
5. Screens in `app/`, reusables in `src/`
6. Import from barrel paths (`@/utils`, not `@/utils/formatDuration`)
