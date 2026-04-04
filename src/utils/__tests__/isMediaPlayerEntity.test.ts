import { isMediaPlayerEntity } from '../isMediaPlayerEntity';
import type { HassEntity } from '@/types';

const makeEntity = (entity_id: string): HassEntity => ({
  entity_id,
  state: 'on',
  attributes: {},
  last_changed: '',
  last_updated: '',
  context: { id: '', parent_id: null, user_id: null },
});

describe('isMediaPlayerEntity', () => {
  it('returns true for media_player entities', () => {
    expect(isMediaPlayerEntity(makeEntity('media_player.living_room'))).toBe(true);
    expect(isMediaPlayerEntity(makeEntity('media_player.kitchen'))).toBe(true);
  });

  it('returns false for other entity domains', () => {
    expect(isMediaPlayerEntity(makeEntity('light.living_room'))).toBe(false);
    expect(isMediaPlayerEntity(makeEntity('switch.fan'))).toBe(false);
    expect(isMediaPlayerEntity(makeEntity('sensor.temperature'))).toBe(false);
  });

  it('returns false for entity_id that contains but does not start with media_player', () => {
    expect(isMediaPlayerEntity(makeEntity('sensor.media_player_count'))).toBe(false);
  });
});
