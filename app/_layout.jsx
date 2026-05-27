import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutAnimation, View } from 'react-native';

import { useAppState } from '@react-native-community/hooks';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import * as Updates from 'expo-updates';
import { StatusBar } from 'expo-status-bar';

import { Stack, usePathname } from 'expo-router';

import useStore from '../hooks/useStore';
import useTheme from '../hooks/useTheme';
import useViewportStore from '../hooks/useViewportStore';

const BACKGROUND_BUFFER = 15 * 60 * 1000;

global.__PRODUCTION__ = /production/i.test(Updates.channel);
if (!__PRODUCTION__ && !global._consolelog) {
  global.DEBUG_LOGS = [];
  global._consolelog = console.log;
  console.log = (...args) => {
    if (__DEV__) _consolelog.apply(console, args);
    DEBUG_LOGS.push({ log: args, ts: new Date() });
    DEBUG_LOGS = DEBUG_LOGS.slice(-100);
  };
}

export default function RootLayout() {
  const initSettings = useStore((state) => state.initSettings);
  const initLinks = useStore((state) => state.initLinks);
  useEffect(() => {
    initSettings();
    initLinks();
  }, []);

  const setUpdateIsAvailable = useStore((state) => state.setUpdateIsAvailable);
  const setLastBackgroundTime = useStore(
    (state) => state.setLastBackgroundTime,
  );
  const currentAppState = useAppState();
  const updateIsAvailable = useStore((state) => state.updateIsAvailable);
  const lastBackgroundTime = useStore((state) => state.lastBackgroundTime);
  const backgroundedTooLong =
    !!lastBackgroundTime && new Date() - lastBackgroundTime > BACKGROUND_BUFFER;

  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const [reloadKey, setReloadKey] = useState('');
  const reload = useCallback(() => {
    const key = '' + Math.random();
    console.log(`✨ Reload Navigator ${key}`);
    setReloadKey(key);
  }, []);

  useEffect(() => {
    console.log(`🏃 App Active: ${currentAppState === 'active'}`);
    if (currentAppState === 'active' && backgroundedTooLong) {
      if (!updateIsAvailable) {
        console.log(`🆙 Check for updates`);
        Updates.checkForUpdateAsync()
          .then(({ isAvailable }) => {
            if (isAvailable) {
              Updates.fetchUpdateAsync()
                .then(({ isNew }) => {
                  if (isNew) {
                    setUpdateIsAvailable(true);
                  }
                })
                .catch(() => {});
            }
          })
          .catch(() => {});
      }

      const isOnHome = pathnameRef.current === '/';
      if (isOnHome) {
        console.log(`💫 Reload, updateIsAvailable: ${updateIsAvailable}`);
        if (updateIsAvailable) {
          Updates.reloadAsync();
        } else {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          reload();
        }
      }
    } else if (currentAppState !== 'active') {
      setLastBackgroundTime(new Date());
    }
  }, [currentAppState === 'active']);

  const { isUpdateAvailable: hasNewUpdate, isUpdatePending } =
    Updates.useUpdates();

  useEffect(() => {
    if (hasNewUpdate || isUpdatePending) {
      console.log(`🔥 Update available or pending`);
      setUpdateIsAvailable(true);
    }
  }, [hasNewUpdate, isUpdatePending, setUpdateIsAvailable]);

  const { isDark, colors } = useTheme();

  const setViewport = useViewportStore((state) => state.setViewport);

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.background }}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setViewport({ width, height });
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="auto" animated />
        <SafeAreaProvider>
          <Stack
            key={reloadKey}
            screenOptions={{
              contentStyle: { backgroundColor: colors.background },
              headerTransparent: true,
              headerShadowVisible: false,
              headerBackButtonDisplayMode: 'minimal',
              headerBackTitle: 'News',
              title: '',
            }}
          >
            <Stack.Screen
              name="index"
              options={{
                title: 'HackerWeb',
                headerLargeTitle: true,
                headerLargeTitleShadowVisible: false,
                headerLargeTitleStyle: { color: colors.text },
                headerTitleStyle: { color: colors.text },
                headerBackTitle: undefined,
                headerBackButtonDisplayMode: undefined,
              }}
            />
            <Stack.Screen
              name="story/[id]"
              options={{
                title: '',
                headerTransparent: true,
                headerBackButtonDisplayMode: 'minimal',
              }}
            />
            <Stack.Screen
              name="story-modal/[id]"
              options={{
                presentation: 'modal',
                headerTransparent: true,
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="comments/[storyID]/[commentID]"
              options={{
                presentation: 'modal',
                headerTransparent: true,
              }}
            />
            <Stack.Screen
              name="user/[id]"
              options={{
                presentation: 'formSheet',
                sheetAllowedDetents: 'fitToContents',
                headerTransparent: false,
              }}
            />
            <Stack.Screen
              name="settings"
              options={{
                title: 'Settings',
                presentation: 'modal',
                headerTitleStyle: { color: colors.text },
              }}
            />
            <Stack.Screen
              name="logs"
              options={{
                headerBackButtonDisplayMode: 'minimal',
                presentation: 'modal',
                headerTransparent: true,
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="web-view"
              options={{
                presentation: 'modal',
                headerTransparent: false,
              }}
            />
            <Stack.Screen
              name="thread/[storyID]/[commentID]"
              options={{
                title: 'Thread',
                presentation: 'modal',
                headerTitleStyle: { color: colors.text },
              }}
            />
            {__DEV__ && (
              <Stack.Screen
                name="dev-test"
                options={{
                  title: 'Dev Test',
                  headerTitleStyle: { color: colors.text },
                }}
              />
            )}
          </Stack>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </View>
  );
}
