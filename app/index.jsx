import { Stack, router } from 'expo-router';

import StoriesScreen from '../screens/StoriesScreen';

export default function Index() {
  return (
    <>
      <StoriesScreen />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon="gearshape"
          onPress={() => router.push('/settings')}
        />
      </Stack.Toolbar>
    </>
  );
}
