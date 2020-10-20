import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';

import Text from './Text';
import ActivityIndicator from './ActivityIndicator';

export default function ({
  state = null, // loading, nada, error
  nadaText = '',
  errorComponent = () => null,
}) {
  if (!state) return null;
  const { width, height } = useWindowDimensions();
  const padding = useMemo(() => Math.min(width, height) / 2, [width, height]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: padding,
        paddingHorizontal: 15,
      }}
    >
      {state === 'loading' ? (
        <ActivityIndicator />
      ) : state === 'error' ? (
        errorComponent()
      ) : state === 'nada' ? (
        <Text type="insignificant">{nadaText}</Text>
      ) : null}
    </View>
  );
}
