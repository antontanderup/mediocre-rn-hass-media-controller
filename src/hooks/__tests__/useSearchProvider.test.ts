import { renderHook, act } from '@testing-library/react-native';
import { useSearchProvider } from '../useSearchProvider';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPlayers = [
  { entity_id: 'media_player.living_room', attributes: { friendly_name: 'Living Room' } },
  { entity_id: 'media_player.bedroom', attributes: { friendly_name: 'Bedroom' } },
];

let mockAppConfig: object | null = null;

jest.mock('@/context', () => ({
  useHassContext: () => ({ players: mockPlayers }),
}));

jest.mock('../useAppConfig', () => ({
  useAppConfig: () => ({ config: mockAppConfig }),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ENTITY_ID = 'media_player.living_room';

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockAppConfig = null;
});

describe('useSearchProvider', () => {
  describe('when no player config exists', () => {
    it('returns a single HA provider for the entity', () => {
      const { result } = renderHook(() => useSearchProvider(ENTITY_ID));
      expect(result.current.providers).toHaveLength(1);
      expect(result.current.providers[0].type).toBe('ha');
      expect((result.current.providers[0] as { type: 'ha'; entityId: string }).entityId).toBe(ENTITY_ID);
    });

    it('uses the friendly_name from players as the provider name', () => {
      const { result } = renderHook(() => useSearchProvider(ENTITY_ID));
      expect(result.current.providers[0].name).toBe('Living Room');
    });

    it('selects the first provider by default', () => {
      const { result } = renderHook(() => useSearchProvider(ENTITY_ID));
      expect(result.current.selected).toEqual(result.current.providers[0]);
    });
  });

  describe('when maEntityId is configured', () => {
    beforeEach(() => {
      mockAppConfig = {
        mediaPlayers: [{ entityId: ENTITY_ID, maEntityId: 'media_player.ma' }],
        options: {},
      };
    });

    it('appends a Music Assistant provider', () => {
      const { result } = renderHook(() => useSearchProvider(ENTITY_ID));
      expect(result.current.providers).toHaveLength(2);
      const ma = result.current.providers.find(p => p.type === 'ma');
      expect(ma).toBeDefined();
      expect(ma!.name).toBe('Music Assistant');
    });

    it('still selects the first (HA) provider by default', () => {
      const { result } = renderHook(() => useSearchProvider(ENTITY_ID));
      expect(result.current.selected?.type).toBe('ha');
    });
  });

  describe('when custom search providers are configured', () => {
    beforeEach(() => {
      mockAppConfig = {
        mediaPlayers: [
          {
            entityId: ENTITY_ID,
            searchEntries: [
              { entity_id: 'media_player.bedroom', name: 'Bedroom Search' },
            ],
          },
        ],
        options: {},
      };
    });

    it('uses the configured search providers instead of the entity itself', () => {
      const { result } = renderHook(() => useSearchProvider(ENTITY_ID));
      const ha = result.current.providers.filter(p => p.type === 'ha');
      expect(ha).toHaveLength(1);
      expect((ha[0] as { type: 'ha'; entityId: string }).entityId).toBe('media_player.bedroom');
    });

    it('uses the configured name when provided', () => {
      const { result } = renderHook(() => useSearchProvider(ENTITY_ID));
      expect(result.current.providers[0].name).toBe('Bedroom Search');
    });
  });

  describe('select()', () => {
    beforeEach(() => {
      mockAppConfig = {
        mediaPlayers: [{ entityId: ENTITY_ID, maEntityId: 'media_player.ma' }],
        options: {},
      };
    });

    it('changes the selected provider', () => {
      const { result } = renderHook(() => useSearchProvider(ENTITY_ID));
      const maProvider = result.current.providers.find(p => p.type === 'ma')!;

      act(() => {
        result.current.select(maProvider);
      });

      expect(result.current.selected?.type).toBe('ma');
    });

    it('falls back to first provider when selected id is not found', () => {
      const { result } = renderHook(() => useSearchProvider(ENTITY_ID));
      // Select MA, then check it's reflected
      const maProvider = result.current.providers.find(p => p.type === 'ma')!;
      act(() => result.current.select(maProvider));
      expect(result.current.selected?.type).toBe('ma');
    });
  });
});
