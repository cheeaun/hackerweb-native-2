import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  PlatformColor,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { useLayout } from '@react-native-community/hooks';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';

import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import Button from '../components/Button';
import Comment from '../components/Comment';
import PrettyURL from '../components/PrettyURL';
import ReadableWidthContainer from '../components/ReadableWidthContainer';
import Separator from '../components/Separator';
import Text from '../components/Text';
import TimeAgo from '../components/TimeAgo';

import useTheme from '../hooks/useTheme';

import extractThread from '../utils/extractThread';
import openShare from '../utils/openShare';
import { isHTTPLink } from '../utils/url';

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
  comment: {
    padding: 15,
  },
});

function CommentArrow() {
  const color = PlatformColor('systemGray');
  return (
    <Svg
      width="10"
      height="14"
      viewBox="0 0 10 14"
      strokeLinecap="round"
      color={color}
    >
      <Path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        d="M5 1V13M1 9 5 13 9 9"
      />
    </Svg>
  );
}

function TableItem(props) {
  return (
    <View
      {...props}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
      }}
    />
  );
}

export default function ThreadScreen() {
  const { isDark, colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { storyID, commentID, tab = 'thread' } = route.params;
  if (!storyID || !commentID) return null;

  const thread = extractThread(storyID, commentID);

  const [story, ...comments] = thread;
  const parentCommentsCount = comments.length - 1;

  const [commentsLimit, setCommentsLimit] = useState(parentCommentsCount || 0);
  const [showStory, toggleShowStory] = useReducer(
    (state, value) => (value === null ? !state : value),
    true,
  );

  const { title, url, points, user, time } = story;
  const datetime = new Date(time * 1000);
  const httpLink = isHTTPLink(url);

  const slicedComments = useMemo(() => {
    return comments.slice(-(commentsLimit + 1));
  }, [comments.length, commentsLimit]);

  const tabViews = ['thread', 'share'];
  const [tabView, setTabView] = useState(tab);
  const tabValues = [
    `Thread ${comments.length > 1 ? `(${comments.length})` : ''}`,
    'Share as Image',
  ];

  const scrollViewRef = useRef();
  useEffect(() => {
    switch (tabView) {
      case 'share': {
        toggleShowStory(false);
        setCommentsLimit(0);
        break;
      }
      default: {
        // thread
        toggleShowStory(true);
        setCommentsLimit(parentCommentsCount);
        setTimeout(() => {
          scrollViewRef.current?.flashScrollIndicators();
          scrollViewRef.current?.scrollToEnd();
        }, 600);
      }
    }
  }, [storyID, tabView]);

  const threadRef = useRef();
  const [loadingShare, setLoadingShare] = useState(false);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [loadingShare]);

  const { onLayout: onScrollViewLayout, height: scrollViewHeight } =
    useLayout();
  const { onLayout, height } = useLayout();

  const spacing = 30;
  useEffect(() => {
    if (tabView === 'share') {
      const wholeHeight = height + spacing;
      const scale =
        wholeHeight > scrollViewHeight ? scrollViewHeight / wholeHeight : 1;
      // console.log({ height, scrollViewHeight, scale });

      threadRef.current?.setNativeProps({
        style: {
          transform: [{ scale }],
        },
      });

      // scroll to middle
      scrollViewRef.current?.scrollTo({
        x: 0,
        y: (wholeHeight - wholeHeight * scale) / 2,
        animated: false,
      });
    } else {
      threadRef.current?.setNativeProps({
        style: {
          transform: [{ scale: 1 }],
        },
      });
    }
  }, [tabView, Math.round(scrollViewHeight), Math.round(height)]);

  const lastComment = comments[comments.length - 1];

  return (
    <>
      <ScrollView
        ref={scrollViewRef}
        removeClippedSubviews
        contentInsetAdjustmentBehavior="automatic"
        scrollIndicatorInsets={{ top: -1 }}
        centerContent
        scrollEnabled={tabView === 'thread'}
        onLayout={onScrollViewLayout}
      >
        <ReadableWidthContainer>
          <View
            ref={threadRef}
            pointerEvents={tabView === 'thread' ? 'auto' : 'none'}
            style={{
              backgroundColor: colors.background,
              margin: spacing / 2,
              borderRadius: tabView === 'thread' ? 16 : 0,
              overflow: 'hidden',
              borderColor: colors.separator,
              borderWidth: 1,
            }}
            onLayout={onLayout}
          >
            {showStory && (
              <View style={[styles.storyInfo]}>
                <Text size="title2" bolder>
                  {title}
                </Text>
                {httpLink && (
                  <View style={{ marginTop: 4 }}>
                    <PrettyURL
                      url={url}
                      size="subhead"
                      prominent
                      numberOfLines={2}
                      ellipsizeMode="middle"
                    />
                  </View>
                )}
                <View style={styles.storyMetadata}>
                  <Text>
                    <Text type="insignificant" size="subhead">
                      {points?.toLocaleString('en-US')} point
                      {points != 1 && 's'}{' '}
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
                      &bull; <TimeAgo time={datetime} />
                    </Text>
                  </Text>
                </View>
              </View>
            )}
            {showStory && !!slicedComments?.length && (
              <Separator style={{ height: 1 }} />
            )}
            {slicedComments.map((comment, i) => (
              <View key={comment.id}>
                {i > 0 && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingLeft: 20,
                      marginVertical: -7,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <CommentArrow />
                    <Separator
                      style={{ marginLeft: 16, flexGrow: 1, height: 1 }}
                    />
                  </View>
                )}
                <View
                  style={{
                    padding: 15,
                    paddingBottom: 8,
                    opacity: i < commentsLimit ? 0.85 : 1,
                  }}
                >
                  <Comment
                    item={comment}
                    storyID={storyID}
                    disableViewThread
                    significant={i === slicedComments.length - 1}
                  />
                </View>
              </View>
            ))}
          </View>
        </ReadableWidthContainer>
      </ScrollView>
      <SafeAreaView>
        <View
          style={{
            paddingVertical: 8,
            paddingHorizontal: 15,
            borderColor: colors.separator,
            borderTopWidth: StyleSheet.hairlineWidth,
          }}
        >
          <ReadableWidthContainer>
            <SegmentedControl
              disabled={loadingShare}
              style={{ marginHorizontal: 15, marginTop: 8 }}
              appearance={isDark ? 'dark' : 'light'}
              values={tabValues}
              selectedIndex={tabViews.findIndex((v) => v === tabView)}
              onChange={(e) => {
                Haptics.selectionAsync();
                const index = e.nativeEvent.selectedSegmentIndex;
                const tab = tabViews[index].toLowerCase();

                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut,
                );
                setTabView(tab);
              }}
            />
            {tabView === 'share' && (
              <>
                <View style={{ marginVertical: 8 }}>
                  <TableItem>
                    <Text>Show Story</Text>
                    <Switch
                      disable={loadingShare}
                      value={showStory}
                      onValueChange={() => {
                        toggleShowStory(!showStory);
                      }}
                    />
                  </TableItem>
                  {parentCommentsCount > 0 && (
                    <>
                      <Separator />
                      <TableItem>
                        <Text style={{ flexGrow: 1 }}>Parent Comments</Text>
                        <Text bold fontVariant={['tabular-nums']}>
                          {' '}
                          {commentsLimit}
                          {'   '}
                        </Text>
                        <View
                          style={{
                            backgroundColor: colors.opaqueBackground2,
                            flexDirection: 'row',
                            borderRadius: 8,
                            overflow: 'hidden',
                          }}
                        >
                          <Button
                            style={{
                              paddingHorizontal: 20,
                              paddingVertical: 8,
                              borderRadius: 0,
                            }}
                            pressedStyle={{
                              backgroundColor: colors.opaqueBackground2,
                            }}
                            disabled={loadingShare || commentsLimit === 0}
                            onPress={() => {
                              setCommentsLimit(Math.max(0, commentsLimit - 1));
                            }}
                          >
                            <Text bolder>−</Text>
                          </Button>
                          <Separator
                            vertical
                            style={{
                              marginVertical: 8,
                            }}
                          />
                          <Button
                            style={{
                              paddingHorizontal: 20,
                              paddingVertical: 8,
                              borderRadius: 0,
                            }}
                            pressedStyle={{
                              backgroundColor: colors.opaqueBackground2,
                            }}
                            disabled={
                              loadingShare ||
                              commentsLimit >= parentCommentsCount
                            }
                            onPress={() => {
                              setCommentsLimit(
                                Math.min(
                                  parentCommentsCount,
                                  commentsLimit + 1,
                                ),
                              );
                            }}
                          >
                            <Text bolder>+</Text>
                          </Button>
                        </View>
                      </TableItem>
                    </>
                  )}
                  <Text type="insignificant" size="caption2" center>
                    Comment's URL will be copied to clipboard when sharing
                  </Text>
                </View>
                <Button
                  style={{
                    backgroundColor: colors.primary,
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}
                  pressedStyle={{
                    opacity: 0.75,
                  }}
                  disabled={loadingShare}
                  onPress={async () => {
                    try {
                      setLoadingShare(true);
                      const result = await captureRef(threadRef);
                      console.log(result);
                      // "context" link can work for HN stories with multi-page comments
                      await Clipboard.setUrlAsync(
                        `https://news.ycombinator.com/context?id=${lastComment.id}`,
                      );
                      await openShare({ url: result });
                    } catch (e) {
                      Alert('Error', 'Something went wrong.');
                    } finally {
                      setLoadingShare(false);
                    }
                  }}
                >
                  <Text
                    size="title3"
                    bolder
                    center
                    style={{
                      color: colors.white,
                      flexGrow: 1,
                      marginLeft: 24,
                    }}
                  >
                    Share…
                  </Text>
                  <ActivityIndicator
                    color={colors.white}
                    animating={loadingShare}
                  />
                </Button>
              </>
            )}
          </ReadableWidthContainer>
        </View>
      </SafeAreaView>
    </>
  );
}
