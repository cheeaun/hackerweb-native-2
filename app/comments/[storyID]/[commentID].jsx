import { Stack, router, useIsPreview } from 'expo-router';

import CommentsScreen from '../../../screens/CommentsScreen';

export default function Comments() {
  const isPreview = useIsPreview();
  return (
    <>
      {!isPreview && <Stack.Screen />}
      <CommentsScreen isPreview={isPreview} />
      {!isPreview && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon="checkmark"
            onPress={() => router.back()}
          />
        </Stack.Toolbar>
      )}
    </>
  );
}
