import { View } from 'react-native';

import { Stack, router, useLocalSearchParams } from 'expo-router';

import Text from '../../components/Text';
import UserScreen from '../../screens/UserScreen';

export default function User() {
  const { id } = useLocalSearchParams();

  return (
    <>
      <UserScreen />
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View
              style={{ flex: 1, alignItems: 'flex-start', marginRight: 60 }}
            >
              <Text
                style={{ fontSize: 17, fontWeight: '600' }}
                numberOfLines={1}
              >
                {id}
              </Text>
            </View>
          ),
        }}
      />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="checkmark" onPress={() => router.back()} />
      </Stack.Toolbar>
    </>
  );
}
