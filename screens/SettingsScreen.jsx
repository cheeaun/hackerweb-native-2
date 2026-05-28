import { useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { useRouter } from 'expo-router';

import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as MailComposer from 'expo-mail-composer';
import * as StoreReview from 'expo-store-review';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';

import {
  Host,
  Form,
  Section,
  Toggle,
  Button,
  Text as SwiftUIText,
} from '@expo/ui/swift-ui';
import { buttonStyle } from '@expo/ui/swift-ui/modifiers';

import useStore from '../hooks/useStore';
import useTheme from '../hooks/useTheme';

import openBrowser from '../utils/openBrowser';

const EMAIL = 'cheeaun+hackerweb@gmail.com';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { channel, updateId, reloadAsync } = Updates;

  const [canRate, setCanRate] = useState(false);
  useEffect(() => {
    StoreReview.hasAction().then((hasAction) => {
      setCanRate(hasAction);
    });
  }, []);

  const setUpdateIsAvailable = useStore((state) => state.setUpdateIsAvailable);
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
      <Host style={{ flex: 1 }} colorScheme={isDark ? 'dark' : 'light'}>
        <Form>
          <Section
            footer={
              <SwiftUIText>
                Syntax highlighting for code blocks, with best-effort automatic
                detection of languages.
              </SwiftUIText>
            }
          >
            <Toggle
              isOn={settingsSyntaxHighlighting}
              onIsOnChange={(value) => {
                console.log({ value });
                setSetting('syntaxHighlighting', value);
              }}
              label="Syntax highlighting (beta)"
            />
          </Section>

          <Section
            footer={
              <SwiftUIText>
                Interactions include upvoting and replying. This works by
                opening a web view to load Hacker News web site with
                interactions set in the URL.{'\n\n'}Login information and
                session are stored in the web view, not the app itself.
              </SwiftUIText>
            }
          >
            <Toggle
              isOn={settingsInteractions}
              onIsOnChange={(value) => {
                console.log({ value });
                setSetting('interactions', value);
              }}
              label="Allow interactions"
            />
          </Section>

          <Section
            title="About"
            footer={
              <SwiftUIText>
                Not affiliated with Hacker News or YCombinator.
              </SwiftUIText>
            }
          >
            <Button
              onPress={() => openBrowser('https://github.com/cheeaun')}
              label="Made by @cheeaun"
            />
            <Button
              onPress={() =>
                openBrowser('http://github.com/cheeaun/hackerweb-native-2')
              }
              label="Open-sourced on GitHub"
            />
            {!__PRODUCTION__ && (
              <Button
                onPress={() =>
                  openBrowser('https://www.buymeacoffee.com/cheeaun')
                }
                label="Buy me a coffee"
              />
            )}
            {canRate && (
              <Button
                onPress={() => {
                  if (__PRODUCTION__) {
                    StoreReview.requestReview();
                  } else {
                    Linking.openURL(
                      'https://apps.apple.com/app/id1084209377?action=write-review',
                    );
                  }
                }}
                label={`Rate ${Constants.expoConfig.name}…`}
              />
            )}
            <Button
              onPress={() => {
                const subject = `${Application.applicationName} feedback`;
                const body = `

              ---
              Additional Info (don't remove):
              ${Application.applicationName} ${
                Application.nativeApplicationVersion
              } (${Application.nativeBuildVersion})
              Update: ${updateId || '—'}
              Channel: ${channel || '—'}
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
                } else {
                  Linking.openURL(
                    `mailto:${EMAIL}?subject=${encodeURIComponent(
                      subject,
                    )}&body=${encodeURIComponent(body)}`,
                  );
                }
              }}
              label="Share Feedback…"
            />
            <Button
              onPress={() => openBrowser('https://hackerwebapp.com/privacy.md')}
              label="Privacy Policy"
            />
          </Section>

          <Section title="Debugging">
            <Button
              modifiers={[buttonStyle('plain')]}
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
              label="Clear Cache…"
            />
          </Section>

          {!__PRODUCTION__ && (
            <Section>
              <Button
                modifiers={[buttonStyle('plain')]}
                onPress={() => {
                  router.push('/logs');
                }}
                label="Logs"
              />
              <Button
                onPress={() => {
                  Alert.prompt(
                    'Open Story',
                    'Enter a HN story ID',
                    (itemId) => {
                      if (!itemId) return;
                      fetchMinimalItem(+itemId)
                        .then((item) => {
                          if (item?.type === 'story' || item?.type === 'poll') {
                            router.push(`/story-modal/${item.id}?tab=comments`);
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
                label="Open Story…"
              />
              <Button
                onPress={() => {
                  Updates.checkForUpdateAsync()
                    .then(({ isAvailable }) => {
                      if (isAvailable) {
                        Updates.fetchUpdateAsync()
                          .then(({ isNew }) => {
                            if (isNew) {
                              Alert.alert('Bundle is new');
                              setUpdateIsAvailable(true);
                            } else {
                              Alert.alert('Bundle is old');
                            }
                          })
                          .catch((e) => {
                            Alert.alert('An error occured', e?.toString());
                          });
                      } else {
                        Alert.alert('No updates available');
                      }
                    })
                    .catch((e) => {
                      Alert.alert('An error occured', e?.toString());
                    });
                }}
                label="Check for Updates…"
              />
            </Section>
          )}

          <Section
            footer={
              <SwiftUIText>
                {`${Application.applicationName} ${Application.nativeApplicationVersion} (${Application.nativeBuildVersion})${updateId ? `\nUpdate: ${updateId}` : ''}${channel ? `\nChannel: ${channel}` : ''}${Constants.expoVersion ? `\nExpo ${Constants.expoVersion}` : ''}`}
              </SwiftUIText>
            }
          />

          {updateIsAvailable && (
            <Section>
              <Button
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
                label="Update available."
              />
            </Section>
          )}
        </Form>
      </Host>
    </>
  );
}
