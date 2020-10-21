import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from 'react-native-screens/native-stack';
import Constants from 'expo-constants';
import { useAppState } from '@react-native-community/hooks';
import * as Updates from 'expo-updates';

import StoriesScreen from './screens/StoriesScreen';
import StoryScreen from './screens/StoryScreen';
import CommentsScreen from './screens/CommentsScreen';
import UserScreen from './screens/UserScreen';
import SettingsScreen from './screens/SettingsScreen';

import useStore from './hooks/useStore';
import useTheme from './hooks/useTheme';

enableScreens();
const Stack = createNativeStackNavigator();

export default function App() {
  const initLinks = useStore((state) => state.initLinks);
  initLinks();

  const setUpdateIsAvailable = useStore((state) => state.setUpdateIsAvailable);
  const currentAppState = useAppState();
  useEffect(() => {
    if (currentAppState === 'active') {
      Updates.checkForUpdateAsync()
        .then(({ isAvailable }) => {
          if (isAvailable) {
            Updates.fetchUpdateAsync().then(({ isNew }) => {
              if (isNew) {
                setUpdateIsAvailable(true);
              }
            });
          }
        })
        .catch(() => {});
    }
  }, [currentAppState]);

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
    <>
      <StatusBar style="auto" animated />
      <NavigationContainer theme={theme}>
        <Stack.Navigator>
          <Stack.Screen
            name={Constants.manifest.name}
            component={StoriesScreen}
            options={{
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
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
