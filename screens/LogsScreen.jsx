import { FlatList, View } from 'react-native';

import safeStringify from 'safe-stringify';

import Text from '../components/Text';

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
          .map((l) => (typeof l === 'string' ? l : safeStringify(l)))
          .join(' ')}
      </Text>
    </View>
  );
};

export default function LogsScreen() {
  _consolelog('LOGS', DEBUG_LOGS);
  return (
    <FlatList
      contentInsetAdjustmentBehavior="always"
      data={DEBUG_LOGS}
      keyExtractor={(item) => '' + item.ts.getTime() + Math.random()}
      renderItem={renderItem}
    />
  );
}
