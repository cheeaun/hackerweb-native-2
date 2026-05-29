import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Link } from 'expo-router';

import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';

import useStore from '../hooks/useStore';
import useTheme from '../hooks/useTheme';

import openBrowser from '../utils/openBrowser';
import openShare from '../utils/openShare';
import shortenNumber from '../utils/shortenNumber';
import { isHTTPLink } from '../utils/url';

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
  const pressTimer = useRef(null);
  const pressTimer2 = useRef(null);

  if (!story) {
    console.warn(`Story not found: ${id} (${position})`);
    return null;
  }

  const shortCommentsCount = shortenNumber(comments_count);

  const handleTouchStart = () => {
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => setPressed(true), 130);
  };

  const handleTouchEnd = () => {
    clearTimeout(pressTimer.current);
    setPressed(false);
  };

  const handleTouchStart2 = () => {
    clearTimeout(pressTimer2.current);
    pressTimer2.current = setTimeout(() => setPressed2(true), 130);
  };

  const handleTouchEnd2 = () => {
    clearTimeout(pressTimer2.current);
    setPressed2(false);
  };

  const shareHandler = useCallback(() => {
    const shareUrl = httpLink
      ? url
      : `https://news.ycombinator.com/item?id=${id}`;
    openShare({ url: shareUrl });
  }, [httpLink, url, id]);

  useEffect(() => {
    return () => {
      clearTimeout(pressTimer.current);
      clearTimeout(pressTimer2.current);
    };
  }, []);

  const storyInfoContent = (
    <>
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
        httpLink && <PrettyURL url={url} size="footnote" numberOfLines={1} />
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
    </>
  );

  const positionView = (
    <View style={styles.storyPosition}>
      <Text
        type="insignificant"
        style={styles.storyPositionNumber}
        allowFontScaling={false}
      >
        {position}
      </Text>
    </View>
  );

  if (isJob) {
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
            openBrowser(url);
          }
        }}
        onLongPress={() => {
          if (httpLink) {
            Haptics.selectionAsync();
            openShare({ url });
          }
        }}
      >
        <View
          style={[
            styles.story,
            pressed && {
              backgroundColor: colors.secondaryBackground,
            },
          ]}
        >
          {positionView}
          <View style={[styles.storyInfo, styles.flex]}>
            {storyInfoContent}
          </View>
        </View>
      </Pressable>
    );
  }

  if (httpLink) {
    return (
      <View
        style={[
          styles.story,
          (pressed || pressed2) && {
            backgroundColor: colors.secondaryBackground,
          },
        ]}
      >
        {positionView}
        <View style={styles.flex}>
          <Link href={`/story/${id}?tab=web`} push>
            <Link.Trigger>
              <View
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                style={styles.storyInfo}
              >
                {storyInfoContent}
              </View>
            </Link.Trigger>
            <Link.Preview />
            <Link.Menu>
              <Link.MenuAction
                icon="square.and.arrow.up"
                onPress={shareHandler}
              >
                Share&hellip;
              </Link.MenuAction>
            </Link.Menu>
          </Link>
        </View>
        <Link href={`/story/${id}?tab=comments`} push>
          <Link.Trigger>
            <View
              onTouchStart={() => {
                fetchStory(id);
                handleTouchStart2();
              }}
              onTouchEnd={handleTouchEnd2}
              onTouchCancel={handleTouchEnd2}
              style={StyleSheet.flatten([
                styles.storyComments,
                pressed2 && { opacity: 0.5 },
              ])}
            >
              <SymbolView name="bubble" size={22} weight="medium" />
              {comments_count > 0 && (
                <Text
                  style={{
                    alignSelf: 'stretch',
                    marginTop: 8,
                    textAlign:
                      shortCommentsCount.length > 2 ? 'right' : 'center',
                  }}
                  type="insignificant"
                  size={shortCommentsCount.length > 2 ? 'caption2' : 'footnote'}
                >
                  {shortenNumber(comments_count)}
                </Text>
              )}
            </View>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction icon="square.and.arrow.up" onPress={shareHandler}>
              Share story&hellip;
            </Link.MenuAction>
          </Link.Menu>
        </Link>
      </View>
    );
  }

  return (
    <View style={styles.story}>
      {positionView}
      <View style={styles.flex}>
        <Link href={`/story/${id}?tab=comments`} push>
          <Link.Trigger>
            <View
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              style={StyleSheet.flatten([
                styles.storyInfo,
                pressed && { backgroundColor: colors.secondaryBackground },
              ])}
            >
              {storyInfoContent}
            </View>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction icon="square.and.arrow.up" onPress={shareHandler}>
              Share story&hellip;
            </Link.MenuAction>
          </Link.Menu>
        </Link>
      </View>
    </View>
  );
}
