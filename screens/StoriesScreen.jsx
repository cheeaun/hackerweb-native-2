import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FlatList,
  LayoutAnimation,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native-gesture-handler';

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
      .then((expired) => expired && onFetchStories())
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

  const [showList, setShowList] = useState(null);
  useEffect(() => {
    let timer = setTimeout(() => setShowList(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    showList && (
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
    )
  );
}
