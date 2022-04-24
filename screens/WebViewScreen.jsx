import { useLayoutEffect, useState } from 'react';

import { useNavigation, useRoute } from '@react-navigation/native';
import { View, WebView } from 'react-native-webview';

import * as Application from 'expo-application';

import Text from '../components/Text';

import useTheme from '../hooks/useTheme';

export default function WebViewScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { url } = route.params;
  if (!url) return null;

  const [navState, setNavState] = useState({});

  useLayoutEffect(() => {
    navigation.setOptions({
      title: navState.url || url,
    });
  }, [navState, url]);

  return (
    <WebView
      style={{ backgroundColor: colors.background }}
      applicationNameForUserAgent={`${Application.applicationName}/${Application.nativeApplicationVersion}`}
      source={{ uri: url }}
      originWhitelist={['http://*', 'https://*', 'data:*', 'about:*']}
      decelerationRate="normal"
      renderLoading={() => null}
      onNavigationStateChange={(navState) => {
        setNavState(navState);
      }}
    />
  );
}
