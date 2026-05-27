import { Stack, router } from 'expo-router';

import ThreadScreen from '../../../screens/ThreadScreen';

export default function Thread() {
  return (
    <>
      <ThreadScreen />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="checkmark" onPress={() => router.back()} />
      </Stack.Toolbar>
    </>
  );
}
