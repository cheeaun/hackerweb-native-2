import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as MailComposer from 'expo-mail-composer';
import * as StoreReview from 'expo-store-review';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';

import OuterSpacer from '../components/OuterSpacer';
import ReadableWidthContainer from '../components/ReadableWidthContainer';
import Separator from '../components/Separator';
import Text from '../components/Text';

import useStore from '../hooks/useStore';
import useTheme from '../hooks/useTheme';

import openBrowser from '../utils/openBrowser';

const EMAIL = 'cheeaun+hackerweb@gmail.com';

function ListMenu(props) {
  return (
    <ReadableWidthContainer>
      <View
        {...props}
        style={{ marginHorizontal: 15, borderRadius: 12, overflow: 'hidden' }}
      />
    </ReadableWidthContainer>
  );
}

function ListItem({ style = {}, ...props }) {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);
  const styles = {
    paddingHorizontal: 15,
    paddingVertical: 13,
    backgroundColor: colors.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
          backgroundColor: colors.fill,
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
  const { isDark } = useTheme();
  const { releaseChannel, updateId, reloadAsync } = Updates;

  const [canRate, setCanRate] = useState(false);
  useEffect(() => {
    if (Constants.appOwnership === 'expo') return;
    StoreReview.hasAction().then((hasAction) => {
      setCanRate(hasAction);
    });
  }, []);

  const updateIsAvailable = useStore((state) => state.updateIsAvailable);
  const settingsInteractions = useStore((state) => state.settings.interactions);
  const settingsSyntaxHighlighting = useStore(
    (state) => state.settings.syntaxHighlighting,
  );
  const setSetting = useStore((state) => state.setSetting);
  const fetchMinimalItem = useStore((state) => state.fetchMinimalItem);

  const [canComposeMail, setCanComposeMail] = useState(false);
  MailComposer.isAvailableAsync().then((isAvailable) => {
    setCanComposeMail(isAvailable);
  });

  return (
    <>
      {!isDark && <StatusBar style="inverted" animated />}
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <OuterSpacer />
        <ListMenu>
          <ListItem>
            <Text>
              <Text>Syntax highlighting</Text>
            </Text>
            <Switch
              value={settingsSyntaxHighlighting}
              onValueChange={(value) => {
                console.log({ value });
                setSetting('syntaxHighlighting', value);
              }}
            />
          </ListItem>
        </ListMenu>
        <OuterSpacer align="top" innerStyle={{ paddingHorizontal: 30 }}>
          <Text
            size="footnote"
            type="insignificant"
            style={{ marginBottom: 8 }}
          >
            Syntax highlighting for code blocks, with best-effort automatic
            detection of languages.
          </Text>
        </OuterSpacer>
        <ListMenu>
          <ListItem>
            <Text>Allow interactions</Text>
            <Switch
              value={settingsInteractions}
              onValueChange={(value) => {
                console.log({ value });
                setSetting('interactions', value);
              }}
            />
          </ListItem>
        </ListMenu>
        <OuterSpacer align="top" innerStyle={{ paddingHorizontal: 30 }}>
          <Text
            size="footnote"
            type="insignificant"
            style={{ marginBottom: 8 }}
          >
            Interactions include upvoting and replying. This works by opening a
            web view to load Hacker News web site with interactions set in the
            URL.
          </Text>
          <Text size="footnote" type="insignificant">
            Login information and session are stored in the web view, not the
            app itself.
          </Text>
        </OuterSpacer>
        {/* <ListMenu>
          <ListItem>
            <Text type="insignificant">No settings available yet</Text>
          </ListItem>
        </ListMenu> */}
        <OuterSpacer innerStyle={{ paddingHorizontal: 30 }}>
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
                  if (__PRODUCTION__) {
                    StoreReview.requestReview();
                  } else {
                    Linking.openURL(
                      'https://apps.apple.com/app/id1084209377?action=write-review',
                    );
                  }
                }}
              >
                <Text type="link">Rate {Constants.manifest.name}…</Text>
              </ListItem>
              <ListItemSeparator />
            </>
          )}
          <ListItem
            onPress={() => {
              const subject = `${Application.applicationName} feedback`;
              const body = `

              ---
              Additional Info (don't remove):
              ${Application.applicationName} ${
                Application.nativeApplicationVersion
              } (${Application.nativeBuildVersion})
              Update: ${updateId || '—'}
              Channel: ${releaseChannel || '—'}
              Expo ${Constants.expoVersion || '-'}
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
            <Text type="link">Share Feedback…</Text>
          </ListItem>
          <ListItemSeparator />
          <ListItem
            onPress={() => openBrowser('https://hackerwebapp.com/privacy.md')}
          >
            <Text type="link">Privacy Policy</Text>
          </ListItem>
        </ListMenu>
        <OuterSpacer align="top" innerStyle={{ paddingHorizontal: 30 }}>
          <Text size="footnote" type="insignificant">
            Not affiliated with Hacker News or YCombinator.
          </Text>
        </OuterSpacer>
        <OuterSpacer innerStyle={{ paddingHorizontal: 30 }}>
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
            onPress={() => {
              Alert.prompt(
                'Open Story',
                'Enter a HN story ID',
                (itemId) => {
                  if (!itemId) return;
                  fetchMinimalItem(+itemId)
                    .then((item) => {
                      if (item?.type === 'story' || item?.type === 'poll') {
                        navigation.push('StoryModal', {
                          id: item.id,
                          tab: 'comments',
                        });
                      } else {
                        Alert.alert(
                          'Not a story',
                          'Please enter a valid HN story ID',
                        );
                      }
                    })
                    .catch((e) => {
                      Alert.alert('An error occured', e?.toString());
                    });
                },
                'plain-text',
                null,
                'numeric',
              );
            }}
          >
            <Text type="link">Open Story…</Text>
          </ListItem>
          <ListItemSeparator />
          <ListItem
            onPress={() => {
              Alert.prompt(
                'Are you sure?',
                'This is usually meant for debugging issues.',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await AsyncStorage.clear();
                        Alert.alert('Cache cleared.');
                      } catch (e) {}
                    },
                  },
                ],
                'default',
              );
            }}
          >
            <Text>Clear Cache…</Text>
          </ListItem>
          {!__PRODUCTION__ && (
            <>
              <ListItemSeparator />
              <ListItem
                onPress={() => {
                  navigation.push('Logs');
                }}
              >
                <Text>Logs</Text>
              </ListItem>
            </>
          )}
        </ListMenu>
        <OuterSpacer align="top" innerStyle={{ paddingHorizontal: 30 }}>
          <Text size="footnote" type="insignificant">
            {Application.applicationName} {Application.nativeApplicationVersion}{' '}
            ({Application.nativeBuildVersion})
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
          {Constants.expoVersion && (
            <Text size="footnote" type="insignificant">
              Expo {Constants.expoVersion}
            </Text>
          )}
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
