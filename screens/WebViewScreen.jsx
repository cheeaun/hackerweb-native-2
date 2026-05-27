import { useRef, useState } from 'react';
import { Linking } from 'react-native';

import { Stack, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';

import * as Application from 'expo-application';

import useStore from '../hooks/useStore';
import useTheme from '../hooks/useTheme';

export default function WebViewScreen() {
  const { url: paramUrl, jsKey } = useLocalSearchParams();
  const url = paramUrl;
  const routeInjectedJS = useStore((state) => state.routeInjectedJS);
  const injectedJavaScript = jsKey ? routeInjectedJS.get(jsKey) || '' : '';
  if (!url) return null;

  const [navState, setNavState] = useState({});
  const webViewRef = useRef(null);
  const hasInjected = useRef(false);

  const { colors } = useTheme();

  return (
    <>
      <WebView
        ref={webViewRef}
        style={{ flex: 1, backgroundColor: colors.background }}
        applicationNameForUserAgent={`${Application.applicationName}/${Application.nativeApplicationVersion}`}
        source={{ uri: url }}
        originWhitelist={['http://*', 'https://*', 'data:*', 'about:*']}
        decelerationRate="normal"
        startInLoadingState
        allowsBackForwardNavigationGestures
        onNavigationStateChange={(navState) => {
          setNavState(navState);
        }}
        onLoadEnd={() => {
          if (
            jsKey &&
            injectedJavaScript &&
            !hasInjected.current &&
            navState.url?.includes('item?id=')
          ) {
            webViewRef.current?.injectJavaScript(injectedJavaScript);
            hasInjected.current = true;
          }
        }}
        onMessage={() => {}}
      />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="ellipsis">
          {navState.canGoBack && (
            <Stack.Toolbar.MenuAction
              icon="chevron.backward"
              onPress={() => webViewRef.current?.goBack()}
            >
              Back
            </Stack.Toolbar.MenuAction>
          )}
          {navState.canGoForward && (
            <Stack.Toolbar.MenuAction
              icon="chevron.forward"
              onPress={() => webViewRef.current?.goForward()}
            >
              Forward
            </Stack.Toolbar.MenuAction>
          )}
          <Stack.Toolbar.MenuAction
            icon="arrow.clockwise"
            onPress={() => webViewRef.current?.reload()}
          >
            Reload page
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction
            icon="safari"
            onPress={() => Linking.openURL(navState.url || url)}
          >
            Open in browser
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
    </>
  );
}
