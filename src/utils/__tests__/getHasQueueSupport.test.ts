import { getHasQueueSupport } from '../getHasQueueSupport';
import type { MediaPlayerConfig, MediaPlayerEntity } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makePlayer = (entity_id: string, attrs: Record<string, unknown> = {}): MediaPlayerEntity => ({
  entity_id,
  state: 'playing',
  attributes: attrs,
  last_changed: '',
  last_updated: '',
  context: { id: '', parent_id: null, user_id: null },
});

const makeConfig = (overrides: Partial<MediaPlayerConfig> = {}): MediaPlayerConfig => ({
  entityId: 'media_player.player',
  ...overrides,
});

const ENTITY_ID = 'media_player.player';
const MA_ENTITY_ID = 'media_player.ma';
const LMS_ENTITY_ID = 'media_player.lms';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getHasQueueSupport', () => {
  describe('entity ID check — returns null when no queue entity is configured', () => {
    it('returns null when no maEntityId or lmsEntityId is configured', () => {
      const players = [makePlayer(ENTITY_ID)];
      const config = makeConfig();
      expect(getHasQueueSupport(ENTITY_ID, config, players)).toBeNull();
    });

    it('returns null when both maEntityId and lmsEntityId are explicitly null', () => {
      const players = [makePlayer(ENTITY_ID)];
      const config = makeConfig({ maEntityId: null, lmsEntityId: null });
      expect(getHasQueueSupport(ENTITY_ID, config, players)).toBeNull();
    });

    it('returns null when no config is provided', () => {
      const players = [makePlayer(ENTITY_ID)];
      expect(getHasQueueSupport(ENTITY_ID, null, players)).toBeNull();
    });

    it('returns null when lmsEntityId is set but entity id does not match', () => {
      const players = [makePlayer(ENTITY_ID)];
      const config = makeConfig({ lmsEntityId: 'media_player.different' });
      expect(getHasQueueSupport(ENTITY_ID, config, players)).toBeNull();
    });
  });

  describe('MA auto-detection via mass_player_type attribute', () => {
    it('detects a native MA player even without an explicit maEntityId in config', () => {
      const players = [makePlayer(ENTITY_ID, { mass_player_type: 'player' })];
      const config = makeConfig();
      expect(getHasQueueSupport(ENTITY_ID, config, players)).toEqual({ isMA: true, isLMS: false });
    });
  });

  describe('MA entity ID match', () => {
    it('returns isMA=true when maEntityId matches', () => {
      const players = [makePlayer(MA_ENTITY_ID)];
      const config = makeConfig({ maEntityId: MA_ENTITY_ID });
      expect(getHasQueueSupport(MA_ENTITY_ID, config, players)).toEqual({ isMA: true, isLMS: false });
    });
  });

  describe('LMS entity ID match', () => {
    it('returns isLMS=true when lmsEntityId matches', () => {
      const players = [makePlayer(LMS_ENTITY_ID)];
      const config = makeConfig({ lmsEntityId: LMS_ENTITY_ID });
      expect(getHasQueueSupport(LMS_ENTITY_ID, config, players)).toEqual({ isMA: false, isLMS: true });
    });
  });

  describe('Universal Media Player (UMP) support', () => {
    it('detects LMS via active_child matching lmsEntityId', () => {
      const ump = makePlayer(ENTITY_ID, { active_child: LMS_ENTITY_ID });
      const lms = makePlayer(LMS_ENTITY_ID);
      const players = [ump, lms];
      const config = makeConfig({ lmsEntityId: LMS_ENTITY_ID });
      expect(getHasQueueSupport(ENTITY_ID, config, players)).toEqual({ isMA: false, isLMS: true });
    });

    it('returns null when UMP active_child does not match lmsEntityId', () => {
      const ump = makePlayer(ENTITY_ID, { active_child: 'media_player.other' });
      const config = makeConfig({ lmsEntityId: LMS_ENTITY_ID });
      expect(getHasQueueSupport(ENTITY_ID, config, [ump])).toBeNull();
    });

    it('auto-detects MA via active_child that has mass_player_type', () => {
      const maChild = makePlayer(MA_ENTITY_ID, { mass_player_type: 'player' });
      const ump = makePlayer(ENTITY_ID, { active_child: MA_ENTITY_ID });
      const players = [ump, maChild];
      const config = makeConfig(); // no explicit maEntityId
      expect(getHasQueueSupport(ENTITY_ID, config, players)).toEqual({ isMA: true, isLMS: false });
    });
  });

  describe('both MA and LMS configured', () => {
    it('returns both isMA and isLMS true when both entity IDs match', () => {
      const maPlayer = makePlayer(MA_ENTITY_ID, { mass_player_type: 'player' });
      const config = makeConfig({ maEntityId: MA_ENTITY_ID, lmsEntityId: MA_ENTITY_ID });
      expect(getHasQueueSupport(MA_ENTITY_ID, config, [maPlayer])).toEqual({ isMA: true, isLMS: true });
    });
  });
});
