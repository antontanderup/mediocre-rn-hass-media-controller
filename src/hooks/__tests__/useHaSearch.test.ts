import { act, renderHook } from '@testing-library/react-native';
import { useHaSearch } from '../useHaSearch';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// @/utils pulls in createUseStyles → @/hooks → useAppConfig → arktype (ESM),
// which breaks Jest's CJS transform. Mock the barrel to supply only what the
// hook needs (HA_FILTER_DEFAULTS) without dragging in the whole chain.
jest.mock('@/utils', () => ({
  HA_FILTER_DEFAULTS: [
    { type: 'all', name: 'All' },
    { type: 'artists', name: 'Artists' },
    { type: 'albums', name: 'Albums' },
    { type: 'tracks', name: 'Tracks' },
    { type: 'playlists', name: 'Playlists' },
  ],
}));

const mockCallService = jest.fn();
const mockUseHassMessagePromise = jest.fn();

jest.mock('@/context', () => ({
  useHassContext: () => ({
    callService: mockCallService,
  }),
}));

jest.mock('../useHassMessagePromise', () => ({
  useHassMessagePromise: (...args: unknown[]) => mockUseHassMessagePromise(...args),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ENTITY_ID = 'media_player.test';

const makeHaItem = (overrides = {}) => ({
  media_class: 'track',
  media_content_id: 'spotify:track:1',
  media_content_type: 'music',
  title: 'Test Track',
  can_play: true,
  can_expand: false,
  thumbnail: undefined,
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Default: no data, not loading
  mockUseHassMessagePromise.mockReturnValue({ data: null, loading: false, error: null, refetch: jest.fn() });
});

describe('useHaSearch', () => {
  it('returns empty results when there is no data', () => {
    const { result } = renderHook(() => useHaSearch('', 'all', ENTITY_ID));
    expect(result.current.results).toEqual([]);
  });

  it('passes null message to useHassMessagePromise when query is too short', () => {
    renderHook(() => useHaSearch('a', 'all', ENTITY_ID));
    // Single char is below the 2-char minimum — search message must be null
    const [searchMsg] = mockUseHassMessagePromise.mock.calls[0];
    expect(searchMsg).toBeNull();
  });

  it('builds search message when query has 2+ chars', () => {
    renderHook(() => useHaSearch('joy', 'all', ENTITY_ID));
    const [searchMsg] = mockUseHassMessagePromise.mock.calls[0];
    expect(searchMsg).not.toBeNull();
    expect(searchMsg.service).toBe('search_media');
    expect(searchMsg.service_data.search_query).toBe('joy');
    expect(searchMsg.service_data.entity_id).toBe(ENTITY_ID);
  });

  it('omits media_content_type from service_data when filter is "all"', () => {
    renderHook(() => useHaSearch('joy', 'all', ENTITY_ID));
    const [searchMsg] = mockUseHassMessagePromise.mock.calls[0];
    expect(searchMsg.service_data).not.toHaveProperty('media_content_type');
  });

  it('includes media_content_type when filter is not "all"', () => {
    renderHook(() => useHaSearch('joy', 'tracks', ENTITY_ID));
    const [searchMsg] = mockUseHassMessagePromise.mock.calls[0];
    expect(searchMsg.service_data.media_content_type).toBe('tracks');
  });

  it('extracts results from response keyed by entityId', () => {
    const item = makeHaItem();
    mockUseHassMessagePromise
      .mockReturnValueOnce({ data: { [ENTITY_ID]: { result: [item] } }, loading: false, error: null, refetch: jest.fn() })
      .mockReturnValue({ data: null, loading: false, error: null, refetch: jest.fn() });

    const { result } = renderHook(() => useHaSearch('joy', 'all', ENTITY_ID));
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].title).toBe('Test Track');
  });

  it('sets isAvailable to false after a search error (with no prior success)', () => {
    mockUseHassMessagePromise
      .mockReturnValueOnce({ data: null, loading: false, error: 'Service not supported', refetch: jest.fn() })
      .mockReturnValue({ data: null, loading: false, error: null, refetch: jest.fn() });

    const { result } = renderHook(() => useHaSearch('joy', 'all', ENTITY_ID));
    expect(result.current.isAvailable).toBe(false);
  });

  it('keeps isAvailable true when error occurs after a prior success', () => {
    // First render: success
    mockUseHassMessagePromise
      .mockReturnValueOnce({ data: { [ENTITY_ID]: { result: [makeHaItem()] } }, loading: false, error: null, refetch: jest.fn() })
      .mockReturnValueOnce({ data: null, loading: false, error: null, refetch: jest.fn() });

    const { result, rerender } = renderHook(
      ({ q }: { q: string }) => useHaSearch(q, 'all', ENTITY_ID),
      { initialProps: { q: 'joy' } },
    );
    expect(result.current.isAvailable).toBe(true);

    // Second render: error
    mockUseHassMessagePromise
      .mockReturnValueOnce({ data: null, loading: false, error: 'err', refetch: jest.fn() })
      .mockReturnValueOnce({ data: null, loading: false, error: null, refetch: jest.fn() });

    act(() => rerender({ q: 'xyz' }));
    // Still available because hasSucceeded ref is true
    expect(result.current.isAvailable).toBe(true);
  });

  it('calls callService with correct args on playItem', () => {
    const { result } = renderHook(() => useHaSearch('', 'all', ENTITY_ID));
    const item = makeHaItem();
    act(() => {
      result.current.playItem(item, ENTITY_ID, 'play');
    });
    expect(mockCallService).toHaveBeenCalledWith(
      'media_player',
      'play_media',
      {
        media_content_type: item.media_content_type,
        media_content_id: item.media_content_id,
        enqueue: 'play',
      },
      { entity_id: ENTITY_ID },
    );
  });

  it('uses default HA_FILTER_DEFAULTS when no filterConfig provided', () => {
    const { result } = renderHook(() => useHaSearch('', 'all', ENTITY_ID));
    expect(result.current.filterConfig.length).toBeGreaterThan(0);
    expect(result.current.filterConfig[0].type).toBe('all');
  });

  it('uses custom filterConfig when provided', () => {
    const custom = [{ type: 'tracks' as const, name: 'Songs' }];
    const { result } = renderHook(() => useHaSearch('', 'all', ENTITY_ID, custom));
    expect(result.current.filterConfig).toBe(custom);
  });
});
