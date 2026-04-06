import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SearchResultItem } from '../SearchResultItem';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/hooks', () => ({
  useTheme: () => ({
    onSurface: '#000',
    onSurfaceVariant: '#555',
    surfaceVariant: '#eee',
    primary: '#6200ee',
  }),
}));

jest.mock('@/utils', () => ({
  createUseStyles: (fn: (theme: object) => object) => () => fn({
    onSurface: '#000',
    onSurfaceVariant: '#555',
    surfaceVariant: '#eee',
    primary: '#6200ee',
    outlineVariant: '#ccc',
  }),
}));

jest.mock('@/components/Icon', () => ({
  Icon: ({ name, testID }: { name: string; testID?: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text testID={testID ?? `icon-${name}`}>{name}</Text>;
  },
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SearchResultItem', () => {
  const onPlay = jest.fn();
  const onEnqueue = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('renders the title', () => {
    const { getByText } = render(
      <SearchResultItem title="Test Track" onPlay={onPlay} />,
    );
    expect(getByText('Test Track')).toBeTruthy();
  });

  it('renders the subtitle when provided', () => {
    const { getByText } = render(
      <SearchResultItem title="T" subtitle="Artist • Album" onPlay={onPlay} />,
    );
    expect(getByText('Artist • Album')).toBeTruthy();
  });

  it('does not render subtitle when absent', () => {
    const { queryByText } = render(
      <SearchResultItem title="T" onPlay={onPlay} />,
    );
    expect(queryByText('Artist • Album')).toBeNull();
  });

  it('calls onPlay when the play button is pressed', () => {
    const { getByLabelText } = render(
      <SearchResultItem title="T" onPlay={onPlay} />,
    );
    fireEvent.press(getByLabelText('Play T'));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('renders enqueue button when onEnqueue is provided', () => {
    const { getByLabelText } = render(
      <SearchResultItem title="T" onPlay={onPlay} onEnqueue={onEnqueue} />,
    );
    expect(getByLabelText('Add T to queue')).toBeTruthy();
  });

  it('does not render enqueue button when onEnqueue is absent', () => {
    const { queryByLabelText } = render(
      <SearchResultItem title="T" onPlay={onPlay} />,
    );
    expect(queryByLabelText('Add T to queue')).toBeNull();
  });

  it('calls onEnqueue when the enqueue button is pressed', () => {
    const { getByLabelText } = render(
      <SearchResultItem title="T" onPlay={onPlay} onEnqueue={onEnqueue} />,
    );
    fireEvent.press(getByLabelText('Add T to queue'));
    expect(onEnqueue).toHaveBeenCalledTimes(1);
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('renders no icon fallback when thumbnail is provided', () => {
    // When a thumbnail URL is given the Image is shown; the icon fallback should not appear
    const { queryByTestId } = render(
      <SearchResultItem title="T" thumbnail="https://example.com/art.jpg" mediaClass="track" onPlay={onPlay} />,
    );
    expect(queryByTestId('icon-music-2-line')).toBeNull();
  });

  it('renders fallback icon when thumbnail is absent', () => {
    const { getByTestId } = render(
      <SearchResultItem title="T" mediaClass="track" onPlay={onPlay} />,
    );
    // Our Icon mock renders testID as `icon-{name}`
    expect(getByTestId('icon-music-2-line')).toBeTruthy();
  });

  it('renders correct icon for each mediaClass', () => {
    const cases: [string, string][] = [
      ['track', 'music-2-line'],
      ['music', 'music-2-line'],
      ['album', 'album-line'],
      ['artist', 'user-3-line'],
      ['playlist', 'play-list-2-line'],
      ['radio', 'radio-line'],
      ['audiobook', 'book-open-line'],
      ['podcast', 'mic-line'],
    ];

    cases.forEach(([mediaClass, expectedIcon]) => {
      const { getByTestId, unmount } = render(
        <SearchResultItem title="T" mediaClass={mediaClass} onPlay={onPlay} />,
      );
      expect(getByTestId(`icon-${expectedIcon}`)).toBeTruthy();
      unmount();
    });
  });

  it('renders default icon for unknown mediaClass', () => {
    const { getByTestId } = render(
      <SearchResultItem title="T" mediaClass="unknown-type" onPlay={onPlay} />,
    );
    expect(getByTestId('icon-music-2-line')).toBeTruthy();
  });
});
