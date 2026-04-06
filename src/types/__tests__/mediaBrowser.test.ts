import { MA_SECTION_LABELS, MA_SECTION_ORDER } from '../mediaBrowser';

describe('MA_SECTION_ORDER', () => {
  it('puts tracks first for discoverability', () => {
    expect(MA_SECTION_ORDER[0]).toBe('tracks');
  });

  it('contains all seven MA result keys', () => {
    const expected = ['tracks', 'albums', 'artists', 'playlists', 'radio', 'audiobooks', 'podcasts'];
    expect(MA_SECTION_ORDER).toEqual(expect.arrayContaining(expected));
    expect(MA_SECTION_ORDER).toHaveLength(expected.length);
  });
});

describe('MA_SECTION_LABELS', () => {
  it('has a label for every section key', () => {
    MA_SECTION_ORDER.forEach(key => {
      expect(MA_SECTION_LABELS[key]).toBeDefined();
      expect(typeof MA_SECTION_LABELS[key]).toBe('string');
    });
  });
});
