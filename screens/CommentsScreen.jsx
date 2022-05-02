import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import MaskedView from '@react-native-masked-view/masked-view';
import { FlatList, TouchableOpacity } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

import CommentContainer from '../components/CommentContainer';
import CommentPage from '../components/CommentPage';
import HTMLView2 from '../components/HTMLView2';
import OuterSpacer from '../components/OuterSpacer';
import ReadableWidthContainer from '../components/ReadableWidthContainer';
import Separator from '../components/Separator';
import Text from '../components/Text';
import TimeAgo from '../components/TimeAgo';

import useBottomSheetHeaderHeight from '../hooks/useBottomSheetHeaderHeight';
import useTheme from '../hooks/useTheme';
import useViewport from '../hooks/useViewport';

import getCommentsMetadata from '../utils/getCommentsMetadata';
import getHTMLText from '../utils/getHTMLText';
import repliesCount2MaxWeight from '../utils/repliesCount2MaxWeight';

import CloseIcon from '../assets/xmark.svg';

function FadedContent({ maxHeight, children, ...props }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Pressable
      onPress={() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
      }}
    >
      <MaskedView
        pointerEvents="none"
        style={{
          padding: 15,
          paddingTop: 1,
          maxHeight: expanded ? undefined : maxHeight,
        }}
        maskElement={
          <LinearGradient
            colors={expanded ? ['#000'] : ['#000', 'transparent']}
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
        {...props}
      >
        <ScrollView
          automaticallyAdjustContentInsets={false}
          removeClippedSubviews
          scrollEnabled={false}
        >
          {children}
        </ScrollView>
      </MaskedView>
    </Pressable>
  );
}

export default function CommentsScreen({ route, navigation }) {
  const { isDark, colors } = useTheme();
  const { item, zIndex } = route.params;
  const { comments = [], content } = item;
  const { repliesCount, totalComments } = getCommentsMetadata(item);
  const countDiffer = repliesCount !== totalComments;

  // useEffect(() => {
  //   const commentsScreenCount = navigation
  //     .getState()
  //     .routes.filter((r) => r.name.toLowerCase() === 'comments').length;
  //   Haptics.impactAsync(
  //     Haptics.ImpactFeedbackStyle[
  //       commentsScreenCount === 1
  //         ? 'Light'
  //         : commentsScreenCount === 2
  //         ? 'Medium'
  //         : 'Heavy'
  //     ],
  //   );
  // }, []);

  const windowHeight = useWindowDimensions().height;
  const listHeaderHeight = useRef(0);
  const ListHeaderComponent = useMemo(
    () => (
      <>
        <ReadableWidthContainer>
          <FadedContent
            maxHeight={windowHeight / 6}
            onLayout={(e) => {
              console.log('📐 MaskedView onLayout', e.nativeEvent.layout);
              listHeaderHeight.current = e.nativeEvent.layout.height;
            }}
          >
            <HTMLView2 html={content} />
          </FadedContent>
        </ReadableWidthContainer>
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
      </>
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
  const { underViewableHeight } = useViewport();
  useEffect(() => {
    if (underViewableHeight) {
      Animated.spring(appearAnim, {
        toValue: 0,
        delay: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(appearAnim, {
        toValue: 1,
        delay: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [underViewableHeight]);

  const headerRef = useRef(null);
  const headerHeight = useBottomSheetHeaderHeight();
  const headerStyles = {
    borderBottomColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
  };
  const insets = useSafeAreaInsets();
  const [scrolledDown, setScrolledDown] = useState(false);
  const scrolledRef = useRef(false);
  const onScroll = useCallback((e) => {
    const { y } = e.nativeEvent.contentOffset;
    const scrolled = y >= listHeaderHeight.current;
    if (scrolled && scrolled === scrolledRef.current) return;
    scrolledRef.current = scrolled;

    headerRef.current?.setNativeProps({
      style: {
        ...headerStyles,
        borderBottomColor: scrolled ? colors.separator : 'transparent',
      },
    });

    setScrolledDown(scrolled);
  }, []);

  return (
    <>
      {!isDark && <StatusBar style="inverted" animated />}
      <View ref={headerRef} style={headerStyles}>
        <SafeAreaView>
          <View
            style={{
              height: headerHeight,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ paddingLeft: 15, flexShrink: 1 }}>
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
                <Text type="insignificant"> &bull; </Text>
                {scrolledDown ? (
                  <Text size="subhead" type="insignificant">
                    {getHTMLText(content)}
                  </Text>
                ) : (
                  <Text type="insignificant">
                    <TimeAgo time={new Date(item.time * 1000)} />
                  </Text>
                )}
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
              <Text type="link" bolder>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
      <FlatList
        key={`comments-${item.id}`}
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
        key={`bottombar-${item.id}`}
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
          shadowOpacity: 0.2,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        <BlurView
          intensity={99}
          tint={isDark ? 'dark' : 'light'}
          style={{ borderRadius: 30, overflow: 'hidden' }}
          onLayout={({ nativeEvent }) => {
            console.log('📐 BlurView onLayout', nativeEvent.layout);
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
              backgroundColor: isDark ? colors.opaqueBackground : 'transparent',
              alignItems: 'center',
            }}
            hitSlop={{
              top: 44,
              right: 44,
              bottom: 44,
              left: 44,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <CloseIcon
                width={11}
                height={11}
                color={colors.link}
                style={{ marginRight: 8 }}
              />
              <Text type="link" bolder>
                Close thread
              </Text>
            </View>
            {zIndex > 0 && (
              <Text center style={{ position: 'absolute', bottom: 0 }}>
                {[...Array(zIndex + 1)].map((_, i) => {
                  const notLast = i < zIndex;
                  return (
                    <Text
                      key={i}
                      type={notLast ? 'insignificant' : 'link'}
                      style={{ opacity: notLast ? 0.3 : 0.7 }}
                    >
                      &bull;
                    </Text>
                  );
                })}
              </Text>
            )}
          </TouchableOpacity>
        </BlurView>
      </Animated.View>
    </>
  );
}
