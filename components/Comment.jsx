import { useCallback } from 'react';
import { Alert, StyleSheet, View, useWindowDimensions } from 'react-native';

import {
  ContextMenu,
  Button,
  Divider,
  Host,
  RNHostView,
} from '@expo/ui/swift-ui';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native-gesture-handler';

import * as Haptics from 'expo-haptics';

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

export default function Comment({
  item,
  storyID,
  disableViewThread,
  significant,
}) {
  const router = useRouter();
  const { colors } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const { id, user, time, content, deleted, dead, comments } = item;
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

  const commentContent = (
    <View>
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
              router.push(`/user/${user}`);
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
            <Text size={significant ? 'body' : 'subhead'} type="insignificant">
              <TimeAgo time={new Date(time * 1000)} />
            </Text>
          </Text>
        </View>
      )}
      <HTMLView2 html={content} fontSize={significant ? 17 : undefined} />
    </View>
  );

  return (
    <Host matchContents>
      <ContextMenu>
        <ContextMenu.Trigger>
          <RNHostView matchContents>{commentContent}</RNHostView>
        </ContextMenu.Trigger>
        <ContextMenu.Preview>
          <RNHostView matchContents>
            <View
              style={{
                padding: 15,
                maxHeight: Math.max(100, windowHeight * 0.33),
              }}
            >
              {commentContent}
            </View>
          </RNHostView>
        </ContextMenu.Preview>
        <ContextMenu.Items>
          <Button
            label="View profile"
            systemImage="person"
            onPress={() => router.push(`/user/${user}`)}
          />
          <Divider />
          {!settingsInteractions && (
            <Button
              label="View comment on HN web site"
              systemImage="safari"
              onPress={() => openBrowser(hnURL)}
            />
          )}
          {settingsInteractions && (
            <Button
              label="Upvote comment on HN"
              systemImage="arrowtriangle.up.fill"
              onPress={() => {
                Haptics.selectionAsync();
                const jsKey = `web-view-${Date.now()}`;
                useStore.getState().setRouteInjectedJS(
                  jsKey,
                  `
                  try {
                    document.getElementById('up_${id}').click();
                  } catch (e) {}
                  true;
                `,
                );
                router.push({
                  pathname: '/web-view',
                  params: { url: hnURL, jsKey },
                });
              }}
            />
          )}
          {settingsInteractions && (
            <Button
              label="View or Reply comment on HN"
              systemImage="arrowshape.turn.up.left"
              onPress={() =>
                router.push({
                  pathname: '/web-view',
                  params: {
                    url: `https://news.ycombinator.com/reply?id=${id}&goto=${encodeURIComponent(
                      `item?id=${id}`,
                    )}`,
                  },
                })
              }
            />
          )}
          <Divider />
          {!disableViewThread && (
            <Button
              label="View comment's thread"
              systemImage="text.bubble"
              onPress={() => router.push(`/thread/${storyID}/${id}`)}
            />
          )}
          {!disableViewThread && (
            <Button
              label="Share as Image…"
              systemImage="photo"
              onPress={() => router.push(`/thread/${storyID}/${id}?tab=share`)}
            />
          )}
          <Button
            label="Share comment…"
            systemImage="square.and.arrow.up"
            onPress={() => openShare({ url: hnURL })}
          />
          {__DEV__ && <Divider />}
          {__DEV__ && (
            <Button
              label="View HTML"
              systemImage="chevron.left.forwardslash.chevron.right"
              onPress={() => Alert.alert('Comment HTML', content)}
            />
          )}
        </ContextMenu.Items>
      </ContextMenu>
    </Host>
  );
}
