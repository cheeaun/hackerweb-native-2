import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  SafeAreaView,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import MaskedView from '@react-native-community/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';

import { createStackNavigator } from '@react-navigation/stack';
const Stack = createStackNavigator();

import Text from '../components/Text';
import HTMLView from '../components/HTMLView';
import CommentContainer from '../components/CommentContainer';
import Separator from '../components/Separator';
import TouchableOpacity from '../components/TouchableOpacity';
import TimeAgo from '../components/TimeAgo';
import OuterSpacer from '../components/OuterSpacer';

import useTheme from '../hooks/useTheme';

import getCommentsMetadata from '../utils/getCommentsMetadata';
import repliesCount2MaxWeight from '../utils/repliesCount2MaxWeight';

const HEADER_HEIGHT = 56;

export default function CommentsScreen({ route, navigation }) {
  const { isDark, colors } = useTheme();
  const item = route.params;
  const { comments = [], content } = item;
  const { repliesCount, totalComments } = getCommentsMetadata(item);
  const countDiffer = repliesCount !== totalComments;

  useEffect(() => {
    const commentsScreenCount = navigation
      .dangerouslyGetState()
      .routes.filter((r) => r.name.toLowerCase() === 'comments').length;
    Haptics.impactAsync(
      Haptics.ImpactFeedbackStyle[
        commentsScreenCount === 1
          ? 'Light'
          : commentsScreenCount === 2
          ? 'Medium'
          : 'Heavy'
      ],
    );
  }, []);

  const windowHeight = useWindowDimensions().height;
  const ListHeaderComponent = useMemo(
    () => (
      <View pointerEvents="none">
        <MaskedView
          style={{
            padding: 15,
            paddingTop: 1,
            maxHeight: windowHeight / 6,
            overflow: 'hidden',
            position: 'relative',
          }}
          maskElement={
            <LinearGradient
              colors={['rgba(0,0,0,.7)', 'transparent']}
              start={[0, 0]}
              end={[0, 0.95]}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
              }}
            />
          }
        >
          <HTMLView html={content} />
        </MaskedView>
        <Separator />
        <OuterSpacer
          style={{
            backgroundColor: colors.opaqueSecondaryBackground,
          }}
          align="bottom"
          size="large"
        >
          <Text>
            <Text
              type="insignificant"
              size="footnote"
              style={{ textTransform: 'uppercase' }}
            >
              {repliesCount.toLocaleString()}{' '}
              {repliesCount != 1 ? 'replies' : 'reply'}
            </Text>
            {countDiffer && (
              <Text
                type="insignificant"
                size="footnote"
                style={{ textTransform: 'uppercase' }}
              >
                {' '}
                &middot; {totalComments.toLocaleString()}{' '}
                {totalComments !== 1 ? 'comments' : 'comment'}
              </Text>
            )}
          </Text>
        </OuterSpacer>
        <Separator />
      </View>
    ),
    [windowHeight, content],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <CommentContainer
        item={item}
        maxWeight={repliesCount2MaxWeight(repliesCount)}
      />
    ),
    [repliesCount],
  );

  const keyExtractor = useCallback((item) => '' + item.id, []);

  function Comments() {
    const [footerHeight, setFooterHeight] = useState(0);
    const ListFooterComponent = useMemo(
      () => <View style={{ height: footerHeight }} />,
      [footerHeight],
    );

    return (
      <>
        <FlatList
          ListHeaderComponent={ListHeaderComponent}
          data={comments}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={Separator}
          contentInsetAdjustmentBehavior="automatic"
          ListFooterComponent={ListFooterComponent}
        />
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
          }}
          pointerEvents="box-none"
        >
          <SafeAreaView
            style={{ alignItems: 'center' }}
            pointerEvents="box-none"
          >
            <BlurView
              intensity={99}
              tint={isDark ? 'dark' : 'light'}
              style={{ borderRadius: 25, marginBottom: 15 }}
              onLayout={({ nativeEvent }) =>
                setFooterHeight(nativeEvent.layout.height)
              }
            >
              <TouchableOpacity
                onPress={() => {
                  navigation.pop();
                }}
                style={{
                  paddingVertical: 15,
                  paddingHorizontal: 30,
                  backgroundColor: colors.opaqueBackground,
                }}
                hitSlop={{
                  top: 44,
                  right: 44,
                  bottom: 44,
                  left: 44,
                }}
              >
                <Text type="link" bold>
                  Close thread
                </Text>
              </TouchableOpacity>
            </BlurView>
          </SafeAreaView>
        </View>
      </>
    );
  }

  const title = `${item.user}`;
  const headerTitle = () => (
    <Text numberOfLines={1}>
      <Text
        bold
        style={{ color: colors.red }}
        onPress={() => {
          navigation.push('User', item.user);
        }}
      >
        {item.user}
      </Text>
      <Text type="insignificant">
        {' '}
        &middot; <TimeAgo time={new Date(item.time * 1000)} />
      </Text>
    </Text>
  );
  const headerRight = () => (
    <TouchableOpacity
      onPress={() => {
        navigation.pop();
      }}
      style={{ paddingHorizontal: 15 }}
      hitSlop={{
        top: 44,
        right: 44,
        bottom: 44,
        left: 44,
      }}
    >
      <Text type="link" bold>
        Done
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      {!isDark && <StatusBar style="inverted" animated />}
      <Stack.Navigator
        screenOptions={{
          cardStyle: {
            backgroundColor: 'transparent',
          },
          headerTitle,
          headerTitleAlign: 'left',
          headerRight,
          headerStyle: {
            backgroundColor: 'transparent',
            shadowOpacity: 0,
            height: HEADER_HEIGHT,
          },
        }}
      >
        <Stack.Screen name={title} component={Comments} />
      </Stack.Navigator>
    </>
  );
}
