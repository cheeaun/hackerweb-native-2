import { Stack, router } from 'expo-router';
import { View } from 'react-native';

import LogsScreen from '../screens/LogsScreen';
import Text from '../components/Text';

export default function Logs() {
  return (
    <>
      <LogsScreen />
      <Stack.Screen.Title asChild>
        <View>
          <Text size="body" bolder>
            Logs
          </Text>
          <Text size="caption2" type="insignificant">
            In-memory, not stored anywhere. Don't worry.
          </Text>
        </View>
      </Stack.Screen.Title>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="checkmark" onPress={() => router.back()} />
      </Stack.Toolbar>
    </>
  );
}
