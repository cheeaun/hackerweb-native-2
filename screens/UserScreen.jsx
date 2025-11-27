import { useCallback, useEffect, useState } from 'react';
import { LayoutAnimation, StyleSheet, View } from 'react-native';

import { format } from 'date-fns/format';
import ky from 'ky';

import ActivityIndicator from '../components/ActivityIndicator';
import HTMLView2 from '../components/HTMLView2';
import Separator from '../components/Separator';
import Text from '../components/Text';
import TouchableOpacity from '../components/TouchableOpacity';

import useStore from '../hooks/useStore';

import openBrowser from '../utils/openBrowser';

const styles = StyleSheet.create({
  container: {
    padding: 15,
  },
  centeredContainer: {
    padding: 30,
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

export default function UserScreen({ route }) {
  const user = route.params;

  const userInfo = useStore(
    useCallback((state) => state.userInfo.get(user) || null, [user]),
  );
  const setUserInfo = useStore((state) => state.setUserInfo);

  const [fetchState, setFetchState] = useState('');
  const [info, setInfo] = useState(userInfo);

  const { created, karma, submitted, about } = info || {};

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

  return (
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
                {typeof karma === 'number'
                  ? karma.toLocaleString('en-US')
                  : ' '}
              </Text>
            </View>
            <Separator vertical />
            <View style={styles.metadataBox}>
              <Label center>Submitted</Label>
              <Text size="title2" bold center>
                {submitted ? submitted.length.toLocaleString('en-US') : ' '}
              </Text>
            </View>
          </View>
          {!!about && (
            <>
              <Separator />
              <View style={styles.about}>
                <Label style={{ marginBottom: 15 }}>About</Label>
                <HTMLView2 html={about} linkify />
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
              onPress={async () => {
                await openBrowser(
                  `https://news.ycombinator.com/user?id=${user}`,
                );
                onClose();
              }}
              style={{ padding: 15 }}
            >
              <Text type="link" center>
                View profile on HN web site
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}
