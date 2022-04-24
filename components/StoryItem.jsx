import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import useStore from '../hooks/useStore';
import useTheme from '../hooks/useTheme';

import openBrowser from '../utils/openBrowser';
import openShare from '../utils/openShare';
import shortenNumber from '../utils/shortenNumber';
import { isHTTPLink } from '../utils/url';

import CommentIcon from '../assets/bubble.left.svg';

import PrettyURL from './PrettyURL';
import Text from './Text';
import TimeAgo from './TimeAgo';

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  story: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  storyPosition: {
    paddingTop: 12,
    paddingLeft: 15,
  },
  storyPositionNumber: {
    width: 22,
    textAlign: 'center',
  },
  storyInfo: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    flex: 1,
  },
  storyComments: {
    padding: 15,
    alignItems: 'flex-end',
  },
  storyDisclosure: {
    padding: 15,
    paddingLeft: 8,
  },
  storyMetadataWrap: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    marginTop: 4,
  },
});

export default function StoryItem({ id, position }) {
  if (!id) return null;

  const { colors } = useTheme();

  const navigation = useNavigation();

  const story = useStore(
    useCallback((state) => state.stories.find((s) => s.id === id) || {}, [id]),
  );
  const fetchStory = useStore((state) => state.fetchStory);

  const { title, points, user, time, comments_count, type, url } = story;
  const datetime = new Date(time * 1000);

  const visited = useStore(useCallback((state) => state.visited(url), [url]));

  const httpLink = isHTTPLink(url);
  const isJob = type === 'job';
  const [pressed, setPressed] = useState(false);
  const [pressed2, setPressed2] = useState(false);

  if (!story) {
    console.warn(`Story not found: ${id} (${position})`);
    return null;
  }

  const shortCommentsCount = shortenNumber(comments_count);

  return (
    <Pressable
      unstable_pressDelay={130}
      onPressIn={() => {
        setPressed(true);
      }}
      onPressOut={() => {
        setPressed(false);
      }}
      onPress={() => {
        if (httpLink) {
          if (isJob) {
            openBrowser(url);
          } else {
            navigation.push('Story', { id, tab: 'web' });
          }
        } else {
          navigation.push('Story', { id, tab: 'comments' });
        }
      }}
      onLongPress={() => {
        if (httpLink) openShare({ url });
      }}
    >
      <View
        style={[
          styles.story,
          (pressed || pressed2) && {
            backgroundColor: colors.secondaryBackground,
          },
        ]}
      >
        <View style={styles.storyPosition}>
          <Text
            type="insignificant"
            style={styles.storyPositionNumber}
            allowFontScaling={false}
          >
            {position}
          </Text>
        </View>
        <View style={styles.storyInfo}>
          <Text type={visited && 'insignificant'}>{title}</Text>
          {isJob ? (
            httpLink ? (
              <Text>
                <PrettyURL url={url} size="footnote" domainOnly />
                {isJob && (
                  <Text type="insignificant" size="footnote">
                    {' '}
                    &bull; <TimeAgo time={datetime} />
                  </Text>
                )}
              </Text>
            ) : (
              <Text type="insignificant" size="footnote">
                <TimeAgo time={datetime} />
              </Text>
            )
          ) : (
            httpLink && (
              <PrettyURL url={url} size="footnote" numberOfLines={1} />
            )
          )}
          {!isJob && (
            <View style={styles.storyMetadataWrap}>
              <Text type="insignificant" size="footnote">
                {shortenNumber(points)} point{points != 1 && 's'}{' '}
              </Text>
              <Text type="insignificant" size="footnote">
                by {user} &bull; <TimeAgo time={datetime} />
              </Text>
            </View>
          )}
        </View>
        {!isJob && (
          <Pressable
            unstable_pressDelay={130}
            disabled={!httpLink}
            onPressIn={() => {
              setPressed2(true);
              fetchStory(id);
            }}
            onPressOut={() => {
              setPressed2(false);
            }}
            onPress={() => {
              navigation.push('Story', { id, tab: 'comments' });
            }}
            style={[styles.storyComments, pressed2 && { opacity: 0.5 }]}
          >
            <CommentIcon width={18} height={18} color={colors.primary} />
            {comments_count > 0 && (
              <Text
                style={{
                  alignSelf: 'stretch',
                  marginTop: 8,
                  textAlign: shortCommentsCount.length > 2 ? 'right' : 'center',
                }}
                type="insignificant"
                size={shortCommentsCount.length > 2 ? 'caption2' : 'footnote'}
              >
                {shortenNumber(comments_count)}
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}
