import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Animated,
  FlatList,
  LayoutAnimation,
  Linking,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  Stack,
  useFocusEffect,
  useIsPreview,
  useRouter,
  useNavigation,
  useLocalSearchParams,
} from 'expo-router';
import { useAppState } from '@react-native-community/hooks';
import SegmentedControl from '@expo/ui/community/segmented-control';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { URL } from 'react-native-url-polyfill';
import { WebView } from 'react-native-webview';

import * as Application from 'expo-application';
import * as Haptics from 'expo-haptics';

import CommentContainer from '../components/CommentContainer';
import CommentPage from '../components/CommentPage';
import HTMLView2 from '../components/HTMLView2';
import ListEmpty from '../components/ListEmpty';
import OuterSpacer from '../components/OuterSpacer';
import PrettyURL from '../components/PrettyURL';
import ReadableWidthContainer from '../components/ReadableWidthContainer';
import Separator from '../components/Separator';
import Text from '../components/Text';
import TimeAgo from '../components/TimeAgo';
import TouchableHighlight from '../components/TouchableHighlight';

import useStore from '../hooks/useStore';
import useTheme from '../hooks/useTheme';
import useViewport from '../hooks/useViewport';

import openBrowser from '../utils/openBrowser';
import openShare from '../utils/openShare';
import proxyItem from '../utils/proxyItem';
import repliesCount2MaxWeight from '../utils/repliesCount2MaxWeight';
import shortenNumber from '../utils/shortenNumber';
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
});

const EMPTY_OBJECT = {};

function parseURL(url) {
  if (!url) return {};
  const link = new URL(url);
  const domain = link.hostname.replace(/^www\./, '');
  return {
    domain,
  };
}

export default function StoryScreen() {
  const { isDark, colors } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();

  const isPreview = useIsPreview();

  const { id, tab } = useLocalSearchParams();

  const story = useStore(
    useCallback(
      ({ stories, items, minimalItems }) => {
        const numericId = parseInt(id, 10);
        return (
          stories.find((s) => s.id === numericId) ||
          proxyItem(items.get(numericId)) ||
          proxyItem(minimalItems.get(numericId)) ||
          EMPTY_OBJECT
        );
      },
      [id],
    ),
  );
  const fetchStory = useStore((state) => state.fetchStory);
  const fetchItem = useStore((state) => state.fetchItem);
  const [initiatedStoryID, setInitiatedStoryID] = useState(null);
  const storyLoading = initiatedStoryID !== id;
  const transitionEnded = useRef(false);
  useEffect(() => {
    if (isPreview) return;
    const unsubscribe = navigation.addListener('transitionEnd', () => {
      transitionEnded.current = true;
    });
    return unsubscribe;
  }, [navigation, isPreview]);

  useLayoutEffect(() => {
    if (isPreview && tabView === 'web') return;

    if (story.comments?.length) {
      setInitiatedStoryID(id);
      return;
    }

    let ignore = false;
    let fetchPromise;
    const numericId = parseInt(id, 10);
    if (!story.__isItem) {
      fetchPromise = fetchStory(numericId);
    } else {
      fetchPromise = fetchItem(numericId);
    }
    fetchPromise
      .catch((e) => {
        Alert.alert('Error loading story');
      })
      .finally(() => {
        if (ignore) return;
        if (!isPreview && transitionEnded.current) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
        setInitiatedStoryID(id);
      });

    return () => {
      ignore = true;
    };
  }, [id, tabView, story.comments?.length, !!story.__isItem, isPreview]);

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

  const httpLink = isHTTPLink(url);
  const isJob = type === 'job';
  const hnURL = `https://news.ycombinator.com/item?id=${id}`;

  useEffect(
    useCallback(() => {
      if (!httpLink) addLink(url);
    }, [httpLink]),
    [],
  );

  const { underViewableHeight } = useViewport();
  const [navState, setNavState] = useState({});
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressOpacityAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const webViewRef = useRef(null);

  const settingsInteractions = useStore((state) => state.settings.interactions);

  const titleLength = (title || '').length;
  const titleSize = underViewableHeight
    ? 'title3'
    : titleLength < 50
      ? 'title1'
      : titleLength < 100
        ? 'title2'
        : 'title3';

  const TitleComponent = useMemo(
    () => (
      <Text size={titleSize} bolder>
        {title}
      </Text>
    ),
    [titleSize, title],
  );

  const repliesCount = comments?.length;

  let maxPollPoints = 0;
  if (!!poll) {
    maxPollPoints = poll.reduce((acc, p) => Math.max(acc, p.points), 0);
  }

  const ListHeaderComponent = useMemo(
    () =>
      !!story.title && (
        <>
          <ReadableWidthContainer>
            <View style={[styles.storyInfo]}>
              {httpLink ? (
                <TouchableHighlight
                  onPress={() => {
                    setTabView('web');
                    setWebMounted(true);
                  }}
                  onLongPress={() => {
                    Haptics.selectionAsync();
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
                          router.push(`/user/${user}`);
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
                {!!content && <HTMLView2 html={content} linkify />}
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
          </ReadableWidthContainer>
          {repliesCount > 0 && (
            <>
              <Separator />
              <OuterSpacer
                style={{
                  backgroundColor: colors.opaqueSecondaryBackground,
                }}
                align="bottom"
                size="large"
              >
                <Text
                  type="insignificant"
                  size="footnote"
                  style={{ textTransform: 'uppercase' }}
                >
                  {comments_count
                    ? comments_count.toLocaleString('en-US')
                    : `${repliesCount}${repliesCount > 1 ? '+' : ''}`}{' '}
                  comment
                  {(comments_count ? comments_count > 1 : repliesCount > 1) &&
                    's'}
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
          storyID={id}
          item={item}
          maxWeight={repliesCount2MaxWeight(repliesCount)}
        />
      </>
    ),
    [id, repliesCount],
  );

  const ListEmptyComponent = useMemo(
    () => (
      <ListEmpty
        state={
          storyLoading ? 'loading' : !isJob && !comments?.length ? 'nada' : null
        }
        nadaText="No comments yet."
      />
    ),
    [storyLoading, isJob, comments?.length],
  );

  const keyExtractor = useCallback((item) => '' + item.id, []);

  const tabValues = [
    'Web',
    `${comments_count > 1 ? shortenNumber(comments_count) + ' ' : ''}Comments`,
  ];
  const tabViews = ['web', 'comments'];
  const [tabView, setTabView] = useState(tab);
  const [webMounted, setWebMounted] = useState(tab === 'web');
  useEffect(() => {
    setTabView(tab);
    if (tab === 'web') setWebMounted(true);
  }, [tab]);

  const initialScrollY = useStore((state) => state.storyScroll?.get?.(id) || 0);
  const scrollY = useRef(initialScrollY);
  const setStoryScroll = useStore((state) => state.setStoryScroll);

  const scrolledDown = useRef(false);
  const commentsNavOptions = useRef({
    title: '',
  });
  const onScroll = useCallback(
    (e) => {
      if (tabView !== 'comments') return;
      const { y } = e.nativeEvent.contentOffset;
      const scrolled = y > 16;
      if (scrolled === scrolledDown.current) return;
      scrolledDown.current = scrolled;
      const options = {
        title: scrolled ? title : '',
      };
      if (!isPreview) {
        try {
          navigation.setOptions(options);
        } catch {}
      }
      commentsNavOptions.current = options;
    },
    [tabView, title, isPreview],
  );

  useLayoutEffect(() => {
    if (isPreview || tabView !== 'web') return;
    try {
      console.log('🔧 Set header options for web view', {
        isPreview,
      });
      navigation.setOptions({
        title: parseURL(navState.url || url).domain || '',
      });
    } catch {}
  }, [url, navState.url, navState.title, isPreview]);

  useLayoutEffect(
    useCallback(() => {
      if (isPreview) {
        fadeAnim.setValue(tabView === 'web' ? 1 : 0);
        return;
      }

      try {
        console.log('🔧 Set header options on tab change', {
          isPreview,
          tabView,
        });
        navigation.setOptions({
          title:
            tabView === 'web'
              ? parseURL(navState.url || url).domain || ''
              : commentsNavOptions.current.title,
        });
      } catch {}

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      Animated.timing(fadeAnim, {
        toValue: tabView === 'web' ? 1 : 0,
        duration: isDark ? 300 : 150,
        useNativeDriver: true,
      }).start();
    }, [tabView, isDark, isPreview]),
    [tabView],
  );

  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const buttonWidth = 60;
  const segmentWidth = Math.min(
    Math.max(180, windowWidth - insets.left - insets.right - buttonWidth * 2),
    360,
  );

  const listRef = useRef(null);
  const currentAppState = useAppState();
  useEffect(() => {
    if (isPreview) return;
    let timeout;
    if (
      tabView === 'comments' &&
      !storyLoading &&
      currentAppState === 'active'
    ) {
      timeout = setTimeout(() => {
        listRef.current?.flashScrollIndicators();
      }, 300);
    }
    return () => clearTimeout(timeout);
  }, [tabView, storyLoading, currentAppState === 'active', isPreview]);
  useFocusEffect(
    useCallback(() => {
      if (isPreview) return;
      if (tabView === 'comments') {
        setTimeout(() => {
          listRef.current?.flashScrollIndicators();
        }, 300);
      }
    }, [tabView, isPreview]),
  );

  const Container = isPreview ? View : Fragment;
  const containerProps = isPreview
    ? {
        style: {
          flex: 1,
          backgroundColor: colors.background,
          overflow: 'hidden',
        },
      }
    : {};

  return (
    <Container {...containerProps}>
      <Stack.Header transparent={tabView === 'comments'} />
      {!isPreview && (
        <Stack.Toolbar placement="right">
          {tabView === 'web' ? (
            <Stack.Toolbar.Menu icon="ellipsis">
              <Stack.Toolbar.MenuAction
                icon="arrow.clockwise"
                onPress={() => webViewRef.current?.reload()}
              >
                Reload page
              </Stack.Toolbar.MenuAction>
              <Stack.Toolbar.MenuAction
                icon="safari"
                onPress={() => Linking.openURL(navState.url || url)}
              >
                Open in browser&hellip;
              </Stack.Toolbar.MenuAction>
              <Stack.Toolbar.MenuAction
                icon="square.and.arrow.up"
                onPress={() => openShare({ url: navState.url || url })}
              >
                Share&hellip;
              </Stack.Toolbar.MenuAction>
            </Stack.Toolbar.Menu>
          ) : (
            <Stack.Toolbar.Menu icon="square.and.arrow.up">
              {!settingsInteractions && (
                <Stack.Toolbar.MenuAction onPress={() => openBrowser(hnURL)}>
                  View on HN web site
                </Stack.Toolbar.MenuAction>
              )}
              {settingsInteractions && (
                <Stack.Toolbar.MenuAction
                  icon="arrowtriangle.up.fill"
                  onPress={() => {
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
                      params: {
                        url: hnURL,
                        jsKey,
                      },
                    });
                  }}
                >
                  Upvote story on HN
                </Stack.Toolbar.MenuAction>
              )}
              {settingsInteractions && (
                <Stack.Toolbar.MenuAction
                  icon="arrowshape.turn.up.left"
                  onPress={() =>
                    router.push({
                      pathname: '/web-view',
                      params: { url: hnURL },
                    })
                  }
                >
                  View or Reply story on HN
                </Stack.Toolbar.MenuAction>
              )}
              <Stack.Toolbar.MenuAction
                icon="square.and.arrow.up"
                onPress={() => openShare({ url: hnURL })}
              >
                Share story&hellip;
              </Stack.Toolbar.MenuAction>
            </Stack.Toolbar.Menu>
          )}
        </Stack.Toolbar>
      )}
      <FlatList
        ref={listRef}
        pointerEvents={tabView === 'comments' ? 'auto' : 'none'}
        ListHeaderComponent={ListHeaderComponent}
        data={isPreview ? comments.slice(0, 5) : comments}
        renderItem={renderItem}
        ListEmptyComponent={ListEmptyComponent}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={Separator}
        contentInsetAdjustmentBehavior="automatic"
        onScroll={onScroll}
        onScrollEndDrag={(e) => {
          const { y } = e.nativeEvent.contentOffset;
          setStoryScroll(id, y);
        }}
        onMomentumScrollEnd={(e) => {
          const { y } = e.nativeEvent.contentOffset;
          setStoryScroll(id, y);
        }}
        removeClippedSubviews
        contentOffset={{
          x: 0,
          y: scrollY.current,
        }}
      />
      {httpLink && (
        <>
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
                  applicationNameForUserAgent={`${Application.applicationName}/${Application.nativeApplicationVersion}`}
                  source={{ uri: url }}
                  originWhitelist={[
                    'http://*',
                    'https://*',
                    'data:*',
                    'about:*',
                  ]}
                  decelerationRate="normal"
                  allowsInlineMediaPlayback
                  contentInsetAdjustmentBehavior="automatic"
                  automaticallyAdjustContentInsets
                  automaticallyAdjustsScrollIndicatorInsets
                  allowsBackForwardNavigationGestures
                  renderLoading={() => null}
                  onNavigationStateChange={(navState) => {
                    setNavState(navState);
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
                  onMessage={() => {}}
                  injectedJavaScript={`
                    try {
                      document.querySelectorAll('video[autoplay]').forEach(v => v.playsInline = true);
                      var observer = new MutationObserver(function(mutations) {
                        document.querySelectorAll('video[autoplay]').forEach(v => v.playsInline = true);
                      });
                      observer.observe(document, {attributes: false, childList: true, characterData: false, subtree: true});
                    } catch (e) {}
                    true;
                  `}
                />
              )}
            </Animated.View>
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
              <View style={{ width: '100%' }}>
                <Animated.View
                  style={{
                    width: '100%',
                    backgroundColor: colors.primary,
                    height: 2,
                    shadowOpacity: 0.7,
                    shadowOffset: { width: 0, height: 0 },
                    shadowColor: colors.primary,
                    shadowRadius: 2,
                    transform: [
                      {
                        translateX:
                          0 ||
                          progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-windowWidth + 10, 0],
                          }),
                      },
                    ],
                    opacity: progressOpacityAnim,
                  }}
                />
              </View>
            </ScrollView>
          </View>
          {!isPreview && (
            <Stack.Toolbar placement="bottom">
              {navState.canGoBack && tabView === 'web' && (
                <Stack.Toolbar.Button
                  icon="chevron.backward"
                  onPress={() => webViewRef.current?.goBack()}
                  hidden={
                    navState.canGoBack && tabView === 'web' ? false : true
                  }
                />
              )}
              <Stack.Toolbar.Spacer width={1} />
              <Stack.Toolbar.View hidesSharedBackground>
                <SegmentedControl
                  style={{ width: segmentWidth }}
                  appearance={isDark ? 'dark' : 'light'}
                  values={tabValues}
                  selectedIndex={Math.max(
                    0,
                    tabViews.findIndex((v) => v === tabView),
                  )}
                  onChange={(e) => {
                    Haptics.selectionAsync();
                    const index = e.nativeEvent.selectedSegmentIndex;
                    const tab = tabViews[index].toLowerCase();
                    setTabView(tab);
                    if (tab === 'web') setWebMounted(true);
                  }}
                />
              </Stack.Toolbar.View>
              <Stack.Toolbar.Spacer width={1} />
            </Stack.Toolbar>
          )}
        </>
      )}
    </Container>
  );
}
