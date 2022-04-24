import { useMemo } from 'react';
import { View } from 'react-native';

import useViewportStore from '../hooks/useViewportStore';

import Text from './Text';
import ActivityIndicator from './ActivityIndicator';

export default function ({
  state = null, // loading, nada, error
  nadaText = '',
  errorComponent = () => null,
}) {
  if (!state) return null;
  const height = useViewportStore((state) => state.height);
  const paddingVertical = useMemo(() => height / 3, [height]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical,
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
