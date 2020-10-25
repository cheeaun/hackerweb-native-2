import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  LayoutAnimation,
  ActionSheetIOS,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import Text from '../components/Text';
import Separator from '../components/Separator';
import PrettyURL from '../components/PrettyURL';
import HTMLView from '../components/HTMLView';
import TouchableOpacity from '../components/TouchableOpacity';
import TouchableHighlight from '../components/TouchableHighlight';
import CommentContainer from '../components/CommentContainer';
import TimeAgo from '../components/TimeAgo';
import ListEmpty from '../components/ListEmpty';
import OuterSpacer from '../components/OuterSpacer';

import openBrowser from '../utils/openBrowser';
import openShare from '../utils/openShare';

import useStore from '../hooks/useStore';
import useTheme from '../hooks/useTheme';

import ShareIcon from '../assets/square.and.arrow.up.svg';

const styles = StyleSheet.create({
  storyInfo: {
    paddingTop: 10,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  content: {
    padding: 15,
    paddingTop: 0,
  },
  storyMetadata: {
    marginTop: 8,
  },
});

const renderItem = ({ item }) => <CommentContainer item={item} />;

export default function StoryScreen({ route, navigation }) {
  const { colors } = useTheme();

  const id = route.params;

  const story = useStore(
    useCallback((state) => state.stories.find((s) => s.id === id) || {}, [id]),
  );
  const fetchStory = useStore((state) => state.fetchStory);
  const [storyLoading, setStoryLoading] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let ignore = false;
      setStoryLoading(true);
      fetchStory(id).finally(() => {
        if (ignore) return;
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setStoryLoading(false);
      });
      return () => {
        ignore = true;
      };
    }, []),
  );

  const {
    title,
    points,
    user,
    time,
    comments_count,
    url,
    content,
    comments = [],
    type,
  } = story;
  const datetime = new Date(time * 1000);

  const addLink = useStore((state) => state.addLink);

  const setCurrentOP = useStore((state) => state.setCurrentOP);
  useEffect(() => {
    setCurrentOP(story.user);
  }, [story.user]);

  const externalLink = !/^item/i.test(url);
  const isJob = type === 'job';
  const hnURL = `https://news.ycombinator.com/item?id=${id}`;

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            ActionSheetIOS.showActionSheetWithOptions(
              {
                title,
                options: [
                  'View web site',
                  'View on HN web site',
                  'Share…',
                  'Cancel',
                ],
                cancelButtonIndex: 3,
              },
              (index) => {
                if (index === 0) {
                  openBrowser(url);
                } else if (index === 1) {
                  openBrowser(hnURL);
                } else if (index === 2) {
                  openShare({ url: hnURL });
                }
              },
            );
          }}
          onLongPress={() => {
            openShare({ url: hnURL });
          }}
          hitSlop={{
            top: 44,
            right: 44,
            bottom: 44,
            left: 44,
          }}
        >
          <ShareIcon width={20} height={20} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [id]);

  const titleLength = (title || '').length;
  const titleSize =
    titleLength < 50 ? 'title1' : titleLength < 100 ? 'title2' : 'title3';

  const TitleComponent = useMemo(
    () => (
      <Text size={titleSize} bolder>
        {title}
      </Text>
    ),
    [titleSize, title],
  );

  const [headerHeight, setHeaderHeight] = useState(0);

  const ListHeaderComponent = useMemo(
    () => (
      <>
        <View
          style={[styles.storyInfo]}
          onLayout={({ nativeEvent }) =>
            setHeaderHeight(nativeEvent.layout.height)
          }
        >
          {externalLink ? (
            <TouchableHighlight
              onPress={() => {
                openBrowser(url);
                addLink(url);
              }}
              onLongPress={() => {
                openShare({ url });
              }}
            >
              {TitleComponent}
              <View style={{ marginTop: 4 }}>
                <PrettyURL
                  url={url}
                  size="subhead"
                  prominent
                  numberOfLines={2}
                  ellipsizeMode="middle"
                />
              </View>
            </TouchableHighlight>
          ) : (
            TitleComponent
          )}
          <View style={styles.storyMetadata}>
            {isJob ? (
              <Text type="insignificant" size="subhead">
                <TimeAgo time={datetime} />
              </Text>
            ) : (
              <Text>
                <Text type="insignificant" size="subhead">
                  {points} point{points != 1 && 's'}{' '}
                </Text>
                <Text type="insignificant" size="subhead">
                  by{' '}
                  <Text
                    size="subhead"
                    bold
                    style={{ color: colors.red }}
                    onPress={() => {
                      navigation.push('User', user);
                    }}
                  >
                    {user}
                  </Text>{' '}
                  &middot; <TimeAgo time={datetime} />
                </Text>
              </Text>
            )}
          </View>
        </View>
        {!!content && (
          <View style={styles.content}>
            <HTMLView html={content} />
          </View>
        )}
        {comments.length > 0 && (
          <>
            <Separator />
            <OuterSpacer
              style={{
                backgroundColor: colors.opaqueSecondaryBackground,
              }}
              align="bottom"
              size={comments_count > 0 ? 'large' : 'default'}
            >
              <Text
                type="insignificant"
                size="footnote"
                style={{ textTransform: 'uppercase' }}
              >
                {comments_count.toLocaleString()} comment
                {comments_count != 1 && 's'}
              </Text>
            </OuterSpacer>
            <Separator />
          </>
        )}
      </>
    ),
    [story],
  );

  const scrolledDown = useRef(false);

  return (
    <FlatList
      ListHeaderComponent={ListHeaderComponent}
      data={comments}
      renderItem={renderItem}
      ListEmptyComponent={() => (
        <ListEmpty
          state={
            storyLoading
              ? 'loading'
              : !isJob && !comments.length
              ? 'nada'
              : null
          }
          nadaText="No comments yet."
        />
      )}
      keyExtractor={(item) => '' + item.id}
      ItemSeparatorComponent={Separator}
      contentInsetAdjustmentBehavior="automatic"
      onScroll={(e) => {
        const { y } = e.nativeEvent.contentOffset;
        const scrolled = y + 44 > 16;
        if (scrolled && scrolled === scrolledDown.current) return;
        scrolledDown.current = scrolled;
        navigation.setOptions({
          title: scrolled ? title : '',
          headerHideShadow: !scrolled,
          headerStyle: scrolled
            ? {
                backgroundColor: colors.opaqueHeader,
                blurEffect: 'prominent',
              }
            : {
                backgroundColor: colors.background,
              },
        });
      }}
      scrollIndicatorInsets={{
        top: headerHeight,
        right: 0,
        bottom: 0,
        left: 0,
      }}
    />
  );
}
