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
import { useFocusEffect, useNavigation } from 'expo-router';
import { TouchableOpacity } from 'react-native-gesture-handler';

import ListEmpty from '../components/ListEmpty';
import ReadableWidthContainer from '../components/ReadableWidthContainer';
import Separator from '../components/Separator';
import StoryItem from '../components/StoryItem';
import Text from '../components/Text';

import useStore from '../hooks/useStore';
import useTheme from '../hooks/useTheme';
import useViewport from '../hooks/useViewport';

const ItemSeparatorComponent = () => (
  <ReadableWidthContainer>
    <Separator
      style={{
        marginLeft: 15 + 22 + 10,
        marginRight: 15,
        marginTop: -StyleSheet.hairlineWidth,
      }}
    />
  </ReadableWidthContainer>
);

export default function StoriesScreen() {
  const { colors } = useTheme();

  const navigation = useNavigation();
  const { exceedsReadableWidth } = useViewport();

  useEffect(() => {
    navigation.setOptions({
      headerLargeTitle: true,
      headerLargeTitleShadowVisible: false,
      headerBackTitle: undefined,
      headerBackButtonDisplayMode: undefined,
    });
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLargeTitle: !exceedsReadableWidth,
    });
  }, [exceedsReadableWidth]);

  const stories = useStore((state) => state.stories);
  const isStoriesExpired = useStore((state) => state.isStoriesExpired);
  const fetchStories = useStore((state) => state.fetchStories);

  const [storiesLoading, setStoriesLoading] = useState(true);
  const onFetchStories = useCallback(() => {
    console.log('🤙 onFetchStories');
    let ignore = false;
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

  const focusCountRef = useRef(0);
  useFocusEffect(
    useCallback(() => {
      focusCountRef.current += 1;
      console.log('👀 StoriesScreen is focused');
      if (focusCountRef.current > 1) {
        fetchIfExpired();
      }
    }, []),
  );
  useEffect(() => {
    let ignore = false;
    fetchStories().finally(() => {
      if (ignore) return;
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setStoriesLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, []);

  const noStories = !stories.length;

  const [showMore, setShowMore] = useState(false);
  const [showMoreStories, setShowMoreStories] = useState(false);

  const listRef = useRef(null);
  const flashTimeout = useRef(null);
  useFocusEffect(
    useCallback(() => {
      console.log('🚨 focus effect');
      clearTimeout(flashTimeout.current);
      flashTimeout.current = setTimeout(() => {
        if (!storiesLoading) {
          listRef.current?.flashScrollIndicators();
        }
      }, 300);
    }, [storiesLoading]),
  );
  const currentAppState = useAppState();
  useEffect(() => {
    if (
      currentAppState === 'active' &&
      !storiesLoading &&
      (showMoreStories || stories?.length > 0)
    ) {
      console.log('🚨', {
        currentAppState,
        storiesLoading,
        showMoreStories,
        storiesLen: stories?.length,
      });
      flashTimeout.current = setTimeout(() => {
        listRef.current?.flashScrollIndicators();
      }, 300);
    }
    return () => clearTimeout(flashTimeout.current);
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
      contentContainerStyle={{ flexGrow: 0.8 }}
    />
  );
}
