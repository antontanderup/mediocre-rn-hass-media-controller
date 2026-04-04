import { buildTheme } from '../buildTheme';

const HEX_RE = /^#[0-9a-f]{6}$/i;

describe('buildTheme', () => {
  const light = buildTheme('#6750A4', 'light');
  const dark = buildTheme('#6750A4', 'dark');

  it('returns the correct sourceColor and colorScheme', () => {
    expect(light.sourceColor).toBe('#6750A4');
    expect(light.colorScheme).toBe('light');
    expect(dark.colorScheme).toBe('dark');
  });

  it('produces valid hex strings for all tokens', () => {
    const tokens = Object.entries(light).filter(([k]) => k !== 'colorScheme');
    for (const [key, value] of tokens) {
      expect(value).toMatch(HEX_RE), `${key} should be a valid hex color`;
    }
  });

  it('light and dark themes differ for primary', () => {
    expect(light.primary).not.toBe(dark.primary);
  });

  it('surface container tokens are distinct', () => {
    expect(light.surfaceContainerLow).not.toBe(light.surfaceContainerHigh);
    expect(dark.surfaceContainerLow).not.toBe(dark.surfaceContainerHigh);
  });

  it('produces different themes for different source colors', () => {
    const blue = buildTheme('#0000FF', 'light');
    expect(blue.primary).not.toBe(light.primary);
  });
});
