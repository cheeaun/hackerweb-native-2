import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutAnimation, View } from 'react-native';

import { useAppState } from '@react-native-community/hooks';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  GestureHandlerRootView,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';

import CommentsScreen from './screens/CommentsScreen';
import DevTestScreen from './screens/DevTestScreen';
import LogsScreen from './screens/LogsScreen';
import SettingsScreen from './screens/SettingsScreen';
import StoriesScreen from './screens/StoriesScreen';
import StoryScreen from './screens/StoryScreen';
import UserScreen from './screens/UserScreen';
import WebViewScreen from './screens/WebViewScreen';

import Text from './components/Text';

import useStore from './hooks/useStore';
import useTheme from './hooks/useTheme';
import useViewportStore from './hooks/useViewportStore';

const BACKGROUND_BUFFER = 15 * 60 * 1000; // 15min

const Stack = createNativeStackNavigator();

global.__PRODUCTION__ = /production/i.test(Updates.releaseChannel);
if (!__PRODUCTION__ && !global._consolelog) {
  global.DEBUG_LOGS = [];
  global._consolelog = console.log;
  console.log = (...args) => {
    if (__DEV__) _consolelog.apply(console, args);
    DEBUG_LOGS.push({ log: args, ts: new Date() });
    DEBUG_LOGS = DEBUG_LOGS.slice(-100); // Only log last 100
  };
}

export default function App() {
  const initSettings = useStore((state) => state.initSettings);
  const initLinks = useStore((state) => state.initLinks);
  useEffect(() => {
    initSettings();
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

  useEffect(() => {
    Updates.addListener((updateEvent) => {
      console.log(
        `🔥 Update Event: ${updateEvent.type} - ${updateEvent.message}`,
      );
    });
  }, []);

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
          <NavigationContainer
            theme={theme}
            key={reloadKey}
            ref={navigationRef}
          >
            <Stack.Navigator>
              <Stack.Screen
                name="Home"
                component={StoriesScreen}
                options={{
                  title: Constants.manifest.name,
                  headerLargeTitleShadowVisible: false,
                  headerLargeTitle: true,
                  headerLargeStyle: {
                    backgroundColor: colors.background,
                  },
                  // headerStyle: {
                  //   backgroundColor: colors.opaqueHeader,
                  // },
                  // headerBlurEffect: 'prominent',
                  // headerTransparent: true,
                }}
              />
              <Stack.Screen
                name="Story"
                component={StoryScreen}
                options={{
                  headerBackTitle: 'News',
                  title: '',
                  // headerShadowVisible: false,
                  // headerStyle: {
                  //   backgroundColor: colors.background,
                  // },
                  // headerTransparent: true,
                }}
              />
              <Stack.Screen
                name="StoryModal"
                component={StoryScreen}
                options={{
                  headerLeft: () => (
                    <TouchableOpacity
                      onPress={() => {
                        navigationRef.current?.goBack();
                      }}
                      hitSlop={{
                        top: 44,
                        right: 44,
                        bottom: 44,
                        left: 44,
                      }}
                    >
                      <Text type="link" bold>
                        Close
                      </Text>
                    </TouchableOpacity>
                  ),
                  title: '',
                  presentation: 'modal',
                  // headerShadowVisible: false,
                  // headerStyle: {
                  //   backgroundColor: colors.background,
                  // },
                  // headerTransparent: true,
                }}
              />
              <Stack.Screen
                name="Comments"
                component={CommentsScreen}
                options={{
                  headerShown: false,
                  presentation: 'modal',
                  contentStyle: {
                    backgroundColor: colors.modalBackground,
                  },
                }}
              />
              <Stack.Screen
                name="User"
                component={UserScreen}
                options={{
                  headerShown: false,
                  presentation: 'transparentModal',
                  animation: 'none',
                  contentStyle: {
                    flexGrow: 1,
                  },
                }}
              />
              <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                  headerLargeTitleShadowVisible: false,
                  headerLargeTitle: true,
                  presentation: 'modal',
                  contentStyle: {
                    backgroundColor: colors.background2,
                  },
                  headerRight: () => (
                    <TouchableOpacity
                      onPress={() => {
                        navigationRef.current?.goBack();
                      }}
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
                  ),
                }}
              />
              <Stack.Screen
                name="Logs"
                component={LogsScreen}
                options={{
                  headerShown: false,
                  presentation: 'modal',
                }}
              />
              <Stack.Screen
                name="WebViewModal"
                component={WebViewScreen}
                options={{
                  headerTitleStyle: {
                    fontWeight: 'normal',
                  },
                  headerRight: () => (
                    <TouchableOpacity
                      onPress={() => {
                        navigationRef.current?.goBack();
                      }}
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
                  ),
                  title: '',
                  presentation: 'modal',
                  headerStyle: {
                    backgroundColor: colors.background,
                  },
                }}
              />
              <Stack.Screen name="DevTest" component={DevTestScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </View>
  );
}
