import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import Text from './Text';
import PrettyURL from './PrettyURL';
import TimeAgo from './TimeAgo';

import openBrowser from '../utils/openBrowser';
import openShare from '../utils/openShare';
import { isHTTPLink } from '../utils/url';

import useStore from '../hooks/useStore';
import useTheme from '../hooks/useTheme';

import CommentIcon from '../assets/bubble.left.svg';

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
    padding: 16,
  },
  // storyDisclosure: {
  //   paddingVertical: 15,
  //   paddingRight: 15,
  //   paddingLeft: 5,
  // },
  storyMetadataWrap: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    marginTop: 4,
  },
  commentIcon: {
    width: 20,
    height: 19,
    marginHorizontal: 2,
    marginTop: 3,
    marginBottom: 2,
  },
  disclosureIcon: {
    width: 8,
    height: 13,
    marginLeft: 2,
    marginTop: 1,
  },
});

export default function StoryItem({ id, position }) {
  if (!id) return null;

  const { colors } = useTheme();

  const navigation = useNavigation();

  const story = useStore(
    useCallback((state) => state.stories.find((s) => s.id === id) || {}, [id]),
  );

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

  return (
    <Pressable
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
          <Text type="insignificant" style={styles.storyPositionNumber}>
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
                    &middot; <TimeAgo time={datetime} />
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
                {points} point{points != 1 && 's'}{' '}
              </Text>
              <Text type="insignificant" size="footnote">
                by {user} &middot; <TimeAgo time={datetime} />
                {comments_count > 0 && <> &middot; </>}
              </Text>
              {comments_count > 0 && (
                <Text type="insignificant" size="footnote">
                  {comments_count.toLocaleString('en-US')} comment
                  {comments_count != 1 && 's'}
                </Text>
              )}
            </View>
          )}
        </View>
        {!isJob && httpLink && (
          <Pressable
            onPressIn={() => {
              setPressed2(true);
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
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}
