import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
} from 'react';
import {
  StyleSheet,
  View,
  Linking,
  FlatList,
  LayoutAnimation,
  ActionSheetIOS,
  Animated,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import * as Haptics from 'expo-haptics';
import { URL } from 'react-native-url-polyfill';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';
import { setStatusBarStyle } from 'expo-status-bar';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Text from '../components/Text';
import Separator from '../components/Separator';
import PrettyURL from '../components/PrettyURL';
import HTMLView from '../components/HTMLView';
import TouchableHighlight from '../components/TouchableHighlight';
import CommentContainer from '../components/CommentContainer';
import TimeAgo from '../components/TimeAgo';
import ListEmpty from '../components/ListEmpty';
import OuterSpacer from '../components/OuterSpacer';
import CommentPage from '../components/CommentPage';

import openBrowser from '../utils/openBrowser';
import openShare from '../utils/openShare';
import { isHTTPLink } from '../utils/url';
import repliesCount2MaxWeight from '../utils/repliesCount2MaxWeight';
import shortenNumber from '../utils/shortenNumber';

import useStore from '../hooks/useStore';
import useTheme from '../hooks/useTheme';

import ShareIcon from '../assets/square.and.arrow.up.svg';
import BackIcon from '../assets/chevron.backward.svg';
import MoreIcon from '../assets/ellipsis.circle.svg';

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

function parseURL(url) {
  if (!url) return {};
  const link = new URL(url);
  const domain = link.hostname.replace(/^www\./, '');
  return {
    domain,
  };
}

export default function StoryScreen({ route, navigation }) {
  const { isDark, colors } = useTheme();

  const { id, tab } = route.params;

  const story = useStore(
    useCallback((state) => state.stories.find((s) => s.id === id) || {}, [id]),
  );
  const fetchStory = useStore((state) => state.fetchStory);
  const [storyLoading, setStoryLoading] = useState(false);
  useFocusEffect(
    useCallback(() => {
      console.log('👀 StoryScreen is focused');
      // Fortunately this `comments` key can be used to indicate
      // if this story's comments are already fetched
      if (story.comments) return;
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
    }, [!!story.comments]),
  );

  const {
    title,
    points,
    user,
    time,
    comments_count,
    url,
    content,
    poll,
    comments = [],
    type,
  } = story;
  const datetime = new Date(time * 1000);

  const addLink = useStore((state) => state.addLink);

  const setCurrentOP = useStore((state) => state.setCurrentOP);
  useEffect(() => {
    setCurrentOP(story.user);
  }, [story.user]);

  const httpLink = isHTTPLink(url);
  const isJob = type === 'job';
  const hnURL = `https://news.ycombinator.com/item?id=${id}`;

  useEffect(
    useCallback(() => {
      if (!httpLink) addLink(url);
    }, [httpLink]),
    [],
  );

  const [navState, setNavState] = useState({});
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const [toolbarWidth, setToolbarWidth] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressOpacityAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const webViewRef = useRef(null);

  const webHeaderRight = useCallback(
    () => (
      <TouchableOpacity
        onPress={() => {
          const pageTitle = navState.title || title;
          const pageURL = navState.url || url;
          ActionSheetIOS.showActionSheetWithOptions(
            {
              title: pageTitle + '\n' + pageURL,
              options: ['Reload page', 'Open in browser…', 'Share…', 'Cancel'],
              cancelButtonIndex: 3,
            },
            (index) => {
              if (index === 0) {
                webViewRef.current?.reload();
              } else if (index === 1) {
                Linking.openURL(pageURL);
              } else if (index === 2) {
                openShare({ url: pageURL });
              }
            },
          );
        }}
        hitSlop={{
          top: 44,
          right: 44,
          bottom: 44,
          left: 44,
        }}
      >
        <MoreIcon width={20} height={20} color={colors.primary} />
      </TouchableOpacity>
    ),
    [title, navState.title, url, navState.url, webViewRef.current],
  );

  const commentsHeaderRight = useCallback(
    () => (
      <TouchableOpacity
        onPress={() => {
          ActionSheetIOS.showActionSheetWithOptions(
            {
              title: title + '\n' + hnURL,
              options: ['View on HN web site', 'Share…', 'Cancel'],
              cancelButtonIndex: 2,
            },
            (index) => {
              if (index === 0) {
                openBrowser(hnURL);
              } else if (index === 1) {
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
    [url, hnURL],
  );

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

  const repliesCount = comments.length;

  let maxPollPoints = 0;
  if (!!poll) {
    maxPollPoints = poll.reduce((acc, p) => Math.max(acc, p.points), 0);
  }

  const ListHeaderComponent = useMemo(
    () => (
      <>
        <View style={[styles.storyInfo]}>
          {httpLink ? (
            <TouchableHighlight
              onPress={() => {
                // openBrowser(url);
                Haptics.selectionAsync();
                setTabView('web');
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
                  {points.toLocaleString('en-US')} point{points != 1 && 's'}{' '}
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
            )}
          </View>
        </View>
        {(!!content || !!poll) && (
          <View style={styles.content}>
            {!!content && <HTMLView html={content} />}
            {!!poll &&
              poll.map((p, i) => (
                <View key={i}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                    }}
                  >
                    <Text bold size="subhead" style={{ flexShrink: 1 }}>
                      {p.item}
                    </Text>
                    <Text size="subhead" style={{ marginLeft: 15 }}>
                      {p.points.toLocaleString('en-US')} point
                      {p.points === 0 ? '' : 's'}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: colors.fill,
                      height: 3,
                      marginTop: 3,
                      marginBottom: 8,
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: colors.primary,
                        height: 3,
                        borderRadius: 3,
                        width: (p.points / maxPollPoints) * 100 + '%',
                      }}
                    />
                  </View>
                </View>
              ))}
          </View>
        )}
        {repliesCount > 0 && (
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
                {comments_count.toLocaleString('en-US')} comment
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

  const renderItem = useCallback(
    ({ item, index }) => (
      <>
        {repliesCount >= 15 && (index + 1) % 10 === 0 && (
          <CommentPage page={(index + 1) / 10 + 1} />
        )}
        <CommentContainer
          item={item}
          maxWeight={repliesCount2MaxWeight(repliesCount)}
        />
      </>
    ),
    [repliesCount],
  );

  const ListEmptyComponent = useMemo(
    () => (
      <ListEmpty
        state={
          storyLoading ? 'loading' : !isJob && !comments.length ? 'nada' : null
        }
        nadaText="No comments yet."
      />
    ),
    [storyLoading, isJob, comments.length],
  );

  const keyExtractor = useCallback((item) => '' + item.id, []);

  const tabValues = [
    'Web',
    `${comments_count > 1 ? shortenNumber(comments_count) + ' ' : ''}Comments`,
  ];
  const tabViews = ['web', 'comments'];
  const [tabView, setTabView] = useState(tab);
  useEffect(() => {
    setTabView(tab);
  }, [tab]);

  const [webMounted, setWebMounted] = useState(false);
  useFocusEffect(
    useCallback(() => {
      console.log('🧘‍♀️ StoryScreen focus effect');
      if (tabView === 'web') setWebMounted(true);
      return () => setWebMounted(false);
    }, []),
  );

  const scrolledDown = useRef(false);
  const commentsNavOptions = useRef({
    title: '',
    headerHideShadow: true,
    headerStyle: {
      backgroundColor: colors.background,
    },
  });
  const onScroll = useCallback(
    (e) => {
      if (tabView !== 'comments') return;
      const { y } = e.nativeEvent.contentOffset;
      const scrolled = y + 44 > 16;
      if (scrolled && scrolled === scrolledDown.current) return;
      scrolledDown.current = scrolled;
      const options = {
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
      };
      navigation.setOptions(options);
      commentsNavOptions.current = options;
    },
    [tabView, title],
  );

  useLayoutEffect(() => {
    if (tabView === 'web') {
      navigation.setOptions({
        title: parseURL(navState.url || url).domain || '',
        headerRight: webHeaderRight,
      });
    }
  }, [url, navState]);

  useLayoutEffect(
    useCallback(() => {
      navigation.setOptions(
        tabView === 'web'
          ? {
              title: parseURL(navState.url || url).domain || '',
              headerHideShadow: false,
              headerStyle: {
                backgroundColor: colors.opaqueHeader,
                blurEffect: 'prominent',
              },
              headerRight: webHeaderRight,
            }
          : {
              ...commentsNavOptions.current,
              headerRight: commentsHeaderRight,
            },
      );

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      Animated.timing(fadeAnim, {
        toValue: tabView === 'web' ? 1 : 0,
        duration: isDark ? 300 : 150,
        // Slower for dark mode because non-dark-mode web pages can be quite blinding
        useNativeDriver: true,
      }).start();

      if (tabView === 'web') setWebMounted(true);
    }, [tabView, commentsHeaderRight, isDark]),
    [tabView],
  );

  const insets = useSafeAreaInsets();

  return (
    <>
      <FlatList
        pointerEvents={tabView === 'comments' ? 'auto' : 'none'}
        ListHeaderComponent={ListHeaderComponent}
        data={comments}
        renderItem={renderItem}
        ListEmptyComponent={ListEmptyComponent}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={Separator}
        contentInsetAdjustmentBehavior="automatic"
        onScroll={onScroll}
        removeClippedSubviews
        scrollIndicatorInsets={{
          top: 0,
          right: 0,
          bottom: toolbarHeight,
          left: 0,
        }}
        ListFooterComponent={() => <View style={{ height: toolbarHeight }} />}
        // onViewableItemsChanged={useCallback(({ viewableItems }) => {
        //   const indices = viewableItems.map((item) => item.index);
        //   console.log({ indices });
        // }, [])}
        // viewabilityConfig={{
        //   itemVisiblePercentThreshold: 50,
        // }}
      />
      {httpLink && (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <Animated.View
            pointerEvents={tabView === 'web' ? 'auto' : 'none'}
            style={{
              flex: 1,
              opacity: fadeAnim,
              transform: [
                {
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.98, 1],
                  }),
                },
              ],
            }}
          >
            {webMounted && (
              <WebView
                ref={webViewRef}
                style={{ backgroundColor: colors.background }}
                applicationNameForUserAgent={`${Constants.manifest.name}/${Constants.nativeAppVersion}`}
                source={{ uri: url }}
                originWhitelist={['http://*', 'https://*', 'data:*', 'about:*']}
                decelerationRate="normal"
                allowsInlineMediaPlayback
                contentInsetAdjustmentBehavior="automatic"
                allowsBackForwardNavigationGestures
                renderLoading={() => null}
                onNavigationStateChange={(navState) => {
                  setNavState(navState);
                  // Quick fix: https://github.com/react-native-webview/react-native-webview/issues/735#issuecomment-629073261
                  setStatusBarStyle(isDark ? 'light' : 'dark');
                }}
                onLoadStart={() => {
                  progressAnim.setValue(0);
                  progressOpacityAnim.setValue(1);
                  addLink(url);
                }}
                onLoadEnd={() => {
                  Animated.timing(progressAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false,
                  }).start(() => {
                    Animated.timing(progressOpacityAnim, {
                      toValue: 0,
                      delay: 100,
                      duration: 300,
                      useNativeDriver: false,
                    }).start();
                  });
                }}
                onLoadProgress={(e) => {
                  const { progress, loading } = e.nativeEvent;
                  Animated.timing(progressAnim, {
                    toValue: progress,
                    duration: 1000,
                    useNativeDriver: false,
                  }).start(() => {
                    if (progress > 0.99) {
                      Animated.timing(progressOpacityAnim, {
                        toValue: 0,
                        delay: 100,
                        duration: 300,
                        useNativeDriver: false,
                      }).start();
                    }
                  });
                  setNavState({
                    ...navState,
                    loading,
                  });
                }}
              />
            )}
          </Animated.View>
          <Separator opaque style={{ marginTop: -1 }} />
          <BlurView intensity={99} tint={isDark ? 'dark' : 'light'}>
            <View
              onLayout={(e) => {
                console.log(
                  '📐 StoryScreen tab bar onLayout',
                  e.nativeEvent.layout,
                );
                const { height, width } = e.nativeEvent.layout;
                // console.log({ height });
                setToolbarWidth(width);
                setToolbarHeight(height - insets.bottom);
              }}
              style={{
                paddingTop: 15,
                paddingBottom: Math.max(15, insets.bottom + 4),
                flexShrink: 0,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{ width: 60, alignItems: 'center' }}>
                {navState.canGoBack && tabView === 'web' && (
                  <TouchableOpacity
                    onPress={() => {
                      webViewRef.current?.goBack();
                    }}
                    hitSlop={{
                      top: 22,
                      right: 22,
                      bottom: 22,
                      left: 22,
                    }}
                  >
                    <BackIcon width={18} height={18} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
              <SegmentedControl
                style={{ flexGrow: 1 }}
                appearance={isDark ? 'dark' : 'light'}
                values={tabValues}
                selectedIndex={tabViews.findIndex((v) => v === tabView)}
                onChange={(e) => {
                  Haptics.selectionAsync();
                  const index = e.nativeEvent.selectedSegmentIndex;
                  const tab = tabViews[index].toLowerCase();
                  setTabView(tab);
                }}
              />
              <View style={{ width: 60 }}></View>
            </View>
          </BlurView>
          <ScrollView
            pointerEvents="none"
            removeClippedSubviews
            contentInsetAdjustmentBehavior="automatic"
            style={{
              opacity: tabView === 'web' ? 1 : 0,
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            }}
          >
            <View
              style={{
                width: '100%',
              }}
            >
              <Animated.View
                style={{
                  width: '100%',
                  backgroundColor: colors.primary,
                  height: 2,
                  shadowOpacity: 0.7,
                  shadowOffset: {
                    width: 0,
                    height: 0,
                  },
                  shadowColor: colors.primary,
                  shadowRadius: 2,
                  transform: [
                    {
                      // translateX: 0,
                      translateX:
                        0 ||
                        progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-toolbarWidth + 10, 0],
                        }),
                    },
                  ],
                  // opacity: 1,
                  opacity: progressOpacityAnim,
                }}
              />
            </View>
          </ScrollView>
        </View>
      )}
    </>
  );
}
