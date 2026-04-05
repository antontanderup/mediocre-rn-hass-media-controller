# Plan: Media Player Tabs

## Overview

Port the six tabs from the [mediocre-hass-media-player-cards](https://github.com/antontanderup/mediocre-hass-media-player-cards) multi-card UI into the React Native app.

**Licensing note:** Anton Tanderup is the author of both this app and the original Lovelace card project. Logic, data structures, and UX patterns may be copied freely from that codebase.

---

## Current state

The player detail screen already has the tab shell (`app/(tabs)/player.tsx` and `app/(tabs)/grouping.tsx`) with two working tabs:

| Tab | File | Status |
|---|---|---|
| Now Playing | `app/(tabs)/player.tsx` | Done (artwork, controls, progress, volume) |
| Grouping | `app/(tabs)/grouping.tsx` | Done (group/ungroup, per-speaker volume, player switcher) |

The remaining four tabs need to be built.

---

## Tab inventory

### 1. Now Playing (Massive) — `app/(tabs)/player.tsx`
**Status: Done**

Full-screen player with blurred album art background, track info, playback controls, progress bar, and volume slider. Already mirrors the "Massive" tab from the card.

**Minor gaps to fill later:**
- Power toggle (turn player on/off)
- Shuffle / repeat toggles (if supported by the entity)
- Volume step buttons (when `showVolumeStepButtons` option is enabled)
- MA favorite button (when `maFavoriteButtonEntityId` is configured)

---

### 2. Speaker Grouping — `app/(tabs)/grouping.tsx`
**Status: Done**

Matches the `speaker-grouping` tab: join/leave group, per-speaker volume sliders with link-volume toggle, ungrouped speaker chips, and player-focus switcher.

---

### 3. Queue — `app/(tabs)/queue.tsx`
**Status: Not started**

**What it shows:** The current playback queue — all tracks lined up to play.

**Functionality:**
- Scrollable list of queue items (track title, artist, album art thumbnail)
- Highlight the currently playing item
- Tap a track to jump to it (`media_player.play_media` with queue position)
- Swipe-to-remove or remove button on each item
- Clear queue button
- Reorder items (drag-to-reorder or up/down arrows — drag preferred)

**Backend requirements:**
- Music Assistant (`maEntityId` configured) — uses `mass_queue` via the MA WebSocket API
- Lyrion Media Server (`lmsEntityId` configured) — uses the `lyrion_cli` integration
- Show "Queue not available" empty state when neither is configured for the active player

**Key types to add (`src/types/queue.ts`):**
```typescript
type QueueItem = {
  queueItemId: string;
  uri: string;
  name: string;
  artists?: string;
  albumName?: string;
  imageUrl?: string;
  durationSeconds?: number;
};

type PlayerQueue = {
  queueId: string;
  items: QueueItem[];
  currentIndex: number;
};
```

**New hook:** `usePlayerQueue(entityId: string)` in `src/hooks/usePlayerQueue.ts`
- Subscribes to queue state updates via HASS WebSocket
- Returns `{ queue: PlayerQueue | null, jumpTo, removeItem, clearQueue, isLoading }`

**New component:** `QueueItem` in `src/components/QueueItem/`
- Displays track thumbnail, title, artist, duration
- Shows "now playing" indicator for active track
- Accepts `onPress`, `onRemove` callbacks

---

### 4. Search — `app/(tabs)/search.tsx`
**Status: Not started**

**Note:** The original card has Search and Media Browser as separate tabs. In the app they are combined into one tab: the browser is the default view, and the search field activates search mode when tapped.

**What it shows:** A combined search + media browser tab.

**Functionality (browser mode — default):**
- Root shows all available media sources (e.g. Spotify, local library, favorites)
- Drill down through folders / playlists / albums
- Breadcrumb or back-button header showing current path
- Tap a leaf item to play; tap a folder item to drill in
- Pull-to-refresh at root level
- Persistent search bar at the top of the screen

**Functionality (search mode — when search field is focused/has text):**
- Results grouped by media type: Tracks, Albums, Artists, Playlists
- Tap a result to play it immediately or add to queue
- Clear / cancel returns to browser mode

**Backend:**
- Browser: `media_player.browse_media` service (supported by all standard HA media players)
- Search: Music Assistant preferred (`maEntityId`), falls back to HA native `media_player.search_media`
- MA provides richer results for both browse and search when configured
- Show "Not available" empty state when browse_media is unsupported

**New hook:** `useMediaBrowser(entityId: string)` in `src/hooks/useMediaBrowser.ts`
- Returns `{ items, path, browse, goBack, goToRoot, isLoading }`
- `path` is a stack of `{ mediaContentId, mediaContentType, title }` objects
- Calls `media_player.browse_media` on drill-down

**New hook:** `useMediaSearch(entityId: string)` in `src/hooks/useMediaSearch.ts`
- Returns `{ search, results, isSearching, error }`
- Debounces the query (300 ms)
- Detects whether MA or native HA search is available

**Key types to add (`src/types/mediaBrowser.ts`):**
```typescript
type MediaBrowserItem = {
  title: string;
  mediaContentId: string;
  mediaContentType: string;
  mediaClass: string;   // 'directory' | 'track' | 'album' | 'artist' | 'playlist' | ...
  canPlay: boolean;
  canExpand: boolean;
  thumbnail?: string;
  childrenMediaClass?: string;
};
```

**New component:** `MediaBrowserItem` in `src/components/MediaBrowserItem/`
- Thumbnail (or icon fallback), title, subtitle
- Chevron for expandable items; play button for playable items

**New component:** `SearchResultItem` in `src/components/SearchResultItem/`
- Thumbnail, title, subtitle (artist/album), media type icon
- Play button + add-to-queue button

### 5. Media Browser
Merged into the Search tab above.

---

### 6. Custom Buttons — `app/(tabs)/customButtons.tsx`
**Status: Not started**

**What it shows:** A grid of user-configured action buttons for a player.

**Functionality:**
- Renders buttons defined in `MediaPlayerConfig.customButtons[]` (new config field)
- Each button: icon, label, and a HASS service call or action
- Supports conditional visibility (button shows only when entity has a certain state)
- Tapping fires the configured service call via HASS WebSocket

**New config fields** (extend `MediaPlayerConfig` in `src/types/config.ts`):
```typescript
type CustomButton = {
  id: string;
  label: string;
  icon: string;                // remix-icon name
  serviceCall: {
    domain: string;
    service: string;
    data?: Record<string, unknown>;
  };
  showWhen?: {
    entityId: string;
    state: string;
  };
};

// Add to MediaPlayerConfig:
customButtons?: CustomButton[];
```

**New component:** `CustomButtonItem` in `src/components/CustomButtonItem/`
- Icon + label, themed with `theme.primaryContainer` / `theme.onPrimaryContainer`
- Loading state while service call is in-flight
- Error state (brief shake animation or error color) on failure

**Settings integration:** Custom buttons are added/edited per player in `app/media-players/[index].tsx` — add a "Custom Buttons" section with add/edit/delete/reorder.

---

## Tab navigation architecture

The existing `app/(tabs)/_layout.tsx` uses Expo Router's tab navigator. Currently three tabs are visible. After this work the tabs for a selected player will be:

```
Players (index) | Now Playing (player) | Grouping (grouping)
```

The full set after implementation:

```
Players | Now Playing | Queue | Search+Browse | Grouping | Custom Buttons
```

**Decisions:**
- Search and Media Browser are combined into one tab (separate in the original card, merged here for a cleaner mobile UX)
- Tabs only appear when supported: Queue hidden if no MA/LMS configured, Custom Buttons hidden if no buttons configured for the active player

---

## New files summary

| File | Purpose |
|---|---|
| `app/(tabs)/queue.tsx` | Queue tab screen |
| `app/(tabs)/search.tsx` | Combined search + media browser tab screen |
| `app/(tabs)/customButtons.tsx` | Custom buttons tab screen |
| `src/hooks/usePlayerQueue.ts` | Queue data + actions |
| `src/hooks/useMediaSearch.ts` | Search query + results |
| `src/hooks/useMediaBrowser.ts` | Browser navigation + items |
| `src/types/queue.ts` | `QueueItem`, `PlayerQueue` |
| `src/types/mediaBrowser.ts` | `MediaBrowserItem` |
| `src/components/QueueItem/` | Single queue item row |
| `src/components/SearchResultItem/` | Single search result row |
| `src/components/MediaBrowserItem/` | Single browser item row |
| `src/components/CustomButtonItem/` | Single custom button tile |

All new types barrel-exported from `src/types/index.ts`.  
All new hooks barrel-exported from `src/hooks/index.ts`.  
All new components barrel-exported from `src/components/index.ts`.

---

## Implementation order

1. **Queue tab** — highest value, self-contained, clear HASS API surface
   - `src/types/queue.ts`
   - `src/hooks/usePlayerQueue.ts`
   - `src/components/QueueItem/`
   - `app/(tabs)/queue.tsx`
   - Wire into tab layout; hide when not supported

2. **Search + Media Browser tab** (combined, browser default / search on focus)
   - `src/types/mediaBrowser.ts`
   - `src/hooks/useMediaBrowser.ts`
   - `src/hooks/useMediaSearch.ts`
   - `src/components/MediaBrowserItem/`
   - `src/components/SearchResultItem/`
   - `app/(tabs)/search.tsx`

3. **Custom Buttons tab**
   - Extend `CustomButton` type into `src/types/config.ts`
   - `src/components/CustomButtonItem/`
   - `app/(tabs)/customButtons.tsx`
   - Settings UI in `app/media-players/[index].tsx`

4. **Now Playing enhancements** (power, shuffle, repeat, step buttons, MA favorite)
   - All in `app/(tabs)/player.tsx` and `src/hooks/useMediaPlayerControls.ts`

5. **Pre-PR checks**
   ```
   yarn typecheck && yarn lint && yarn test
   ```
