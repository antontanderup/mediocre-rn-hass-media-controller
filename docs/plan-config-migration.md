# Plan: mediocre-multi-card Config Migration

## Overview

Migrate the configuration schema from [mediocre-hass-media-player-cards](https://github.com/antontanderup/mediocre-hass-media-player-cards) (`MediocreMultiMediaPlayerCard`) into the React Native app, and build an in-app editor UI for managing it.

---

## What we're bringing over

From the Lovelace card, the relevant config for a mobile app is:

| Source field | Mobile equivalent | Notes |
|---|---|---|
| `media_players[]` | `mediaPlayers[]` | Core of the config |
| `entity_id` (per player) | `entityId` | camelCase |
| `name` | `name` | Display name override |
| `speaker_group_entity_id` | `speakerGroupEntityId` | Speaker group support |
| `can_be_grouped` | `canBeGrouped` | Grouping opt-in |
| `ma_entity_id` | `maEntityId` | Music Assistant |
| `ma_favorite_button_entity_id` | `maFavoriteButtonEntityId` | MA favorite |
| `lms_entity_id` | `lmsEntityId` | LMS support |
| `use_art_colors` | `useArtColors` | Global option |
| `disable_player_focus_switching` | `disablePlayerFocusSwitching` | Global option |
| `player_is_active_when` | `playerIsActiveWhen` | Global option |
| `show_volume_step_buttons` | `showVolumeStepButtons` | Global option |

**Not bringing over:** `type`, `size`, `mode`, `height`, `tap_opens_popup`, `grid_options`, `visibility`, `transparent_background_on_home` — these are HASS dashboard concepts with no mobile equivalent.

**Stretch goals (deferred):** `search`, `media_browser`, `custom_buttons` — complex enough to tackle separately.

---

## Storage strategy

| Config | Storage | Reason |
|---|---|---|
| `HassConfig` (host, token, etc.) | `expo-secure-store` | Already there; credentials are sensitive |
| `AppConfig` (players, options) | `AsyncStorage` key `'app_config'` | Non-sensitive; same pattern as theme color |

---

## New types (`src/types/config.ts`)

```typescript
type AppConfig = {
  mediaPlayers: MediaPlayerConfig[];
  options: AppOptions;
};

type MediaPlayerConfig = {
  entityId: string;
  name?: string | null;
  speakerGroupEntityId?: string | null;
  canBeGrouped?: boolean | null;
  maEntityId?: string | null;
  maFavoriteButtonEntityId?: string | null;
  lmsEntityId?: string | null;
};

type AppOptions = {
  useArtColors?: boolean;
  disablePlayerFocusSwitching?: boolean;
  playerIsActiveWhen?: 'playing' | 'playing_or_paused';
  showVolumeStepButtons?: boolean;
};
```

All types go into `src/types/config.ts` and are barrel-exported from `src/types/index.ts`.

---

## New hook: `useAppConfig`

`src/hooks/useAppConfig.ts` — mirrors the `useHassConfig` pattern:

```typescript
type UseAppConfig = {
  config: AppConfig | null;
  isLoaded: boolean;
  saveConfig: (config: AppConfig) => Promise<void>;
};
```

- Loads on mount from `AsyncStorage` key `'app_config'`
- Validates with ArkType before returning (falls back to null on invalid data)
- Barrel-exported from `src/hooks/index.ts`

---

## Editor UI

### `app/settings.tsx` — App Options section

Add a new "App Options" section to the existing settings screen:

- **Use art colors** toggle (`useArtColors`)
- **Player is active when** selector: "Playing" / "Playing or paused" (`playerIsActiveWhen`)
- **Show volume step buttons** toggle (`showVolumeStepButtons`)
- **Disable player focus switching** toggle (`disablePlayerFocusSwitching`)
- **Media Players** → navigation link to `app/media-players.tsx`

### `app/media-players.tsx` — Player list editor

Top-level list of configured players:

- Each row shows player name (or entity ID) with an edit button and delete button
- Drag-to-reorder handle (using a reorder gesture or up/down buttons)
- **Add player** button → picks from live HASS `media_player.*` entities not yet in the list
- **"Add all players"** shortcut — bulk-imports all available `media_player.*` entities (mirrors the Lovelace card's bulk-import feature)
- Empty state prompt when no players are configured

### `app/media-players/[index].tsx` — Per-player config form

TanStack Form + ArkType, same pattern as `app/settings.tsx`:

- **Name** — text input (display name override)
- **Entity ID** — read-only display (set at add time)
- **Can be grouped** — toggle
- **Speaker group entity ID** — text input (optional override for grouping entity)
- **Music Assistant** collapsible section:
  - MA entity ID
  - MA favorite button entity ID
- **LMS** collapsible section:
  - LMS entity ID

---

## Home screen integration

`app/index.tsx` currently shows all `media_player.*` entities from HASS. After migration:

- If `AppConfig.mediaPlayers` is **empty or unconfigured** → show all entities (preserves current behavior; good onboarding default)
- If **configured** → show only configured players in configured order, using the `name` override when set

---

## Implementation order

1. `src/types/config.ts` — define `AppConfig`, `MediaPlayerConfig`, `AppOptions`
2. Update `src/types/index.ts` barrel export
3. `src/hooks/useAppConfig.ts` — load/save via AsyncStorage
4. Update `src/hooks/index.ts` barrel export
5. App Options section in `app/settings.tsx`
6. `app/media-players.tsx` — player list with add / reorder / delete
7. `app/media-players/[index].tsx` — per-player config form
8. Update `app/index.tsx` to filter/order by configured player list
9. Wire navigation (settings → media players → player detail)
10. `yarn typecheck && yarn lint && yarn test`
