import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, LayoutAnimation } from 'react-native';
import ky from 'ky';
import format from 'date-fns/format';
import { Modalize } from 'react-native-modalize';
import * as Haptics from 'expo-haptics';

import Text from '../components/Text';
import Separator from '../components/Separator';
import HTMLView from '../components/HTMLView';
import TouchableOpacity from '../components/TouchableOpacity';
import ActivityIndicator from '../components/ActivityIndicator';

import useStore from '../hooks/useStore';
import useTheme from '../hooks/useTheme';

import openBrowser from '../utils/openBrowser';

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  container: {
    padding: 15,
  },
  centeredContainer: {
    padding: 30,
  },
  sheet: {
    borderTopStartRadius: 15,
    borderTopEndRadius: 15,
    padding: 15,
  },
  header: {
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metadata: {
    flexDirection: 'row',
    paddingVertical: 15,
    justifyContent: 'space-evenly',
  },
  metadataBox: {},
  label: {
    marginBottom: 8,
  },
  about: {
    paddingTop: 15,
    paddingBottom: 15,
  },
});

function Label({ style, ...props }) {
  return (
    <Text
      type="insignificant"
      size="caption2"
      bold
      style={[styles.label, { textTransform: 'uppercase' }, style]}
      {...props}
    />
  );
}

export default function UserScreen({ route, navigation }) {
  const user = route.params;

  const { colors } = useTheme();

  const userInfo = useStore(
    useCallback((state) => state.userInfo.get(user) || null, [user]),
  );
  const setUserInfo = useStore((state) => state.setUserInfo);

  const [fetchState, setFetchState] = useState('');
  const [info, setInfo] = useState(userInfo);
  const modalRef = useRef(null);

  useEffect(
    useCallback(() => {
      if (!user || info) return;
      let ignore = false;
      setFetchState('loading');
      ky(
        `https://hacker-news.firebaseio.com/v0/user/${encodeURIComponent(
          user,
        )}.json`,
      )
        .json()
        .then((data) => {
          if (ignore) return;
          setInfo(data);
          setUserInfo(user, data);
          setFetchState('success');
        })
        .catch(() => {
          if (ignore) return;
          setFetchState('error');
        })
        .finally(() => {
          if (ignore) return;
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        });

      return () => {
        ignore = true;
      };
    }, [user]),
    [user],
  );

  useEffect(() => {
    modalRef.current?.open();
    Haptics.selectionAsync();
  }, []);

  const onClose = () => {
    modalRef.current?.close();
  };

  const onClosed = () => {
    // Run this later because Modalize needs to run some cleanup code first
    // *before* navigation.pop() unmounts this screen
    setImmediate(() => navigation.pop());
  };

  const { created, karma, submitted, about } = info || {};

  return (
    <Modalize
      ref={modalRef}
      snapPoint={300}
      modalHeight={500}
      onClosed={onClosed}
      handlePosition="inside"
      handleStyle={{
        backgroundColor: colors.fill,
      }}
      modalStyle={{
        backgroundColor: colors.background,
      }}
      overlayStyle={{
        backgroundColor: colors.overlay,
      }}
      HeaderComponent={() => (
        <View style={[styles.container, styles.header]}>
          <Text size="title2" bold numberOfLines={1} style={{ flex: 1 }}>
            {user}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text type="link" bold>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      )}
    >
      <View style={[styles.container, { paddingTop: 0 }]}>
        <Separator />
        {fetchState === 'error' ? (
          <View style={styles.centeredContainer}>
            <Text>Unable to get user information.</Text>
          </View>
        ) : (
          <>
            <View style={styles.metadata}>
              <View
                style={styles.metadataBox}
                onStartShouldSetResponder={() => true}
              >
                <Label center>Created</Label>
                {created ? (
                  <Text size="title3" bold center>
                    {format(new Date(created * 1000), 'd LLL yyyy')}
                  </Text>
                ) : (
                  <Text size="title3" bold center style={{ opacity: 0 }}>
                    16 Feb 2012
                  </Text>
                )}
              </View>
              <Separator vertical />
              <View style={styles.metadataBox}>
                <Label center>Karma</Label>
                <Text size="title2" bold center>
                  {karma ? karma.toLocaleString() : ' '}
                </Text>
              </View>
              <Separator vertical />
              <View style={styles.metadataBox}>
                <Label center>Submitted</Label>
                <Text size="title2" bold center>
                  {submitted ? submitted.length.toLocaleString() : ' '}
                </Text>
              </View>
            </View>
            {!!about && (
              <>
                <Separator />
                <View style={styles.about}>
                  <Label style={{ marginBottom: 15 }}>About</Label>
                  <HTMLView html={about} linkify />
                </View>
              </>
            )}
            <Separator />
            {fetchState === 'loading' ? (
              <View style={{ padding: 15 }}>
                <ActivityIndicator />
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  openBrowser(`https://news.ycombinator.com/user?id=${user}`);
                  onClose();
                }}
                style={{ padding: 15 }}
              >
                <Text type="link" center style={{ opacity: 0.5 }}>
                  View profile on HN web site
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </Modalize>
  );
}
