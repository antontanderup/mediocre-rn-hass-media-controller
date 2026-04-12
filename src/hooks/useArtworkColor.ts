import { useEffect, useState } from 'react';
import { getColors } from 'react-native-image-colors';

const FALLBACK_COLOR = '#6750A4';

export const useArtworkColor = (uri: string | null | undefined): string | null => {
  const [color, setColor] = useState<string | null>(null);

  useEffect(() => {
    if (!uri) {
      setColor(null);
      return;
    }

    let cancelled = false;
    const cacheKey = uri.substring(0, 500);

    getColors(uri, { fallback: FALLBACK_COLOR, cache: true, key: cacheKey })
      .then(result => {
        if (cancelled) return;
        let extracted: string;
        if (result.platform === 'android') {
          extracted = result.vibrant || result.dominant;
        } else if (result.platform === 'ios') {
          extracted = result.primary;
        } else {
          extracted = result.vibrant || result.dominant;
        }
        setColor(extracted);
      })
      .catch(() => {
        if (!cancelled) setColor(null);
      });

    return () => {
      cancelled = true;
    };
  }, [uri]);

  return color;
};
