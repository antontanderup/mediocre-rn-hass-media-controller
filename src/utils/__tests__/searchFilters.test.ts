import { HA_FILTER_DEFAULTS, MA_FILTER_DEFAULTS } from '../searchFilters';

describe('HA_FILTER_DEFAULTS', () => {
  it('includes "all" as the first entry', () => {
    expect(HA_FILTER_DEFAULTS[0].type).toBe('all');
  });

  it('contains the four standard HA media types', () => {
    const types = HA_FILTER_DEFAULTS.map(f => f.type);
    expect(types).toContain('artists');
    expect(types).toContain('albums');
    expect(types).toContain('tracks');
    expect(types).toContain('playlists');
  });

  it('every entry has a name', () => {
    HA_FILTER_DEFAULTS.forEach(f => {
      expect(typeof f.name).toBe('string');
      expect(f.name.length).toBeGreaterThan(0);
    });
  });
});

describe('MA_FILTER_DEFAULTS', () => {
  it('includes "all" as the first entry', () => {
    expect(MA_FILTER_DEFAULTS[0].type).toBe('all');
  });

  it('contains all eight MA media types', () => {
    const types = MA_FILTER_DEFAULTS.map(f => f.type);
    (['artist', 'album', 'track', 'playlist', 'radio', 'audiobook', 'podcast'] as const).forEach(
      t => expect(types).toContain(t),
    );
  });

  it('every entry has a name', () => {
    MA_FILTER_DEFAULTS.forEach(f => {
      expect(typeof f.name).toBe('string');
      expect(f.name.length).toBeGreaterThan(0);
    });
  });
});
