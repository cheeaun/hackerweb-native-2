import { Stack, router } from 'expo-router';

import CommentsScreen from '../../../screens/CommentsScreen';

export default function Comments() {
  return (
    <>
      <CommentsScreen />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="checkmark" onPress={() => router.back()} />
      </Stack.Toolbar>
    </>
  );
}
