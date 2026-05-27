import { Stack, router } from 'expo-router';

import SettingsScreen from '../screens/SettingsScreen';

export default function Settings() {
  return (
    <>
      <SettingsScreen />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="checkmark" onPress={() => router.back()} />
      </Stack.Toolbar>
    </>
  );
}
