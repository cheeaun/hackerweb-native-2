import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutAnimation, View } from 'react-native';

import { useAppState } from '@react-native-community/hooks';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  GestureHandlerRootView,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';

import StoriesScreen from './screens/StoriesScreen';

import Text from './components/Text';

import useStore from './hooks/useStore';
import useTheme from './hooks/useTheme';
import useViewportStore from './hooks/useViewportStore';

const BACKGROUND_BUFFER = 15 * 60 * 1000; // 15min

const Stack = createNativeStackNavigator();

global.__PRODUCTION__ = /production/i.test(Updates.channel);
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

  // Use the new useUpdates hook to monitor update availability
  const { isUpdateAvailable: hasNewUpdate, isUpdatePending } =
    Updates.useUpdates();

  useEffect(() => {
    if (hasNewUpdate || isUpdatePending) {
      console.log(`🔥 Update available or pending`);
      setUpdateIsAvailable(true);
    }
  }, [hasNewUpdate, isUpdatePending, setUpdateIsAvailable]);

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
    fonts: DefaultTheme.fonts,
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
                  title: Constants.expoConfig.name,
                  headerLargeTitleShadowVisible: false,
                  headerLargeTitle: true,
                  // headerLargeStyle: {
                  //   backgroundColor: colors.background,
                  // },
                  headerTransparent: true,
                  // headerStyle: {
                  //   backgroundColor: colors.opaqueHeader,
                  // },
                  // headerBlurEffect: 'prominent',
                  // headerTransparent: true,
                }}
              />
              <Stack.Screen
                name="Story"
                getComponent={() => require('./screens/StoryScreen').default}
                options={{
                  headerBackTitle: 'News',
                  headerBackButtonDisplayMode: 'minimal',
                  title: '',
                  headerTransparent: true,
                  // headerShadowVisible: false,
                  // headerStyle: {
                  //   backgroundColor: colors.background,
                  // },
                  // headerTransparent: true,
                }}
              />
              <Stack.Screen
                name="StoryModal"
                getComponent={() => require('./screens/StoryScreen').default}
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
                getComponent={() => require('./screens/CommentsScreen').default}
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
                getComponent={() => require('./screens/UserScreen').default}
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
                getComponent={() => require('./screens/SettingsScreen').default}
                options={{
                  title: 'Settings',
                  headerLargeTitleShadowVisible: false,
                  headerLargeTitle: true,
                  presentation: 'formSheet',
                  // headerLargeStyle: {
                  //   backgroundColor: colors.background2,
                  // },
                  headerTransparent: true,
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
                      style={{
                        width: 36,
                        alignItems: 'center',
                      }}
                    >
                      {/* <Text type="link" bolder>
                        Done
                      </Text> */}
                      <SymbolView name="checkmark" tintColor={colors.text} />
                    </TouchableOpacity>
                  ),
                }}
              />
              <Stack.Screen
                name="Logs"
                getComponent={() => require('./screens/LogsScreen').default}
                options={{
                  headerShown: false,
                  presentation: 'modal',
                }}
              />
              <Stack.Screen
                name="WebViewModal"
                getComponent={() => require('./screens/WebViewScreen').default}
                options={{
                  title: '',
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
                        Done
                      </Text>
                    </TouchableOpacity>
                  ),
                  presentation: 'modal',
                  headerStyle: {
                    backgroundColor: colors.background,
                  },
                }}
              />
              <Stack.Screen
                name="ThreadModal"
                getComponent={() => require('./screens/ThreadScreen').default}
                options={{
                  title: 'Thread',
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
                  presentation: 'formSheet',
                  headerStyle: {
                    backgroundColor: colors.background2,
                  },
                  contentStyle: {
                    backgroundColor: colors.background2,
                  },
                }}
              />
              {__DEV__ && (
                <Stack.Screen
                  name="DevTest"
                  getComponent={() =>
                    require('./screens/DevTestScreen').default
                  }
                />
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </View>
  );
}
