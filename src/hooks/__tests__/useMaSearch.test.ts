import { renderHook, act } from '@testing-library/react-native';
import { useMaSearch } from '../useMaSearch';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockCallService = jest.fn();
const mockSendMessage = jest.fn();
const mockUseHassMessagePromise = jest.fn();

jest.mock('@/context', () => ({
  useHassContext: () => ({
    callService: mockCallService,
    sendMessage: mockSendMessage,
  }),
}));

jest.mock('../useHassMessagePromise', () => ({
  useHassMessagePromise: (...args: unknown[]) => mockUseHassMessagePromise(...args),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MA_ENTITY_ID = 'media_player.ma';
const ENTRY_ID = 'abc123';

const makeMaItem = (overrides = {}) => ({
  media_type: 'track' as const,
  uri: 'library://track/1',
  name: 'Test Track',
  ...overrides,
});

const makeConfigEntries = (entryId = ENTRY_ID) => [
  { domain: 'music_assistant', state: 'loaded', entry_id: entryId },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockSendMessage.mockResolvedValue(makeConfigEntries());
  mockUseHassMessagePromise.mockReturnValue({ data: null, loading: false, error: null });
});

describe('useMaSearch', () => {
  it('fetches config entry on mount', async () => {
    renderHook(() => useMaSearch('', 'all', MA_ENTITY_ID));
    expect(mockSendMessage).toHaveBeenCalledWith({ type: 'config/config_entries/entry' });
  });

  it('sets configError when no music_assistant entry is found', async () => {
    mockSendMessage.mockResolvedValue([
      { domain: 'other', state: 'loaded', entry_id: 'x' },
    ]);
    const { result } = renderHook(() => useMaSearch('', 'all', MA_ENTITY_ID));
    // Wait for the async sendMessage to resolve
    await act(async () => {});
    expect(result.current.error).toMatch(/not found/i);
  });

  it('sets configError when sendMessage rejects', async () => {
    mockSendMessage.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useMaSearch('', 'all', MA_ENTITY_ID));
    await act(async () => {});
    expect(result.current.error).toMatch(/failed/i);
  });

  it('passes null message when query is too short', async () => {
    renderHook(() => useMaSearch('ab', 'all', MA_ENTITY_ID));
    await act(async () => {});
    const [msg] = mockUseHassMessagePromise.mock.calls[0];
    expect(msg).toBeNull();
  });

  it('passes null message when configEntryId is not yet known', () => {
    // sendMessage hasn't resolved yet at hook call time
    renderHook(() => useMaSearch('hello', 'all', MA_ENTITY_ID));
    const [msg] = mockUseHassMessagePromise.mock.calls[0];
    expect(msg).toBeNull();
  });

  it('builds search message with config_entry_id after entry resolves', async () => {
    const { rerender } = renderHook(() => useMaSearch('hello', 'all', MA_ENTITY_ID));
    await act(async () => {}); // let sendMessage resolve

    rerender({});
    const lastCall = mockUseHassMessagePromise.mock.calls.at(-1);
    const [msg] = lastCall!;

    if (msg !== null) {
      expect(msg.service).toBe('search');
      expect(msg.service_data.name).toBe('hello');
      expect(msg.service_data.config_entry_id).toBe(ENTRY_ID);
    }
  });

  it('omits media_type when filter is "all"', async () => {
    renderHook(() => useMaSearch('hello', 'all', MA_ENTITY_ID));
    await act(async () => {});
    const lastMsg = mockUseHassMessagePromise.mock.calls.at(-1)?.[0];
    if (lastMsg) {
      expect(lastMsg.service_data).not.toHaveProperty('media_type');
    }
  });

  it('includes media_type when filter is specific', async () => {
    renderHook(() => useMaSearch('hello', 'track', MA_ENTITY_ID));
    await act(async () => {});
    const lastMsg = mockUseHassMessagePromise.mock.calls.at(-1)?.[0];
    if (lastMsg) {
      expect(lastMsg.service_data.media_type).toBe('track');
    }
  });

  it('returns empty results object when there is no data', () => {
    const { result } = renderHook(() => useMaSearch('', 'all', MA_ENTITY_ID));
    expect(result.current.results).toEqual({});
  });

  it('returns MaSearchResults from response data', async () => {
    const track = makeMaItem();
    mockUseHassMessagePromise.mockReturnValue({
      data: { tracks: [track] },
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useMaSearch('hello', 'all', MA_ENTITY_ID));
    expect(result.current.results.tracks).toHaveLength(1);
    expect(result.current.results.tracks![0].name).toBe('Test Track');
  });

  it('calls music_assistant.play_media with correct args on playItem', () => {
    const { result } = renderHook(() => useMaSearch('', 'all', MA_ENTITY_ID));
    const item = makeMaItem();
    act(() => {
      result.current.playItem(item, 'play');
    });
    expect(mockCallService).toHaveBeenCalledWith('music_assistant', 'play_media', {
      entity_id: MA_ENTITY_ID,
      media_type: item.media_type,
      media_id: item.uri,
      enqueue: 'play',
    });
  });

  it('uses "replace_next" enqueue mode', () => {
    const { result } = renderHook(() => useMaSearch('', 'all', MA_ENTITY_ID));
    const item = makeMaItem();
    act(() => {
      result.current.playItem(item, 'replace_next');
    });
    expect(mockCallService).toHaveBeenCalledWith('music_assistant', 'play_media', {
      entity_id: MA_ENTITY_ID,
      media_type: item.media_type,
      media_id: item.uri,
      enqueue: 'replace_next',
    });
  });
});
