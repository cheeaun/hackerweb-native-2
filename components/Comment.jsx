import React, { useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  Pressable,
  ActionSheetIOS,
  Animated,
  findNodeHandle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { TouchableOpacity } from 'react-native-gesture-handler';
import format from 'date-fns/format';

import Text from './Text';
import HTMLView2 from './HTMLView2';
import TimeAgo from './TimeAgo';

import useStore from '../hooks/useStore';
import useTheme from '../hooks/useTheme';

import openBrowser from '../utils/openBrowser';
import openShare from '../utils/openShare';

const styles = StyleSheet.create({
  metadata: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
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
  const { id, user, time, content, deleted, dead, comments } = item;
  const datetime = new Date(time * 1000);
  const currentOP = useStore((state) => state.currentOP);
  if (dead || (deleted && !comments.length)) return null;
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

  const commentRef = useRef();

  const commentActionOptions = __DEV__
    ? [
        'View profile',
        'View comment on HN web site',
        'Share comment…',
        'DEV: View HTML',
        'Cancel',
      ]
    : [
        'View profile',
        'View comment on HN web site',
        'Share comment…',
        'Cancel',
      ];

  return (
    <Pressable
      ref={commentRef}
      onLongPress={() => {
        bobble();
        Haptics.selectionAsync();
        ActionSheetIOS.showActionSheetWithOptions(
          {
            title: `Comment by ${user}`,
            message: format(datetime, 'EEEE, d LLLL yyyy, h:mm a'),
            options: commentActionOptions,
            cancelButtonIndex: commentActionOptions.findIndex(
              (o) => o.toLowerCase() === 'cancel',
            ),
            anchor: findNodeHandle(commentRef.current),
          },
          (index) => {
            if (commentActionOptions[index].toLowerCase() === 'cancel') {
              return;
            }
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
              case 3:
                Alert.alert('Comment HTML', content);
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
              style={{ color: colors.red, flexShrink: 1 }}
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
                    'What does OP mean?',
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
        <HTMLView2 html={content} />
      </Animated.View>
    </Pressable>
  );
}
