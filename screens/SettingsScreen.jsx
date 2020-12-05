import React, { useState, useEffect } from 'react';
import { Pressable, StyleSheet, Alert, View } from 'react-native';
import Constants from 'expo-constants';
import * as StoreReview from 'expo-store-review';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { createStackNavigator } from '@react-navigation/stack';
const Stack = createStackNavigator();

import Text from '../components/Text';
import Separator from '../components/Separator';
import OuterSpacer from '../components/OuterSpacer';

import useTheme from '../hooks/useTheme';
import useStore from '../hooks/useStore';

import openBrowser from '../utils/openBrowser';

function ListMenu(props) {
  return (
    <View
      {...props}
      style={{ marginHorizontal: 15, borderRadius: 8, overflow: 'hidden' }}
    />
  );
}

function ListItem({ style = {}, ...props }) {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPressIn={() => {
        setPressed(true);
      }}
      onPressOut={() => {
        setPressed(false);
      }}
      style={[
        {
          padding: 15,
          backgroundColor: colors.background,
        },
        pressed && {
          backgroundColor: colors.secondaryBackground,
        },
        style,
      ]}
      {...props}
    />
  );
}

const STORE_URL = StoreReview.storeUrl();

export default function SettingsScreen({ navigation }) {
  const { isDark, colors } = useTheme();
  const { releaseChannel, updateId, reloadAsync } = Updates;

  const [canRate, setCanRate] = useState(false);
  useEffect(() => {
    if (Constants.appOwnership === 'expo' || !Constants.isDevice) return;
    Promise.all([StoreReview.hasAction(), StoreReview.isAvailableAsync()]).then(
      ([hasAction, isAvailable]) => {
        setCanRate(hasAction && isAvailable);
      },
    );
  }, []);

  const updateIsAvailable = useStore((state) => state.updateIsAvailable);

  function Settings() {
    return (
      <>
        <OuterSpacer />
        <ListMenu>
          <ListItem>
            <Text type="insignificant">No settings available yet.</Text>
          </ListItem>
        </ListMenu>
        <OuterSpacer size="large">
          <Text
            size="footnote"
            type="insignificant"
            style={{
              textTransform: 'uppercase',
            }}
          >
            About
          </Text>
        </OuterSpacer>
        <ListMenu>
          <ListItem onPress={() => openBrowser('https://twitter.com/cheeaun')}>
            <Text type="link">Made by @cheeaun</Text>
          </ListItem>
          <Separator
            style={{ marginLeft: 15, marginTop: -StyleSheet.hairlineWidth }}
          />
          <ListItem
            onPress={() =>
              openBrowser('http://github.com/cheeaun/hackerweb-native-2')
            }
          >
            <Text type="link">Open-sourced on GitHub</Text>
          </ListItem>
          <Separator
            style={{ marginLeft: 15, marginTop: -StyleSheet.hairlineWidth }}
          />
          {/production/i.test(releaseChannel) && (canRate || !!STORE_URL) && (
            <>
              <ListItem
                onPress={() => {
                  if (canRate) {
                    StoreReview.requestReview();
                  } else if (STORE_URL) {
                    openBrowser(STORE_URL);
                  }
                }}
              >
                <Text type="link">Rate {Constants.manifest.name}</Text>
              </ListItem>
              <Separator
                style={{ marginLeft: 15, marginTop: -StyleSheet.hairlineWidth }}
              />
            </>
          )}
          <ListItem
            onPress={() => openBrowser('https://hackerwebapp.com/privacy.md')}
          >
            <Text type="link">Privacy Policy</Text>
          </ListItem>
        </ListMenu>
        <OuterSpacer size="large" align="top">
          <Text size="footnote" type="insignificant">
            Not affiliated with Hacker News or YCombinator.
          </Text>
          <Text size="footnote" type="insignificant" style={{ marginTop: 16 }}>
            {Constants.manifest.name} {Constants.nativeAppVersion} (
            {Constants.nativeBuildVersion})
          </Text>
          {updateId && (
            <Text size="footnote" type="insignificant">
              Update: {updateId}
            </Text>
          )}
          {releaseChannel && (
            <Text size="footnote" type="insignificant">
              Channel: {releaseChannel}
            </Text>
          )}
          <Text size="footnote" type="insignificant">
            Expo {Constants.expoVersion}
          </Text>
          {updateIsAvailable && (
            <Text
              size="footnote"
              type="link"
              style={{ marginTop: 16 }}
              onPress={() => {
                Alert.alert('Update app', 'Install the latest update now?', [
                  {
                    text: 'OK',
                    onPress: () => {
                      reloadAsync();
                    },
                  },
                  { text: 'Cancel', style: 'cancel' },
                ]);
              }}
            >
              Update available.
            </Text>
          )}
        </OuterSpacer>
      </>
    );
  }

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
          headerRight,
          headerStyle: {
            height: 56,
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="Settings" component={Settings} />
      </Stack.Navigator>
    </>
  );
}
