import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';

import Text from './Text';
import ActivityIndicator from './ActivityIndicator';

export default function ({
  loading = false,
  nada = false,
  nadaText = '',
  error = false,
  errorComponent = () => null,
}) {
  const { width, height } = useWindowDimensions();
  const padding = useMemo(() => Math.min(width, height) / 2, [width, height]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: padding,
      }}
    >
      {loading ? (
        <ActivityIndicator />
      ) : error ? (
        errorComponent()
      ) : nada ? (
        <Text type="insignificant">{nadaText}</Text>
      ) : null}
    </View>
  );
}
