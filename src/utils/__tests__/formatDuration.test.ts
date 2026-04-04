import { formatDuration } from '../formatDuration';

describe('formatDuration', () => {
  it('formats sub-minute durations', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(5)).toBe('0:05');
    expect(formatDuration(59)).toBe('0:59');
  });

  it('formats minute durations without hours', () => {
    expect(formatDuration(60)).toBe('1:00');
    expect(formatDuration(90)).toBe('1:30');
    expect(formatDuration(3599)).toBe('59:59');
  });

  it('formats hour durations with zero-padded minutes', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
    expect(formatDuration(3661)).toBe('1:01:01');
    expect(formatDuration(7322)).toBe('2:02:02');
  });

  it('floors fractional seconds', () => {
    expect(formatDuration(90.9)).toBe('1:30');
    expect(formatDuration(3600.5)).toBe('1:00:00');
  });
});
