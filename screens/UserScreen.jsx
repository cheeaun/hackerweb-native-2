import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LayoutAnimation,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Modalize } from 'react-native-modalize';

import * as Haptics from 'expo-haptics';

import format from 'date-fns/format';
import ky from 'ky';

import ActivityIndicator from '../components/ActivityIndicator';
import HTMLView2 from '../components/HTMLView2';
import Separator from '../components/Separator';
import Text from '../components/Text';
import TouchableOpacity from '../components/TouchableOpacity';

import useStore from '../hooks/useStore';
import useTheme from '../hooks/useTheme';
import useViewport from '../hooks/useViewport';

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

  // For tablet
  const [visible, setVisible] = useState(true);
  const { exceedsReadableWidth, underViewableHeight } = useViewport();

  useEffect(() => {
    modalRef.current?.open();
    // Haptics.selectionAsync();
  }, []);

  const onClose = () => {
    modalRef.current?.close();
    setVisible(false);
  };

  const onClosed = () => {
    // Run this later because Modalize needs to run some cleanup code first
    // *before* navigation.pop() unmounts this screen
    setImmediate(() => navigation.pop());
  };

  useEffect(
    useCallback(() => {
      if (!visible && exceedsReadableWidth) {
        onClosed();
      }
    }, [visible, exceedsReadableWidth]),
    [visible],
  );

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

  const HeaderComponent = useCallback(
    () => (
      <View
        style={[
          styles.container,
          styles.header,
          underViewableHeight && { paddingBottom: 8 },
        ]}
      >
        <Text
          size={underViewableHeight ? 'title3' : 'title2'}
          bold
          numberOfLines={1}
          style={{ flex: 1 }}
        >
          {user}
        </Text>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{
            top: 44,
            right: 44,
            bottom: 44,
            left: 44,
          }}
        >
          <Text type="link" bolder>
            Close
          </Text>
        </TouchableOpacity>
      </View>
    ),
    [user],
  );

  const ContentComponent = useCallback(
    () => (
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
                  {typeof submitted === 'number'
                    ? submitted.length.toLocaleString('en-US')
                    : ' '}
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
    ),
    [fetchState, created, karma, submitted, about],
  );

  if (exceedsReadableWidth) {
    return (
      <Modal
        supportedOrientations={['portrait', 'landscape']}
        animationType="fade"
        visible={visible}
        transparent
        onRequestClose={onClose}
      >
        <Pressable
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.opaqueBackground,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 5,
            },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 3,
          }}
          onPress={onClose}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 16,
              width: 480,
              maxWidth: '98%',
              maxHeight: '80%',
            }}
          >
            <HeaderComponent />
            <ScrollView style={{ flexGrow: 0 }}>
              <View onStartShouldSetResponder={() => true}>
                <ContentComponent />
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    );
  }

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
      HeaderComponent={HeaderComponent}
    >
      <ContentComponent />
    </Modalize>
  );
}
