import React from 'react';
import { Image } from 'react-native';
import { SvgUri } from 'react-native-svg';
import type { ImageStyle } from 'react-native';

type MediaArtworkProps = {
  uri: string;
  style?: ImageStyle;
};

function isSvg(uri: string): boolean {
  return /\.svg(\?|#|$)/i.test(uri) || uri.startsWith('data:image/svg+xml');
}

export const MediaArtwork = ({ uri, style }: MediaArtworkProps): React.JSX.Element => {
  if (isSvg(uri)) {
    return <SvgUri uri={uri} width="100%" height="100%" />;
  }
  return <Image source={{ uri }} style={style} accessibilityIgnoresInvertColors />;
};
