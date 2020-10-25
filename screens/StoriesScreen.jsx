import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  LayoutAnimation,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppState } from '@react-native-community/hooks';
import * as Updates from 'expo-updates';

import TouchableOpacity from '../components/TouchableOpacity';
import StoryItem from '../components/StoryItem';
import Separator from '../components/Separator';
import ListEmpty from '../components/ListEmpty';
import Text from '../components/Text';

import useStore from '../hooks/useStore';
import useTheme from '../hooks/useTheme';

import GearIcon from '../assets/gearshape.svg';

const ItemSeparatorComponent = () => (
  <Separator style={{ marginLeft: 15, marginTop: -StyleSheet.hairlineWidth }} />
);

const BACKGROUND_BUFFER = 15 * 60 * 1000; // 15min

export default function StoriesScreen({ navigation }) {
  const { colors } = useTheme();

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            navigation.push('Settings');
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

  const lastBackgroundTime = useStore((state) => state.lastBackgroundTime);
  const backgroundedDuration = new Date() - lastBackgroundTime;
  const backgroundedTooLong =
    !!lastBackgroundTime && backgroundedDuration > BACKGROUND_BUFFER;
  useEffect(() => {
    console.log(
      `🎢 Backgrounded for ${Math.floor(backgroundedDuration / 1000 / 60)}m`,
    );
  }, [+lastBackgroundTime]);

  const stories = useStore((state) => state.stories);
  const isStoriesExpired = useStore((state) => state.isStoriesExpired);
  const fetchStories = useStore((state) => state.fetchStories);

  const [storiesLoading, setStoriesLoading] = useState(false);
  const onFetchStories = useCallback(() => {
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
  useFocusEffect(() => {
    isStoriesExpired()
      .then((expired) => expired && onFetchStories())
      .catch(() => {});
  });

  const updateIsAvailable = useStore((state) => state.updateIsAvailable);
  const currentAppState = useAppState();
  useEffect(
    useCallback(() => {
      if (currentAppState === 'active' && navigation.isFocused()) {
        // If there's an update, auto reload
        if (updateIsAvailable && backgroundedTooLong) {
          Updates.reloadAsync();
        } else {
          onFetchStories();
        }
      }
    }, [updateIsAvailable, lastBackgroundTime]),
    [currentAppState],
  );

  const noStories = !stories.length;

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <ActivityIndicator animating={!noStories && storiesLoading} />
      ),
    });
  }, [noStories, storiesLoading]);

  return (
    <FlatList
      pointerEvents={storiesLoading ? 'none' : 'auto'}
      contentInsetAdjustmentBehavior="automatic"
      data={stories}
      renderItem={({ item, index }) => {
        return <StoryItem id={item.id} position={index + 1} />;
      }}
      keyExtractor={(item) => '' + item.id}
      ItemSeparatorComponent={ItemSeparatorComponent}
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
