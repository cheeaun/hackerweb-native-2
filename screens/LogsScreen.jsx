import { FlatList, SafeAreaView, StyleSheet, View } from 'react-native';

import { TouchableOpacity } from 'react-native-gesture-handler';

import Text from '../components/Text';

import useTheme from '../hooks/useTheme';

const renderItem = ({ item }) => {
  const { ts, log } = item;
  return (
    <View
      style={{
        flexDirection: 'row',
        padding: 4,
      }}
    >
      <Text
        size="caption2"
        type="insignificant"
        style={{
          marginRight: 8,
          fontFamily: 'Menlo',
          lineHeight: 16,
        }}
      >
        {ts.toLocaleTimeString('en-US', {
          hour12: false,
        })}
        .{('' + ts.getMilliseconds()).padStart(3, '0')}
      </Text>
      <Text
        size="caption2"
        style={{
          flexShrink: 1,
          fontFamily: 'Menlo',
          lineHeight: 16,
        }}
      >
        {log
          .map((l) => (typeof l === 'string' ? l : JSON.stringify(l)))
          .join(' ')}
      </Text>
    </View>
  );
};

export default function LogsScreen({ navigation }) {
  const { colors } = useTheme();
  _consolelog('LOGS', DEBUG_LOGS);
  return (
    <>
      <View
        style={{
          borderBottomColor: colors.separator,
          borderBottomWidth: StyleSheet.hairlineWidth,
        }}
      >
        <SafeAreaView
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View style={{ paddingHorizontal: 15, paddingVertical: 8 }}>
            <Text bold>Logs</Text>
            <Text size="caption2" type="insignificant">
              In-memory, not stored anywhere. Don't worry.
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              navigation.pop();
            }}
            style={{ paddingHorizontal: 15 }}
            hitSlop={{
              top: 44,
              right: 44,
              bottom: 44,
              left: 44,
            }}
          >
            <Text type="link" bold>
              Close
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
      <FlatList
        contentInsetAdjustmentBehavior="always"
        data={DEBUG_LOGS}
        keyExtractor={(item) => '' + item.ts.getTime() + Math.random()}
        renderItem={renderItem}
      />
    </>
  );
}
