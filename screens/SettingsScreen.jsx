import React, { useState, useEffect } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import * as StoreReview from 'expo-store-review';
import { StatusBar } from 'expo-status-bar';

import { createStackNavigator } from '@react-navigation/stack';
const Stack = createStackNavigator();

import Text from '../components/Text';
import TouchableOpacity from '../components/TouchableOpacity';
import Separator from '../components/Separator';
import OuterSpacer from '../components/OuterSpacer';

import useTheme from '../hooks/useTheme';

import openBrowser from '../utils/openBrowser';

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

  const [canRate, setCanRate] = useState(false);
  useEffect(() => {
    if (Constants.appOwnership === 'expo' || !Constants.isDevice) return;
    StoreReview.isAvailableAsync().then((available) => {
      setCanRate(available);
    });
  }, []);

  function Settings() {
    return (
      <View
        style={{
          backgroundColor: colors.background2,
          flexGrow: 1,
        }}
      >
        <OuterSpacer />
        <Separator />
        <ListItem>
          <Text type="insignificant">No settings available yet.</Text>
        </ListItem>
        <Separator />
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
        <Separator />
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
        {(canRate || !!STORE_URL) && (
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
        <Separator />
        <OuterSpacer size="large" align="top">
          <Text size="footnote" type="insignificant">
            Not affiliated with Hacker News or YCombinator.
          </Text>
          <Text size="footnote" type="insignificant" style={{ marginTop: 16 }}>
            {Constants.manifest.name} {Constants.nativeAppVersion}
          </Text>
          <Text size="footnote" type="insignificant">
            Expo {Constants.expoVersion}
          </Text>
        </OuterSpacer>
      </View>
    );
  }

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
          name="Settings"
          component={Settings}
          options={{
            headerRight,
            headerStyle: {
              height: 56,
              backgroundColor: colors.background,
            },
          }}
        />
      </Stack.Navigator>
    </>
  );
}
