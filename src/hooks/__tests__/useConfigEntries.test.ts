import { renderHook, act } from '@testing-library/react-native';
import { useConfigEntries } from '../useConfigEntries';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockSendMessage = jest.fn();

jest.mock('@/context', () => ({
  useHassContext: () => ({ sendMessage: mockSendMessage }),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeEntry = (domain: string, state = 'loaded', entry_id = domain) => ({
  entry_id,
  domain,
  state,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useConfigEntries', () => {
  it('returns null before sendMessage resolves', () => {
    mockSendMessage.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useConfigEntries());
    expect(result.current).toBeNull();
  });

  it('calls config_entries/get on mount', () => {
    mockSendMessage.mockResolvedValue([]);
    renderHook(() => useConfigEntries());
    expect(mockSendMessage).toHaveBeenCalledWith({ type: 'config_entries/get' });
  });

  it('returns domain names of loaded entries after resolving', async () => {
    mockSendMessage.mockResolvedValue([
      makeEntry('mass_queue'),
      makeEntry('lyrion_cli'),
    ]);
    const { result } = renderHook(() => useConfigEntries());
    await act(async () => {});
    expect(result.current).toEqual(['mass_queue', 'lyrion_cli']);
  });

  it('filters out entries whose state is not "loaded"', async () => {
    mockSendMessage.mockResolvedValue([
      makeEntry('mass_queue', 'loaded'),
      makeEntry('lyrion_cli', 'setup'),
      makeEntry('music_assistant', 'failed'),
    ]);
    const { result } = renderHook(() => useConfigEntries());
    await act(async () => {});
    expect(result.current).toEqual(['mass_queue']);
  });

  it('returns an empty array when no entries are loaded', async () => {
    mockSendMessage.mockResolvedValue([
      makeEntry('lyrion_cli', 'setup'),
    ]);
    const { result } = renderHook(() => useConfigEntries());
    await act(async () => {});
    expect(result.current).toEqual([]);
  });

  it('returns an empty array when sendMessage rejects', async () => {
    mockSendMessage.mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => useConfigEntries());
    await act(async () => {});
    expect(result.current).toEqual([]);
  });

  it('returns an empty array when entries list is empty', async () => {
    mockSendMessage.mockResolvedValue([]);
    const { result } = renderHook(() => useConfigEntries());
    await act(async () => {});
    expect(result.current).toEqual([]);
  });
});
