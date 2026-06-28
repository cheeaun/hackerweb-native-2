import { View } from 'react-native';

import ActivityIndicator from './ActivityIndicator';
import Text from './Text';

export default function ListEmpty({
  state = null, // loading, nada, error
  nadaText = '',
  errorComponent = () => null,
}) {
  if (!state) return null;

  return (
    <View
      style={{
        flexGrow: 1,
        minHeight: '33%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
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
