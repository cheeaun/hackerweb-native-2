import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  LayoutAnimation,
  StyleSheet,
  TouchableOpacity,
  InteractionManager,
  PlatformColor,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

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
        >
          <GearIcon width={20} height={20} color={colors.blue} />
        </TouchableOpacity>
      ),
    });
  }, []);

  const stories = useStore((state) => state.stories);
  const fetchStories = useStore((state) => state.fetchStories);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const onFetchStories = useCallback(() => {
    let ignore = false;
    const task = InteractionManager.runAfterInteractions(() => {
      setStoriesLoading(true);
      fetchStories().finally(() => {
        if (ignore) return;
        setStoriesLoading(false);
      });
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    });

    return () => {
      ignore = true;
      task.cancel();
    };
  }, []);
  useFocusEffect(onFetchStories);

  const noStories = !stories.length;

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
          loading={storiesLoading}
          error={noStories}
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
