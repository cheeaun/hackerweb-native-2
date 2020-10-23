import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  Pressable,
  ActionSheetIOS,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import Text from './Text';
import HTMLView from './HTMLView';
import TouchableOpacity from './TouchableOpacity';
import TimeAgo from './TimeAgo';

import useStore from '../hooks/useStore';
import useTheme from '../hooks/useTheme';

import openBrowser from '../utils/openBrowser';
import openShare from '../utils/openShare';

const styles = StyleSheet.create({
  metadata: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  opBox: {
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  op: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default function Comment(item) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { id, user, time, content, deleted, comments } = item;
  const datetime = new Date(time * 1000);
  const currentOP = useStore((state) => state.currentOP);
  if (deleted && !comments.length) return null;
  const hnURL = `https://news.ycombinator.com/item?id=${id}`;
  const [selected, setSelected] = useState(false);

  return (
    <Pressable
      style={selected && { transform: [{ scale: 0.995 }] }}
      onLongPress={() => {
        setSelected(true);
        Haptics.selectionAsync();
        ActionSheetIOS.showActionSheetWithOptions(
          {
            title: `Comment by ${user}`,
            options: [
              'View profile',
              'View comment on HN web site',
              'Share comment…',
              'Cancel',
            ],
            cancelButtonIndex: 3,
          },
          (index) => {
            switch (index) {
              case 0:
                navigation.push('User', user);
                break;
              case 1:
                openBrowser(hnURL);
                break;
              case 2:
                openShare({ url: hnURL });
                break;
            }
            setSelected(false);
          },
        );
      }}
    >
      {!deleted && (
        <View style={styles.metadata}>
          <Text
            size="subhead"
            bold
            style={{ color: colors.red }}
            numberOfLines={1}
            onPress={() => {
              navigation.push('User', user);
            }}
          >
            {user}
          </Text>
          {user === currentOP && (
            <TouchableOpacity
              style={[styles.opBox, { backgroundColor: colors.red }]}
              onPress={() => {
                Alert.alert(
                  'What is OP',
                  'OP is short for Original Poster — the person who posted this story.',
                );
              }}
            >
              <Text size="caption2" style={styles.op}>
                OP
              </Text>
            </TouchableOpacity>
          )}
          <Text size="subhead" type="insignificant">
            {' '}
            &middot; <TimeAgo time={datetime} />
          </Text>
        </View>
      )}
      <HTMLView html={content} />
    </Pressable>
  );
}
