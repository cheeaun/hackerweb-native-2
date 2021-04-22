import React, { useState, useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Alert,
  View,
  ScrollView,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as StoreReview from 'expo-store-review';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { TouchableOpacity } from 'react-native-gesture-handler';
import * as MailComposer from 'expo-mail-composer';
import * as Device from 'expo-device';

import Text from '../components/Text';
import Separator from '../components/Separator';
import OuterSpacer from '../components/OuterSpacer';
import ReadableWidthContainer from '../components/ReadableWidthContainer';

import useTheme from '../hooks/useTheme';
import useStore from '../hooks/useStore';

import openBrowser from '../utils/openBrowser';

const HEADER_HEIGHT = 56;
const EMAIL = 'cheeaun+hackerweb@gmail.com';

function ListMenu(props) {
  return (
    <ReadableWidthContainer>
      <View
        {...props}
        style={{ marginHorizontal: 15, borderRadius: 8, overflow: 'hidden' }}
      />
    </ReadableWidthContainer>
  );
}

function ListItem({ style = {}, ...props }) {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);
  const styles = {
    padding: 15,
    backgroundColor: colors.background,
  };

  return (
    <Pressable
      disabled={!props.onPress || props.disabled}
      unstable_pressDelay={130}
      onPressIn={() => {
        setPressed(true);
      }}
      onPressOut={() => {
        setPressed(false);
      }}
      style={[
        styles,
        pressed && {
          backgroundColor: colors.secondaryBackground,
        },
        style,
      ]}
      {...props}
    />
  );
}

const ListItemSeparator = () => (
  <Separator style={{ marginLeft: 15, marginTop: -StyleSheet.hairlineWidth }} />
);

export default function SettingsScreen({ navigation }) {
  const { isDark, colors } = useTheme();
  const { releaseChannel, updateId, reloadAsync } = Updates;

  const [canRate, setCanRate] = useState(false);
  useEffect(() => {
    if (Constants.appOwnership === 'expo') return;
    StoreReview.hasAction().then((hasAction) => {
      setCanRate(hasAction);
    });
  }, []);

  const updateIsAvailable = useStore((state) => state.updateIsAvailable);

  const [canComposeMail, setCanComposeMail] = useState(false);
  MailComposer.isAvailableAsync().then((isAvailable) => {
    setCanComposeMail(isAvailable);
  });

  return (
    <>
      {!isDark && <StatusBar style="inverted" animated />}
      <View
        style={{
          backgroundColor: colors.background,
          height: HEADER_HEIGHT,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomColor: colors.separator,
          borderBottomWidth: StyleSheet.hairlineWidth,
        }}
      >
        {/* Start Faux Spacer */}
        <Text style={{ paddingHorizontal: 15, color: 'transparent' }}>
          Done
        </Text>
        {/* End Faux Spacer */}
        <View style={{ padding: 15 }}>
          <Text bolder style={{ textAlign: 'center' }}>
            Settings
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
      <ScrollView contentInsetAdjustmentBehavior="automatic">
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
          <ListItemSeparator />
          <ListItem
            onPress={() =>
              openBrowser('http://github.com/cheeaun/hackerweb-native-2')
            }
          >
            <Text type="link">Open-sourced on GitHub</Text>
          </ListItem>
          <ListItemSeparator />
          {!__PRODUCTION__ && (
            <>
              <ListItem
                onPress={() =>
                  openBrowser('https://www.buymeacoffee.com/cheeaun')
                }
              >
                <Text type="link">Buy me a coffee</Text>
              </ListItem>
              <ListItemSeparator />
            </>
          )}
          {canRate && (
            <>
              <ListItem
                onPress={() => {
                  // Temporary solution
                  // TODO: Remove this when create new prod build
                  Linking.openURL(
                    'https://apps.apple.com/app/id1084209377?action=write-review',
                  );
                  // StoreReview.requestReview();
                }}
              >
                <Text type="link">Rate {Constants.manifest.name}</Text>
              </ListItem>
              <ListItemSeparator />
            </>
          )}
          <ListItem
            onPress={() => {
              const subject = `${Constants.manifest.name} feedback`;
              const body = `

              ---
              Additional Info (don't remove):
              ${Constants.manifest.name} ${Constants.nativeAppVersion} (${
                Constants.nativeBuildVersion
              })
              Update: ${updateId || '—'}
              Channel: ${releaseChannel || '—'}
              Expo ${Constants.expoVersion}
              ${Device.modelName} (${Device.osName} ${Device.osVersion})
              `;

              if (canComposeMail) {
                MailComposer.composeAsync({
                  recipients: [EMAIL],
                  subject,
                  body: body.replace(/\n/g, '<br>'),
                  isHtml: true,
                });
                // By right, should be isHTML: false, but somehow MailComposer munches all the spaces
                // and new lines automagically. Thus, this faux HTML hack.
              } else {
                // Actually Gmail collapse all new lines and spaces too 😅
                Linking.openURL(
                  `mailto:${EMAIL}?subject=${encodeURIComponent(
                    subject,
                  )}&body=${encodeURIComponent(body)}`,
                );
              }
            }}
          >
            <Text type="link">Share Feedback</Text>
          </ListItem>
          <ListItemSeparator />
          <ListItem
            onPress={() => openBrowser('https://hackerwebapp.com/privacy.md')}
          >
            <Text type="link">Privacy Policy</Text>
          </ListItem>
        </ListMenu>
        <OuterSpacer align="top">
          <Text size="footnote" type="insignificant">
            Not affiliated with Hacker News or YCombinator.
          </Text>
        </OuterSpacer>
        <OuterSpacer>
          <Text
            size="footnote"
            type="insignificant"
            style={{
              textTransform: 'uppercase',
            }}
          >
            Debugging
          </Text>
        </OuterSpacer>
        <ListMenu>
          <ListItem
            onPress={async () => {
              try {
                await AsyncStorage.clear();
              } catch (e) {}
              Alert.alert('Cache cleared.');
            }}
          >
            <Text type="link">Clear Cache</Text>
          </ListItem>
          {!__PRODUCTION__ && (
            <>
              <ListItemSeparator />
              <ListItem
                onPress={() => {
                  navigation.push('Logs');
                }}
              >
                <Text type="link">Logs</Text>
              </ListItem>
            </>
          )}
        </ListMenu>
        <OuterSpacer align="top">
          <Text size="footnote" type="insignificant">
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
      </ScrollView>
    </>
  );
}
