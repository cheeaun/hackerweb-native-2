import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LayoutAnimation, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from 'react-native-screens/native-stack';
import Constants from 'expo-constants';
import { useAppState } from '@react-native-community/hooks';
import * as Updates from 'expo-updates';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import StoriesScreen from './screens/StoriesScreen';
import StoryScreen from './screens/StoryScreen';
import CommentsScreen from './screens/CommentsScreen';
import UserScreen from './screens/UserScreen';
import SettingsScreen from './screens/SettingsScreen';

import useStore from './hooks/useStore';
import useTheme from './hooks/useTheme';

const BACKGROUND_BUFFER = 15 * 60 * 1000; // 15min

enableScreens();
const Stack = createNativeStackNavigator();

global.__PRODUCTION__ = /production/i.test(Constants.manifest.releaseChannel);

export default function App() {
  const initLinks = useStore((state) => state.initLinks);
  useEffect(() => {
    initLinks();
  }, []);

  const navigationRef = useRef(null);
  const setUpdateIsAvailable = useStore((state) => state.setUpdateIsAvailable);
  const setLastBackgroundTime = useStore(
    (state) => state.setLastBackgroundTime,
  );
  const currentAppState = useAppState();
  const updateIsAvailable = useStore((state) => state.updateIsAvailable);
  const lastBackgroundTime = useStore((state) => state.lastBackgroundTime);
  const backgroundedTooLong =
    !!lastBackgroundTime && new Date() - lastBackgroundTime > BACKGROUND_BUFFER;

  const [reloadKey, setReloadKey] = useState('');
  const reload = useCallback(() => {
    const key = '' + Math.random();
    console.log(`✨ Reload Navigator ${key}`);
    setReloadKey(key);
  }, []);

  useEffect(() => {
    console.log(`🏃 App Active: ${currentAppState === 'active'}`);
    if (currentAppState === 'active' && backgroundedTooLong) {
      // First, check for updates
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
                .catch(() => {}); // Silent fail
            }
          })
          .catch(() => {}); // Silent fail
      }

      // Second, reload whole app if there's update
      const currentRoute = navigationRef.current?.getCurrentRoute();
      if (currentRoute.name === 'Home') {
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

  const { isDark, colors } = useTheme();

  const theme = {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.secondaryBackground,
      text: colors.text,
      border: colors.separator,
      notification: colors.primary,
    },
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="auto" animated />
      <SafeAreaProvider>
        <NavigationContainer theme={theme} key={reloadKey} ref={navigationRef}>
          <Stack.Navigator>
            <Stack.Screen
              name="Home"
              component={StoriesScreen}
              options={{
                title: Constants.manifest.name,
                headerLargeTitleHideShadow: true,
                headerLargeTitle: true,
                headerLargeStyle: {
                  backgroundColor: colors.background,
                },
                headerStyle: {
                  backgroundColor: colors.opaqueHeader,
                  blurEffect: 'prominent',
                },
                headerTranslucent: true,
              }}
            />
            <Stack.Screen
              name="Story"
              component={StoryScreen}
              options={{
                headerBackTitle: 'News',
                title: '',
                headerHideShadow: true,
                headerStyle: {
                  backgroundColor: colors.background,
                },
                headerTranslucent: true,
              }}
            />
            <Stack.Screen
              name="Comments"
              component={CommentsScreen}
              options={{
                stackPresentation: 'modal',
                contentStyle: {
                  backgroundColor: colors.modalBackground,
                },
              }}
            />
            <Stack.Screen
              name="User"
              component={UserScreen}
              options={{
                stackPresentation: 'transparentModal',
                stackAnimation: 'none',
                contentStyle: {
                  flexGrow: 1,
                },
              }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                stackPresentation: 'modal',
                contentStyle: {
                  backgroundColor: colors.background2,
                },
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </View>
  );
}
