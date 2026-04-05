# Plan: Search & Media Browse Tab

## Overview

Implement `app/(tabs)/search.tsx` — the combined Search + Media Browser tab. The screen stub already exists but shows a "coming soon" placeholder.

**Design decision:** The original Lovelace card has Search and Media Browser as two separate tabs. In the app they are merged into one tab: the browser is the default view, and tapping the persistent search bar activates search mode. This gives a cleaner mobile UX without hiding either capability.

---

## Current state

| File | Status |
|---|---|
| `app/(tabs)/search.tsx` | Stub — renders "coming soon" text |
| `src/types/mediaBrowser.ts` | Does not exist |
| `src/hooks/useMediaBrowser.ts` | Does not exist |
| `src/hooks/useMediaSearch.ts` | Does not exist |
| `src/components/MediaBrowserItem/` | Does not exist |
| `src/components/SearchResultItem/` | Does not exist |

---

## Backend API surface

### Browse media — `media_player.browse_media`

Called as a HASS service call via WebSocket. Returns a tree of `BrowseMedia` nodes.

```
service: media_player.browse_media
target.entity_id: <entityId>
data:
  media_content_id: <string>   # empty string for root
  media_content_type: <string> # e.g. "library", "album", "artist", "playlist"
```

Response shape (from HA WebSocket):

```json
{
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
```

### Search media

Two backends, checked in priority order:

1. **Music Assistant** (`maEntityId` configured + MA features available) — uses the MA WebSocket API via the existing `useHassMessagePromise` plumbing.
2. **Native HA** — `media_player.search_media` service (added in HA 2024.x; not all players support it).

For the initial implementation, focus on native HA search. MA-specific search can be added later as an enhancement.

```
service: media_player.search_media
target.entity_id: <entityId>
data:
  query: <string>
  media_content_type: "music"   # optional filter
```

---

## New types — `src/types/mediaBrowser.ts`

```typescript
export type MediaBrowserItem = {
  title: string;
  mediaContentId: string;
  mediaContentType: string;
  mediaClass: string; // 'directory' | 'track' | 'album' | 'artist' | 'playlist' | 'music' | ...
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

export type SearchResultItem = {
  title: string;
  mediaContentId: string;
  mediaContentType: string;
  mediaClass: string;
  thumbnail?: string;
  artist?: string;
  album?: string;
};
```

Barrel-export both from `src/types/index.ts`.

---

## New hook — `useMediaBrowser`

**File:** `src/hooks/useMediaBrowser.ts`

```typescript
export type UseMediaBrowserResult = {
  items: MediaBrowserItem[];
  path: MediaBrowserPath[];  // navigation stack; empty = root
  isLoading: boolean;
  error: string | null;
  isAvailable: boolean;      // false when browse_media unsupported
  browse: (item: MediaBrowserItem) => Promise<void>;
  goBack: () => void;
  goToRoot: () => void;
  refresh: () => void;
};

export const useMediaBrowser = (entityId: string): UseMediaBrowserResult => { ... };
```

**Implementation notes:**
- On mount (and on `entityId` change) call `browse_media` with empty `media_content_id` to load the root.
- `browse(item)` pushes `item` onto `path` and calls `browse_media` with the item's ids.
- `goBack()` pops the top of `path` and re-fetches the parent; if `path` becomes empty it re-fetches root.
- `goToRoot()` clears `path` and re-fetches root.
- `refresh()` re-fetches the current level without changing `path`.
- Detect `isAvailable` from the HASS service call response: if HA returns an error indicating the service is unsupported, set `isAvailable = false`.
- Use `useHassMessagePromise` (already exists in `src/hooks/`) for the WebSocket call.

---

## New hook — `useMediaSearch`

**File:** `src/hooks/useMediaSearch.ts`

```typescript
export type UseMediaSearchResult = {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResultItem[];
  isSearching: boolean;
  error: string | null;
  isAvailable: boolean;  // false when search_media unsupported for this player
  clear: () => void;
};

export const useMediaSearch = (entityId: string): UseMediaSearchResult => { ... };
```

**Implementation notes:**
- Debounce `query` by 300 ms before firing the service call.
- Only fire when `query.trim().length >= 2`.
- `isAvailable` starts as `true`; flip to `false` if HA returns an error indicating unsupported service — and keep it `false` for the session so we don't retry.
- `clear()` resets `query` to `''` and `results` to `[]`.
- MA-specific search path: if `playerConfig.maEntityId` is set and MA features are available (`getHasMassFeatures`), use the MA search API instead. Leave this as a `TODO` comment stub for now; wire in native HA first.

Barrel-export both hooks from `src/hooks/index.ts`.

---

## New component — `MediaBrowserItem`

**File:** `src/components/MediaBrowserItem/`

```
MediaBrowserItem/
  MediaBrowserItem.tsx
  MediaBrowserItem.types.ts
  index.ts
```

**Props (`MediaBrowserItem.types.ts`):**

```typescript
export type MediaBrowserItemProps = {
  item: MediaBrowserItem;
  onPress: () => void;
};
```

**Visual layout** (follow the `QueueItem` component as the reference pattern):

```
[ thumbnail / icon ]  [ title              ]  [ chevron OR play ]
                       [ subtitle (class)  ]
```

- 48 × 48 thumbnail with 6 px border radius; falls back to a `remix-icon` based on `mediaClass`:
  - `'track'` / `'music'` → `music-2-line`
  - `'album'` → `album-line`
  - `'artist'` → `user-3-line`
  - `'playlist'` → `play-list-2-line`
  - `'directory'` / default → `folder-music-line`
- If `canExpand` → show `arrow-right-s-line` chevron on the right.
- If `canPlay && !canExpand` → show `play-circle-line` icon on the right.
- If both → show chevron; play is triggered by a dedicated `onPlay` callback (prop optional, defaults to `onPress` behaviour).
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

**Props (`SearchResultItem.types.ts`):**

```typescript
export type SearchResultItemProps = {
  item: SearchResultItem;
  onPlay: () => void;
  onAddToQueue?: () => void;
};
```

**Visual layout:**

```
[ thumbnail / icon ]  [ title              ]  [ + queue ]  [ play ]
                       [ artist • album    ]
```

- Same thumbnail/icon fallback logic as `MediaBrowserItem`.
- `onAddToQueue` button: `add-line` icon (only shown if callback is provided).
- `onPlay` button: `play-circle-line` icon.
- All colors from `useTheme()`.

Barrel-export both components from `src/components/index.ts`.

---

## Screen — `app/(tabs)/search.tsx`

### State machine

```
search bar empty / not focused  →  BROWSER MODE
search bar focused or has text  →  SEARCH MODE
```

### Browser mode layout

```
┌─────────────────────────────────────┐
│  [ Search bar (unfocused)         ] │  ← always present
├─────────────────────────────────────┤
│  Breadcrumbs / back button          │  ← hidden at root
├─────────────────────────────────────┤
│                                     │
│  FlatList of MediaBrowserItem rows  │
│  (pull-to-refresh at root)          │
│                                     │
│  [empty state: loading spinner]     │
│  [empty state: "Not available"]     │
└─────────────────────────────────────┘
```

- Breadcrumbs: show the last element of `path` as a `← Title` back button. Tapping calls `goBack()`. Long-press (or a "home" icon) calls `goToRoot()`.
- Pull-to-refresh (`RefreshControl`) is only wired when `path.length === 0`.
- Tapping a `MediaBrowserItem`:
  - `canExpand` → call `browse(item)`.
  - `canPlay && !canExpand` → call `media_player.play_media` via `useMediaPlayerControls`.
  - Both → default to `browse`; expose a play icon on the row as `onPlay`.

### Search mode layout

```
┌─────────────────────────────────────┐
│  [ Search bar (focused, has text) ] │
├─────────────────────────────────────┤
│                                     │
│  FlatList of SearchResultItem rows  │
│  (grouped by media type if > 1)     │
│                                     │
│  [empty state: loading spinner]     │
│  [empty state: "No results"]        │
│  [empty state: "Search unavail."]   │
└─────────────────────────────────────┘
```

- Transition: tapping the search bar swaps the content area without a route change.
- Cancel/clear on the search bar → `clear()` + unfocus → back to browser mode.
- Section headers (Track, Album, Artist, Playlist) only rendered when results contain more than one `mediaClass`.
- Tapping `onPlay` on a result: call `media_player.play_media` directly.
- Tapping `onAddToQueue`: call the appropriate queue-add service (MA or HA).

### `entityId` wiring

`entityId` comes from `useLocalSearchParams<{ entityId?: string }>()` — same pattern as the other tabs.

---

## Implementation order

1. **Types** — `src/types/mediaBrowser.ts`, barrel-export
2. **`useMediaBrowser` hook** — browser navigation + root load
3. **`useMediaSearch` hook** — debounced search + results
4. **`MediaBrowserItem` component** — thumbnail, icon fallback, chevron/play
5. **`SearchResultItem` component** — thumbnail, icon fallback, play + add-to-queue
6. **`app/(tabs)/search.tsx`** — wire everything together, browser mode first
7. **Search mode** — add search bar focus state, swap content area
8. **Polish** — breadcrumbs, pull-to-refresh, all empty states, loading states
9. **Pre-commit checks** — `yarn typecheck && yarn lint && yarn test`

---

## New files summary

| File | Purpose |
|---|---|
| `src/types/mediaBrowser.ts` | `MediaBrowserItem`, `MediaBrowserPath`, `SearchResultItem` types |
| `src/hooks/useMediaBrowser.ts` | Browser navigation state + `browse_media` calls |
| `src/hooks/useMediaSearch.ts` | Debounced search + `search_media` calls |
| `src/components/MediaBrowserItem/MediaBrowserItem.tsx` | Single browser row |
| `src/components/MediaBrowserItem/MediaBrowserItem.types.ts` | Props type |
| `src/components/MediaBrowserItem/index.ts` | Barrel |
| `src/components/SearchResultItem/SearchResultItem.tsx` | Single search result row |
| `src/components/SearchResultItem/SearchResultItem.types.ts` | Props type |
| `src/components/SearchResultItem/index.ts` | Barrel |

`app/(tabs)/search.tsx` already exists — it will be replaced in full.

---

## Out of scope for this plan

- MA-specific search API (stub `TODO` in `useMediaSearch`, implement separately)
- Add-to-queue from search results when MA is the backend (requires knowing queue API)
- Drag-to-reorder within the browser (not applicable)
- Offline caching of browse tree
