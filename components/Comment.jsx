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
import useViewport from '../hooks/useViewport';

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

export default function Comment({
  item,
  storyID,
  disableViewThread,
  significant,
}) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { exceedsReadableWidth } = useViewport();
  const { id, user, time, content, deleted, dead, comments } = item;
  const datetime = new Date(time * 1000);
  const currentOP = useStore(
    useCallback(
      (state) =>
        state.stories.find((s) => {
          return s.id === storyID;
        })?.user,
      [storyID],
    ),
  );
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
      text: 'Upvote comment on HN',
      action: () => {
        navigation.push('WebViewModal', {
          url: `https://news.ycombinator.com/vote?id=${id}&how=up&goto=${encodeURIComponent(
            `item?id=${id}`,
          )}`,
          // Once logged in, Vote URL won't work anymore
          injectedJavaScript: `
            try {
              document.getElementById('up_${id}').click();
            } catch (e) {}
            true; // note: this is required, or you'll sometimes get silent failures
          `,
        });
      },
    },
    settingsInteractions && {
      text: 'View or Reply comment on HN',
      action: () => {
        navigation.push('WebViewModal', {
          url: `https://news.ycombinator.com/reply?id=${id}&goto=${encodeURIComponent(
            `item?id=${id}`,
          )}`,
        });
      },
    },
    !disableViewThread && {
      text: "View comment's thread",
      action: () => {
        navigation.push('ThreadModal', {
          storyID,
          commentID: id,
        });
      },
    },
    !disableViewThread && {
      text: 'Share as Image…',
      action: () => {
        navigation.push('ThreadModal', {
          storyID,
          commentID: id,
          tab: 'share',
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
      text: '🚧 View HTML',
      action: () => {
        Alert.alert('Comment HTML', content);
      },
    },
    {
      text: 'Cancel',
      cancel: true,
    },
  ].filter(Boolean);

  const showActionSheet = useCallback(() => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: `Comment by ${user}`,
        message: `${format(datetime, 'EEEE, d LLLL yyyy, h:mm a')}\n${hnURL}`,
        options: options.map((o) => o.text),
        cancelButtonIndex: options.findIndex((o) => o.cancel),
        anchor: exceedsReadableWidth
          ? findNodeHandle(commentRef.current)
          : undefined,
      },
      (index) => {
        options[index].action?.();
      },
    );
  }, [options, user, datetime, hnURL]);

  return (
    <Pressable
      ref={commentRef}
      onLongPress={() => {
        bobble();
        Haptics.selectionAsync();
        showActionSheet();
      }}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {!deleted && (
          <View style={styles.metadata}>
            <Text
              size={significant ? 'body' : 'subhead'}
              bold={!significant}
              bolder={significant}
              style={{
                color: colors.red,
                flexShrink: 1,
              }}
              numberOfLines={1}
              onPress={() => {
                navigation.push('User', user);
              }}
            >
              {user}
            </Text>
            {user === currentOP && (
              <TouchableOpacity
                style={[
                  styles.opBox,
                  {
                    backgroundColor: colors.red,
                  },
                ]}
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
                <Text
                  size={significant ? 'footnote' : 'caption2'}
                  style={styles.op}
                >
                  OP
                </Text>
              </TouchableOpacity>
            )}
            <Text size={significant ? 'body' : 'subhead'} type="insignificant">
              {' '}
              &bull;{' '}
              <Text
                size={significant ? 'body' : 'subhead'}
                type="insignificant"
                onPress={showActionSheet}
              >
                <TimeAgo time={datetime} />
              </Text>
            </Text>
          </View>
        )}
        <HTMLView2 html={content} fontSize={significant ? 17 : undefined} />
      </Animated.View>
    </Pressable>
  );
}
