import React, { useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  Pressable,
  ActionSheetIOS,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { TouchableOpacity } from 'react-native-gesture-handler';

import Text from './Text';
import HTMLView from './HTMLView';
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
    justifyContent: 'center',
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

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bobble = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim]);

  return (
    <Pressable
      onLongPress={() => {
        bobble();
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
          },
        );
      }}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
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
                hitSlop={{
                  top: 10,
                  right: 10,
                  bottom: 20,
                  left: 10,
                }}
              >
                <Text size="caption2" style={styles.op}>
                  OP
                </Text>
              </TouchableOpacity>
            )}
            <Text size="subhead" type="insignificant">
              {' '}
              &bull; <TimeAgo time={datetime} />
            </Text>
          </View>
        )}
        <HTMLView html={content} />
      </Animated.View>
    </Pressable>
  );
}
