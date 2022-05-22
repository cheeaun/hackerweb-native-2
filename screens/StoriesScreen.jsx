import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  StyleSheet,
  View,
} from 'react-native';

import { useAppState } from '@react-native-community/hooks';
import { useFocusEffect } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import ListEmpty from '../components/ListEmpty';
import ReadableWidthContainer from '../components/ReadableWidthContainer';
import Separator from '../components/Separator';
import StoryItem from '../components/StoryItem';
import Text from '../components/Text';

import useStore from '../hooks/useStore';
import useTheme from '../hooks/useTheme';
import useViewport from '../hooks/useViewport';

import GearIcon from '../assets/gearshape.svg';

const ItemSeparatorComponent = () => (
  <ReadableWidthContainer>
    <Separator
      style={{ marginLeft: 15, marginTop: -StyleSheet.hairlineWidth }}
    />
  </ReadableWidthContainer>
);

export default function StoriesScreen({ navigation }) {
  const { colors } = useTheme();

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            navigation.push('Settings');
          }}
          onLongPress={() => {
            if (__DEV__) {
              navigation.push('DevTest');
            }
          }}
          hitSlop={{
            top: 44,
            right: 44,
            bottom: 44,
            left: 44,
          }}
        >
          <GearIcon width={20} height={20} color={colors.blue} />
        </TouchableOpacity>
      ),
    });
  }, []);

  const stories = useStore((state) => state.stories);
  const isStoriesExpired = useStore((state) => state.isStoriesExpired);
  const fetchStories = useStore((state) => state.fetchStories);

  const [storiesLoading, setStoriesLoading] = useState(false);
  const onFetchStories = useCallback(() => {
    console.log('🤙 onFetchStories');
    let ignore = false;
    setStoriesLoading(true);
    fetchStories().finally(() => {
      if (ignore) return;
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setStoriesLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, []);
  const fetchIfExpired = useCallback(() => {
    console.log('🥏 fetchIfExpired');
    isStoriesExpired()
      .then((expired) => {
        console.log(`🥏 Stories expired: ${expired}`);
        expired && onFetchStories();
        setShowMore(!expired);
      })
      .catch(() => {});
  }, []);

  const isMountedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      console.log('👀 StoriesScreen is focused');
      if (isMountedRef.current) {
        fetchIfExpired();
      }
    }, []),
  );
  useEffect(() => {
    isMountedRef.current = true;
    return onFetchStories();
  }, []);

  const noStories = !stories.length;

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <ActivityIndicator animating={!noStories && storiesLoading} />
      ),
    });
  }, [noStories, storiesLoading]);

  const [showMore, setShowMore] = useState(false);
  const [showMoreStories, setShowMoreStories] = useState(false);

  const { exceedsReadableWidth } = useViewport();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLargeTitle: !exceedsReadableWidth,
    });
  }, [exceedsReadableWidth]);

  const listRef = useRef(null);
  useFocusEffect(
    useCallback(() => {
      setTimeout(() => {
        listRef.current?.flashScrollIndicators();
      }, 300);
    }, []),
  );
  const currentAppState = useAppState();
  useEffect(() => {
    let timeout;
    if (
      currentAppState === 'active' &&
      !storiesLoading &&
      (showMoreStories || stories?.length > 0)
    ) {
      timeout = setTimeout(() => {
        listRef.current?.flashScrollIndicators();
      }, 300);
    }
    return () => clearTimeout(timeout);
  }, [
    showMoreStories,
    stories?.length > 0,
    currentAppState === 'active',
    storiesLoading,
  ]);

  return (
    <FlatList
      ref={listRef}
      pointerEvents={storiesLoading ? 'none' : 'auto'}
      contentInsetAdjustmentBehavior="automatic"
      data={showMoreStories ? stories : stories.slice(0, 30)}
      renderItem={({ item, index }) => {
        return (
          <ReadableWidthContainer>
            <StoryItem id={item.id} position={index + 1} />
          </ReadableWidthContainer>
        );
      }}
      keyExtractor={(item) => '' + item.id}
      ItemSeparatorComponent={ItemSeparatorComponent}
      ListFooterComponent={
        !!showMore &&
        !showMoreStories &&
        !storiesLoading &&
        stories.length > 30 && (
          <>
            <ItemSeparatorComponent />
            <TouchableOpacity
              onPress={() => {
                setShowMoreStories(true);
              }}
            >
              <View style={{ padding: 15, marginBottom: 30 }}>
                <Text type="link" center>
                  More&hellip;
                </Text>
              </View>
            </TouchableOpacity>
          </>
        )
      }
      contentContainerStyle={{ flexGrow: 0.8 }}
      ListEmptyComponent={() => (
        <ListEmpty
          state={storiesLoading ? 'loading' : noStories ? 'error' : null}
          errorComponent={() => (
            <Text
              onPress={() => {
                onFetchStories();
              }}
              style={{ textAlign: 'center' }}
            >
              Unable to get stories.
              {'\n'}
              <Text type="link">Try again?</Text>
            </Text>
          )}
        />
      )}
    />
  );
}
