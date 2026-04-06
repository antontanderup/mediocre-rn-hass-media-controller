# Plan: Search & Media Browse Tab

## Overview

Implement `app/(tabs)/search.tsx` — the combined Search + Media Browser tab. The screen stub already exists but shows a "coming soon" placeholder.

**Design decision:** The original Lovelace card has Search and Media Browser as two separate tabs. In the app they are merged into one tab: the browser is the default view, and tapping the persistent search bar activates search mode.

**Source reference:** Logic and data structures are ported from [`mediocre-hass-media-player-cards`](https://github.com/antontanderup/mediocre-hass-media-player-cards), specifically `src/components/HaSearch/`, `src/components/MaSearch/`, and `src/components/MediaSearch/`.

---

## Current state

| File | Status |
|---|---|
| `app/(tabs)/search.tsx` | Stub — renders "coming soon" text |
| `src/types/mediaBrowser.ts` | Does not exist |
| `src/hooks/useMediaBrowser.ts` | Does not exist |
| `src/hooks/useHaSearch.ts` | Does not exist |
| `src/hooks/useMaSearch.ts` | Does not exist |
| `src/components/MediaBrowserItem/` | Does not exist |
| `src/components/SearchResultItem/` | Does not exist |

---

## Backend API surface

### Browse media — `media_player.browse_media`

WebSocket service call with `return_response: true`.

```json
{
  "type": "call_service",
  "domain": "media_player",
  "service": "browse_media",
  "service_data": {
    "entity_id": "<entityId>",
    "media_content_id": "",
    "media_content_type": "favorites"
  },
  "return_response": true
}
```

Response shape:
```json
{
  "response": {
    "<entityId>": {
      "title": "Spotify",
      "media_class": "directory",
      "media_content_id": "spotify:",
      "media_content_type": "library",
      "can_play": false,
      "can_expand": true,
      "thumbnail": null,
      "children_media_class": "playlist",
      "children": [ ... ]
    }
  }
}
```

The `children` array contains `HaMediaItem` objects (see types below). For the favorites empty state, use `media_content_type: "favorites"` and filter results to `can_play === true` only.

### HA Search — `media_player.search_media`

WebSocket service call with `return_response: true`. Not supported by all players — catch errors and set `isAvailable = false`.

```json
{
  "type": "call_service",
  "domain": "media_player",
  "service": "search_media",
  "service_data": {
    "search_query": "<query>",
    "entity_id": "<entityId>",
    "media_content_type": "<filter>"
  },
  "return_response": true
}
```

- `media_content_type` is omitted when filter is `"all"`.
- Response: `{ response: { "<entityId>": { result: HaMediaItem[] } } }`
- Results are a **flat list** — all media types mixed together.

### MA Search — `music_assistant` service

MA search is a first-class backend, not a stub. It uses a different service and richer result structure.

**Step 1:** Fetch the MA config entry ID (once, cache it):
```json
{
  "type": "config/config_entries/entry"
}
```
Filter the response for `domain === "music_assistant"` and `state === "loaded"`. Extract `entry_id`.

**Step 2:** Call MA search:
```json
{
  "type": "call_service",
  "domain": "music_assistant",
  "service": "search",
  "service_data": {
    "name": "<query>",
    "config_entry_id": "<entry_id>",
    "media_type": "<filter>"
  },
  "return_response": true
}
```

- `media_type` is omitted when filter is `"all"`.
- MA results are **organised by type** (not a flat list):
  ```json
  {
    "artists": [...],
    "albums": [...],
    "tracks": [...],
    "playlists": [...],
    "radio": [...],
    "audiobooks": [...],
    "podcasts": [...]
  }
  ```
- Play via `music_assistant.play_media` (not `media_player.play_media`).

---

## New types — `src/types/mediaBrowser.ts`

```typescript
// ─── Shared ──────────────────────────────────────────────────────────────────

/** A single item returned by browse_media or search_media */
export type HaMediaItem = {
  media_class: string;
  media_content_id: string;
  media_content_type: string;
  title: string;
  can_play: boolean;
  can_expand: boolean;
  can_search?: boolean;
  thumbnail?: string;
};

export type MediaBrowserNode = {
  title: string;
  mediaContentId: string;
  mediaContentType: string;
  mediaClass: string;
  canPlay: boolean;
  canExpand: boolean;
  thumbnail?: string;
  childrenMediaClass?: string;
};

export type MediaBrowserPath = {
  mediaContentId: string;
  mediaContentType: string;
  title: string;
};

// ─── HA Search ───────────────────────────────────────────────────────────────

export type HaFilterType = 'all' | 'tracks' | 'albums' | 'artists' | 'playlists' | string;

export type HaEnqueueMode = 'play' | 'replace' | 'next' | 'add';

export type HaFilterConfig = {
  type: HaFilterType;
  name?: string;
  icon?: string;
};

// ─── MA Search ───────────────────────────────────────────────────────────────

export type MaMediaType =
  | 'artist'
  | 'album'
  | 'track'
  | 'playlist'
  | 'radio'
  | 'audiobook'
  | 'podcast';

export type MaFilterType = MaMediaType | 'all';

export type MaEnqueueMode = 'play' | 'replace' | 'next' | 'replace_next' | 'add';

export type MaMediaItem = {
  media_type: MaMediaType;
  uri: string;
  name: string;
  version?: string;
  image?: string;
  // enriched fields on tracks/albums:
  artist?: string;
  album?: string;
};

export type MaSearchResults = Partial<Record<`${MaMediaType}s`, MaMediaItem[]>>;
```

Barrel-export from `src/types/index.ts`.

---

## Config changes — `src/types/config.ts`

Add a `search` field to `MediaPlayerConfig` to support multiple HA search providers (mirrors the original card's `search` config option):

```typescript
export type SearchProviderConfig = {
  entity_id: string;
  name?: string;
  media_types?: HaFilterConfig[];
};

// Add to MediaPlayerConfig:
search?: SearchProviderConfig[];
```

When `search` is not set, the player's own `entityId` is used as the single HA search provider. When `maEntityId` is set, Music Assistant is always added as an additional provider option.

---

## New hook — `useMediaBrowser`

**File:** `src/hooks/useMediaBrowser.ts`

```typescript
export type UseMediaBrowserResult = {
  items: MediaBrowserNode[];
  path: MediaBrowserPath[];   // navigation stack; empty = root
  isLoading: boolean;
  error: string | null;
  isAvailable: boolean;       // false when browse_media unsupported
  browse: (item: MediaBrowserNode) => void;
  goBack: () => void;
  goToRoot: () => void;
  refresh: () => void;
};

export const useMediaBrowser = (entityId: string): UseMediaBrowserResult => { ... };
```

**Implementation notes:**
- Use `useHassMessagePromise` for the WebSocket call (already exists in `src/hooks/`).
- Build the message object from the current `path` tail; `path` changes trigger a new `useHassMessagePromise` call via memo dependency.
- `browse(item)` pushes onto `path` state.
- `goBack()` pops the tail. `goToRoot()` sets `path = []`.
- `refresh()` calls `refetch()` from `useHassMessagePromise`.
- `isAvailable`: starts `true`; set `false` on first service error response.
- Response access: `data.response?.[entityId]?.children ?? []` — map raw `HaMediaItem` fields to `MediaBrowserNode` camelCase shape.

---

## New hook — `useHaSearch`

**File:** `src/hooks/useHaSearch.ts`

```typescript
export type UseHaSearchResult = {
  query: string;
  setQuery: (q: string) => void;
  filter: HaFilterType;
  setFilter: (f: HaFilterType) => void;
  results: HaMediaItem[];
  favorites: HaMediaItem[];     // shown when query is empty
  isSearching: boolean;
  isFetchingFavorites: boolean;
  error: string | null;
  isAvailable: boolean;
  playItem: (item: HaMediaItem, enqueue: HaEnqueueMode) => Promise<void>;
  clear: () => void;
};

export const useHaSearch = (
  entityId: string,
  filterConfig?: HaFilterConfig[],
  showFavorites?: boolean,
): UseHaSearchResult => { ... };
```

**Implementation notes:**
- Debounce `query` by **600 ms** before building the message object passed to `useHassMessagePromise`.
- Only fire when `query.trim().length >= 2`; use `enabled: false` on `useHassMessagePromise` otherwise.
- Omit `media_content_type` from service data when `filter === 'all'`.
- Response: `data?.result ?? []` (the hook receives `data` typed as `{ result: HaMediaItem[] }`).
- Race condition guard: `useHassMessagePromise` already handles stale results via `latestMessageKeyRef` — no extra ref needed.
- **Favorites** (empty state when `showFavorites` is true): use a separate `useHassMessagePromise` call with `media_content_type: "favorites"`, `enabled: showFavorites && query === ''`. Filter `children` to `can_play === true` only.
- `playItem`: call `callService('media_player', 'play_media', { entity_id: targetEntity, media_content_type, media_content_id, enqueue })` from `useHassContext`.
- `isAvailable`: `false` after any error response.

---

## New hook — `useMaSearch`

**File:** `src/hooks/useMaSearch.ts`

```typescript
export type UseMaSearchResult = {
  query: string;
  setQuery: (q: string) => void;
  filter: MaFilterType;
  setFilter: (f: MaFilterType) => void;
  results: MaSearchResults;
  isSearching: boolean;
  error: string | null;
  playItem: (item: MaMediaItem, enqueue: MaEnqueueMode) => Promise<void>;
  clear: () => void;
};

export const useMaSearch = (maEntityId: string): UseMaSearchResult => { ... };
```

**Implementation notes:**
- **Config entry fetch:** Use `useHassMessagePromise` with `{ type: 'config/config_entries/entry' }` (staleTime: Infinity — it never changes at runtime). Filter the result array for `domain === 'music_assistant'` and `state === 'loaded'`; extract `entry_id`. If not found, return empty results with `error = 'Music Assistant not configured'`.
- Debounce `query` by **600 ms**.
- Build search message only when `entry_id` is known and `query.trim().length >= 2`.
- Response is `MaSearchResults` — an object with optional keys `artists`, `albums`, `tracks`, `playlists`, `radio`, `audiobooks`, `podcasts`, each an array of `MaMediaItem`.
- `playItem`: call `callService('music_assistant', 'play_media', { media_id: item.uri, enqueue_mode: enqueue })`.
- No `isAvailable` needed — MA is known-available when `maEntityId` is configured and the config entry is found.

Barrel-export all three hooks from `src/hooks/index.ts`.

---

## New hook — `useSearchProvider`

**File:** `src/hooks/useSearchProvider.ts`

Manages the list of available search providers and which one is selected. Mirrors `useSearchProviderMenu` from the original card.

```typescript
export type SearchProvider =
  | { type: 'ha'; entityId: string; name: string; filterConfig?: HaFilterConfig[] }
  | { type: 'ma'; maEntityId: string; name: 'Music Assistant' };

export type UseSearchProviderResult = {
  providers: SearchProvider[];
  selected: SearchProvider | null;
  select: (provider: SearchProvider) => void;
};

export const useSearchProvider = (entityId: string): UseSearchProviderResult => { ... };
```

**Implementation notes:**
- Reads `playerConfig.search` (array of `SearchProviderConfig`) from `useAppConfig`.
- If `search` is empty/undefined, falls back to `[{ entity_id: entityId }]`.
- If `playerConfig.maEntityId` is set, appends a MA provider entry.
- Default selection is the first provider.
- Selection is local state (not persisted).

Barrel-export from `src/hooks/index.ts`.

---

## New component — `MediaBrowserItem`

**File:** `src/components/MediaBrowserItem/`

```
MediaBrowserItem/
  MediaBrowserItem.tsx
  MediaBrowserItem.types.ts
  index.ts
```

**Props:**
```typescript
export type MediaBrowserItemProps = {
  item: MediaBrowserNode;
  onPress: () => void;       // drill-in or play
  onPlay?: () => void;       // only when item.canExpand && item.canPlay
};
```

**Layout** (follows `QueueItem` pattern):
```
[ thumbnail / icon ]  [ title             ]  [ play? ]  [ chevron OR play ]
                       [ mediaClass label ]
```

- 48 × 48 thumbnail, 6 px border radius; icon fallback by `mediaClass`:
  - `'track'` / `'music'` → `music-2-line`
  - `'album'` → `album-line`
  - `'artist'` → `user-3-line`
  - `'playlist'` → `play-list-2-line`
  - `'directory'` / default → `folder-music-line`
- `canExpand` → right side shows `arrow-right-s-line` chevron; `onPress` drills in.
- `canPlay && !canExpand` → right side shows `play-circle-line`; `onPress` plays.
- `canPlay && canExpand` → right side shows chevron; optional `play-circle-line` appears left of chevron when `onPlay` prop is provided.
- All colors from `useTheme()`.

---

## New component — `SearchResultItem`

**File:** `src/components/SearchResultItem/`

```
SearchResultItem/
  SearchResultItem.tsx
  SearchResultItem.types.ts
  index.ts
```

**Props:**
```typescript
export type SearchResultItemProps = {
  item: HaMediaItem | MaMediaItem;
  onPlay: () => void;
  onEnqueue?: () => void;   // add to queue; shown only when provided
};
```

**Layout:**
```
[ thumbnail / icon ]  [ title           ]  [ + ]  [ ▶ ]
                       [ artist • album ]
```

- Same thumbnail/icon fallback logic as `MediaBrowserItem`.
- `onEnqueue` button: `add-line` icon (hidden when not provided).
- `onPlay` button: `play-circle-line` icon.
- All colors from `useTheme()`.

Barrel-export both components from `src/components/index.ts`.

---

## Screen — `app/(tabs)/search.tsx`

### State machine

```
query === '' && bar not focused  →  BROWSER MODE (or favorites if available)
bar focused or query !== ''      →  SEARCH MODE
```

### Layout skeleton

```
┌──────────────────────────────────────────┐
│  [ Search bar                          ] │  ← always visible
│  [ Provider picker chip (if > 1)       ] │  ← hidden when only 1 provider
├──────────────────────────────────────────┤
│  BROWSER MODE:                           │
│    Breadcrumb back button (hidden @ root)│
│    FlatList<MediaBrowserItem>            │
│    Pull-to-refresh at root               │
│                                          │
│  SEARCH MODE:                            │
│    Filter chips row (per provider type)  │
│    FlatList<SearchResultItem>            │
│    Section headers by media type (MA)    │
│                                          │
│  [loading spinner]                       │
│  [empty: favorites list]                 │
│  [empty: "No results"]                   │
│  [empty: "Search not available"]         │
│  [empty: "Browse not available"]         │
└──────────────────────────────────────────┘
```

### Browser mode details

- On mount, `useMediaBrowser` fetches the root immediately.
- Breadcrumb: `← {path[path.length - 1].title}` back button shown when `path.length > 0`. Tapping calls `goBack()`.
- `RefreshControl` wired only at root (`path.length === 0`).
- Item press logic:
  - `canExpand && !canPlay` → `browse(item)`
  - `canPlay && !canExpand` → `playItem`
  - Both → `onPress` = `browse`, `onPlay` = `playItem`

### Search mode details

- Switching providers resets `query`, `filter`, and `results`.
- **HA provider selected:**
  - Filter chips rendered from `filterConfig` (default: Artists, Albums, Tracks, Playlists).
  - Results are a flat `FlatList<SearchResultItem>`.
  - When `query === ''`: show favorites (from `useHaSearch`'s `favorites` field) if available.
  - Enqueue mode selector: icon button opening a bottom sheet with "Play now", "Play next", "Add to queue", "Replace queue" options.
- **MA provider selected:**
  - Filter chips: All, Artists, Albums, Tracks, Playlists, Radio, Audiobooks, Podcasts.
  - Results are sectioned by media type — use `SectionList` with section headers showing the type label.
  - MA enqueue adds "Play next (replace)" option.
- Cancel / clear: `clear()` + blur → back to browser mode.

### `entityId` wiring

`entityId` from `useLocalSearchParams<{ entityId?: string }>()` — same pattern as other tabs.

---

## Filter chip constants

Define in `src/utils/searchFilters.ts` (or inline in the screen):

```typescript
export const HA_FILTER_DEFAULTS: HaFilterConfig[] = [
  { type: 'all',      name: 'All',      icon: 'infinity-line' },
  { type: 'artists',  name: 'Artists',  icon: 'user-3-line' },
  { type: 'albums',   name: 'Albums',   icon: 'album-line' },
  { type: 'tracks',   name: 'Tracks',   icon: 'music-2-line' },
  { type: 'playlists',name: 'Playlists',icon: 'play-list-2-line' },
];

export const MA_FILTER_DEFAULTS: MaFilterConfig[] = [
  { type: 'all',       name: 'All' },
  { type: 'artist',    name: 'Artists' },
  { type: 'album',     name: 'Albums' },
  { type: 'track',     name: 'Tracks' },
  { type: 'playlist',  name: 'Playlists' },
  { type: 'radio',     name: 'Radio' },
  { type: 'audiobook', name: 'Audiobooks' },
  { type: 'podcast',   name: 'Podcasts' },
];
```

Icons use remix-icon names (the `Icon` component already supports these).

---

## Implementation order

1. **Types** — `src/types/mediaBrowser.ts`; add `SearchProviderConfig` to `src/types/config.ts`; barrel-export
2. **`useMediaBrowser` hook** — navigation stack + `browse_media` via `useHassMessagePromise`
3. **`useHaSearch` hook** — debounced HA search + favorites fallback
4. **`useMaSearch` hook** — config entry fetch + MA search + sectioned results
5. **`useSearchProvider` hook** — provider list + selection state
6. **`MediaBrowserItem` component** — thumbnail, icon fallback, chevron/play
7. **`SearchResultItem` component** — thumbnail, icon fallback, play + enqueue
8. **`app/(tabs)/search.tsx`** — browser mode first (wires `useMediaBrowser` + `MediaBrowserItem`)
9. **Search mode — HA** — search bar focus, `useHaSearch`, filter chips, flat results list, favorites empty state
10. **Search mode — MA** — `useMaSearch`, sectioned results, expanded filter chips
11. **Provider picker** — `useSearchProvider`, chip UI (only shown when > 1 provider)
12. **Polish** — breadcrumbs, pull-to-refresh, all empty/error states, enqueue mode picker
13. **Pre-commit checks** — `yarn typecheck && yarn lint && yarn test`

---

## New files summary

| File | Purpose |
|---|---|
| `src/types/mediaBrowser.ts` | All search + browser types |
| `src/hooks/useMediaBrowser.ts` | Browser navigation + `browse_media` |
| `src/hooks/useHaSearch.ts` | HA `search_media` + favorites |
| `src/hooks/useMaSearch.ts` | MA config entry fetch + MA search |
| `src/hooks/useSearchProvider.ts` | Provider list + selection |
| `src/components/MediaBrowserItem/MediaBrowserItem.tsx` | Single browser row |
| `src/components/MediaBrowserItem/MediaBrowserItem.types.ts` | Props type |
| `src/components/MediaBrowserItem/index.ts` | Barrel |
| `src/components/SearchResultItem/SearchResultItem.tsx` | Single search result row |
| `src/components/SearchResultItem/SearchResultItem.types.ts` | Props type |
| `src/components/SearchResultItem/index.ts` | Barrel |

`app/(tabs)/search.tsx` and `src/types/config.ts` are modified (not created).

---

## Key differences from naive plan

| Topic | Original (naive) plan | Corrected (this plan) |
|---|---|---|
| Search backends | MA first, HA fallback | Two separate hooks: `useHaSearch` + `useMaSearch`, user picks provider |
| MA search | `TODO` stub | Fully specified: config entry fetch + `music_assistant.search` service |
| MA results | Flat list | Sectioned by type (`MaSearchResults`) |
| MA play | `media_player.play_media` | `music_assistant.play_media` with `media_id` + `enqueue_mode` |
| Debounce | 300 ms | 600 ms (matches original card) |
| Empty state | "No results" text | Favorites from `browse_media?media_content_type=favorites` |
| Filter chips | Not mentioned | Required for both backends; MA has 8 types including radio/audiobook/podcast |
| Enqueue modes | Not mentioned | HA: play/replace/next/add; MA adds replace_next |
| `search` config | Not mentioned | `SearchProviderConfig[]` added to `MediaPlayerConfig` |
