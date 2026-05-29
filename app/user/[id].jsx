import { Stack, router, useLocalSearchParams } from 'expo-router';

import UserScreen from '../../screens/UserScreen';
import Text from '../../components/Text';

export default function User() {
  const { id } = useLocalSearchParams();

  return (
    <>
      <Stack.Title asChild>
        <Text numberOfLines={1}>{id}</Text>
      </Stack.Title>
      <UserScreen />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="checkmark" onPress={() => router.back()} />
      </Stack.Toolbar>
    </>
  );
}
