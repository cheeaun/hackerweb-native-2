import React, { useEffect, useMemo } from 'react';
import { View, FlatList, useWindowDimensions } from 'react-native';
import MaskedView from '@react-native-community/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';

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

export default function CommentsScreen({ route, navigation }) {
  const { isDark, colors } = useTheme();
  const item = route.params;
  const { comments, content } = item;

  useEffect(() => {
    (async () => {
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
    })();
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
        />
        <Separator />
      </View>
    ),
    [windowHeight, content],
  );

  const renderItem = ({ item }) => (
    <CommentContainer item={item} maxWeight={15} />
  );

  function Comments() {
    return (
      <FlatList
        ListHeaderComponent={ListHeaderComponent}
        data={comments}
        renderItem={renderItem}
        keyExtractor={(item) => '' + item.id}
        ItemSeparatorComponent={Separator}
        contentInsetAdjustmentBehavior="automatic"
        ListFooterComponent={() => (
          <>
            <Separator />
            <TouchableOpacity
              onPress={() => {
                navigation.pop();
              }}
              style={{ padding: 15, paddingBottom: 45 }}
            >
              <Text
                type="link"
                bold
                style={{ textAlign: 'center', opacity: 0.5 }}
              >
                Close thread
              </Text>
            </TouchableOpacity>
          </>
        )}
      />
    );
  }

  const title = `${comments.length} ${
    comments.length === 1 ? 'reply' : 'replies'
  } to ${item.user}`;
  const headerTitle = () => (
    <Text type="insignificant" numberOfLines={1}>
      <Text bold>
        {comments.length} {comments.length === 1 ? 'reply' : 'replies'}
      </Text>{' '}
      to{' '}
      <Text
        bold
        style={{ color: colors.red }}
        onPress={() => {
          navigation.push('User', item.user);
        }}
      >
        {item.user}
      </Text>
      <Text type="insignificant" size="footnote">
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
    >
      <Text type="link" bold>
        Done
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      {!isDark && <StatusBar style="inverted" animated />}
      <Stack.Navigator>
        <Stack.Screen
          name={title}
          component={Comments}
          options={{
            headerTitle,
            headerTitleAlign: 'left',
            headerRight,
            headerStyle: {
              backgroundColor: 'transparent',
              shadowOpacity: 0,
              height: 56,
            },
          }}
        />
      </Stack.Navigator>
    </>
  );
}
