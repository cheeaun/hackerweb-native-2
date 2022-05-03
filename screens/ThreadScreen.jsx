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

import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';

import * as Haptics from 'expo-haptics';

import Button from '../components/Button';
import Comment from '../components/Comment';
import PrettyURL from '../components/PrettyURL';
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
  const color = PlatformColor('systemGray2');
  return (
    <Svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      strokeLinecap="round"
      color={color}
    >
      <Path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        d="M4 1V11M1 8 4 11 7 8"
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
  const { storyID, commentID } = route.params;
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
  const [tabView, setTabView] = useState('thread');
  const tabValues = ['Thread', 'Share as Image'];

  const scrollViewRef = useRef();
  useEffect(() => {
    if (tabView === 'thread') {
      toggleShowStory(true);
      setCommentsLimit(parentCommentsCount);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd();
      }, 500);
    }
  }, [storyID, tabView]);

  const threadRef = useRef();
  const [loadingShare, setLoadingShare] = useState(false);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [showStory, commentsLimit, loadingShare]);

  return (
    <>
      <ScrollView
        ref={scrollViewRef}
        removeClippedSubviews
        contentInsetAdjustmentBehavior="automatic"
        scrollIndicatorInsets={{ top: -1 }}
        centerContent
      >
        <View
          ref={threadRef}
          pointerEvents={tabView === 'thread' ? 'auto' : 'none'}
          style={{
            backgroundColor: colors.background,
            marginHorizontal: 15,
            marginTop: 1,
            marginBottom: 1,
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {showStory && (
            <View style={[styles.storyInfo]}>
              <Text size="title3" bolder>
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
          {showStory && !!slicedComments?.length && <Separator />}
          {slicedComments.map((comment, i) => (
            <View key={comment.id}>
              {i > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingLeft: 20,
                    marginTop: -16,
                    marginBottom: -8,
                  }}
                >
                  <CommentArrow />
                  <Separator style={{ marginLeft: 8, flexGrow: 1 }} />
                </View>
              )}
              <View
                style={{
                  margin: 15,
                  opacity: i < slicedComments.length - 1 ? 0.8 : 1,
                }}
              >
                <Comment
                  item={comment}
                  storyID={storyID}
                  disableViewThread
                  insignificant={i < slicedComments.length - 1}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <SafeAreaView>
        <View
          style={{
            paddingVertical: 8,
            paddingHorizontal: 15,
          }}
        >
          <SegmentedControl
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
                <Separator />
                <TableItem>
                  <Text>Parent Comments</Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Text bold>
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
                          loadingShare || commentsLimit >= parentCommentsCount
                        }
                        onPress={() => {
                          setCommentsLimit(
                            Math.min(parentCommentsCount, commentsLimit + 1),
                          );
                        }}
                      >
                        <Text bolder>+</Text>
                      </Button>
                    </View>
                  </View>
                </TableItem>
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
                onPress={async () => {
                  try {
                    setLoadingShare(true);
                    const result = await captureRef(threadRef);
                    console.log(result);
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
                  Share
                </Text>
                <ActivityIndicator
                  color={colors.white}
                  animating={loadingShare}
                />
              </Button>
            </>
          )}
        </View>
      </SafeAreaView>
    </>
  );
}
