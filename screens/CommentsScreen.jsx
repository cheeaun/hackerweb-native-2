import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { View, useWindowDimensions, Animated, StyleSheet } from 'react-native';
import MaskedView from '@react-native-community/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { TouchableOpacity, FlatList } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Text from '../components/Text';
import HTMLView from '../components/HTMLView';
import CommentContainer from '../components/CommentContainer';
import Separator from '../components/Separator';
import TimeAgo from '../components/TimeAgo';
import OuterSpacer from '../components/OuterSpacer';
import CommentPage from '../components/CommentPage';

import useTheme from '../hooks/useTheme';

import getCommentsMetadata from '../utils/getCommentsMetadata';
import repliesCount2MaxWeight from '../utils/repliesCount2MaxWeight';

import CloseIcon from '../assets/xmark.svg';

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
  const listHeaderHeight = useRef(0);
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
          onLayout={(e) => {
            listHeaderHeight.current = e.nativeEvent.layout.height;
          }}
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
              {repliesCount.toLocaleString('en-US')}{' '}
              {repliesCount != 1 ? 'replies' : 'reply'}
            </Text>
            {countDiffer && (
              <Text
                type="insignificant"
                size="footnote"
                style={{ textTransform: 'uppercase' }}
              >
                {' '}
                &bull; {totalComments.toLocaleString('en-US')}{' '}
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

  const keyExtractor = useCallback((item) => '' + item.id, []);

  const footerRef = useRef(null);
  const ListFooterComponent = useMemo(() => <View ref={footerRef} />, []);
  const appearAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(appearAnim, {
      toValue: 1,
      delay: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const headerRef = useRef(null);
  const headerStyles = useMemo(
    () => ({
      height: HEADER_HEIGHT,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomColor: 'transparent',
      borderBottomWidth: StyleSheet.hairlineWidth,
    }),
    [],
  );
  const insets = useSafeAreaInsets();
  const scrolledDown = useRef(false);
  const onScroll = useCallback((e) => {
    const { y } = e.nativeEvent.contentOffset;
    const scrolled = y >= listHeaderHeight.current;
    if (scrolled && scrolled === scrolledDown.current) return;
    scrolledDown.current = scrolled;
    headerRef.current?.setNativeProps({
      style: {
        ...headerStyles,
        borderBottomColor: scrolled ? colors.separator : 'transparent',
      },
    });
  }, []);

  return (
    <>
      {!isDark && <StatusBar style="inverted" animated />}
      <View ref={headerRef} style={headerStyles}>
        <View style={{ paddingLeft: 15 }}>
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
              &bull; <TimeAgo time={new Date(item.time * 1000)} />
            </Text>
          </Text>
        </View>
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
      </View>
      <FlatList
        ListHeaderComponent={ListHeaderComponent}
        data={comments}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={Separator}
        contentInsetAdjustmentBehavior="automatic"
        ListFooterComponent={ListFooterComponent}
        removeClippedSubviews
        onScroll={onScroll}
      />
      <Animated.View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          alignItems: 'center',
          marginBottom: insets.bottom + 15,
          transform: [
            {
              translateY: appearAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [200, 0],
              }),
            },
          ],
          shadowRadius: 5,
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        <BlurView
          intensity={99}
          tint={isDark ? 'dark' : 'light'}
          style={{ borderRadius: 25, overflow: 'hidden' }}
          onLayout={({ nativeEvent }) => {
            footerRef.current?.setNativeProps({
              style: {
                height: nativeEvent.layout.height + 30,
              },
            });
          }}
        >
          <TouchableOpacity
            disallowInterruption
            onPress={() => {
              navigation.pop();
            }}
            style={{
              paddingVertical: 15,
              paddingHorizontal: 20,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDark ? colors.opaqueBackground : 'transparent',
            }}
            hitSlop={{
              top: 44,
              right: 44,
              bottom: 44,
              left: 44,
            }}
          >
            <CloseIcon
              width={11}
              height={11}
              color={colors.link}
              style={{ marginRight: 8 }}
            />
            <Text type="link" bold>
              Close thread
            </Text>
          </TouchableOpacity>
        </BlurView>
      </Animated.View>
    </>
  );
}
