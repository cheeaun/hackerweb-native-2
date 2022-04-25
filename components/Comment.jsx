import { useCallback, useRef } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  View,
  findNodeHandle,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import * as Haptics from 'expo-haptics';

import format from 'date-fns/format';

import useStore from '../hooks/useStore';
import useTheme from '../hooks/useTheme';

import openBrowser from '../utils/openBrowser';
import openShare from '../utils/openShare';

import HTMLView2 from './HTMLView2';
import Text from './Text';
import TimeAgo from './TimeAgo';

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

export default function Comment({ item }) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { id, user, time, content, deleted, dead, comments } = item;
  const datetime = new Date(time * 1000);
  const currentOP = useStore((state) => state.currentOP);
  const settingsInteractions = useStore((state) => state.settings.interactions);

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

  const options = [
    {
      text: 'View profile',
      action: () => {
        navigation.push('User', user);
      },
    },
    !settingsInteractions && {
      text: 'View comment on HN web site',
      action: () => {
        openBrowser(hnURL);
      },
    },
    settingsInteractions && {
      text: 'Upvote',
      action: () => {
        navigation.push('WebViewModal', {
          url: `https://news.ycombinator.com/vote?id=${id}&how=up&goto=${encodeURIComponent(
            `item?id=${id}`,
          )}`,
        });
      },
    },
    settingsInteractions && {
      text: 'Reply',
      action: () => {
        navigation.push('WebViewModal', {
          url: `https://news.ycombinator.com/reply?id=${id}&goto=${encodeURIComponent(
            `item?id=${id}`,
          )}`,
        });
      },
    },
    {
      text: 'Share comment…',
      action: () => {
        openShare({ url: hnURL });
      },
    },
    __DEV__ && {
      text: 'DEV: View HTML',
      action: () => {
        Alert.alert('Comment HTML', content);
      },
    },
    {
      text: 'Cancel',
      cancel: true,
    },
  ].filter(Boolean);

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
            options: options.map((o) => o.text),
            cancelButtonIndex: options.findIndex((o) => o.cancel),
            anchor: findNodeHandle(commentRef.current),
          },
          (index) => {
            options[index].action?.();
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
