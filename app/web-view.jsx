import { Stack, router } from 'expo-router';

import WebViewScreen from '../screens/WebViewScreen';

export default function WebView() {
  return (
    <>
      <WebViewScreen />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="checkmark" onPress={() => router.back()} />
      </Stack.Toolbar>
    </>
  );
}
