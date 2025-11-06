import { useLayoutEffect, useRef, useState } from 'react';
import { ActionSheetIOS, View, findNodeHandle } from 'react-native';

import { useNavigation, useRoute } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { WebView } from 'react-native-webview';

import * as Application from 'expo-application';
import { SymbolView } from 'expo-symbols';

import Text from '../components/Text';

import useTheme from '../hooks/useTheme';

export default function WebViewScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { url, injectedJavaScript = '' } = route.params;
  if (!url) return null;

  const [navState, setNavState] = useState({});
  const webButtonRef = useRef();
  const webViewRef = useRef();

  useLayoutEffect(() => {
    if (!navState?.url) return;
    const pageTitle = navState.title;
    const pageURL = navState.url;

    const options = [
      navState.canGoBack && {
        text: 'Back',
        action: () => {
          webViewRef.current?.goBack();
        },
      },
      navState.canGoForward && {
        text: 'Forward',
        action: () => {
          webViewRef.current?.goForward();
        },
      },
      {
        text: 'Reload page',
        action: () => {
          webViewRef.current?.reload();
        },
      },
      {
        text: 'Open in browser',
        action: () => {
          Linking.openURL(pageURL);
        },
      },
      {
        text: 'Cancel',
        cancel: true,
      },
    ].filter(Boolean);

    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          ref={webButtonRef}
          onPress={() => {
            ActionSheetIOS.showActionSheetWithOptions(
              {
                title: pageTitle,
                message: pageURL,
                options: options.map((o) => o.text),
                cancelButtonIndex: options.findIndex((o) => o.cancel),
                anchor: findNodeHandle(webButtonRef.current),
              },
              (index) => {
                options[index].action?.();
              },
            );
          }}
          hitSlop={{
            top: 44,
            right: 44,
            bottom: 44,
            left: 44,
          }}
        >
          <SymbolView name="ellipsis" tintColor={colors.text} />
        </TouchableOpacity>
      ),
      headerTitle: () => (
        <View
          style={{
            flex: 1,
            flexGrow: 0.75,
            transform: [
              {
                translateX: -5,
              },
            ],
          }}
          pointerEvents="none"
        >
          {!!pageTitle && (
            <Text
              size="subhead"
              bold
              center
              numberOfLines={1}
              allowFontScaling={false}
            >
              {pageTitle}
            </Text>
          )}
          <Text
            center
            size="footnote"
            numberOfLines={pageTitle ? 1 : 2}
            allowFontScaling={false}
            ellipsizeMode="middle"
          >
            {pageURL}
          </Text>
        </View>
      ),
    });
  }, [navState, url]);

  return (
    <WebView
      ref={webViewRef}
      style={{ backgroundColor: colors.background }}
      applicationNameForUserAgent={`${Application.applicationName}/${Application.nativeApplicationVersion}`}
      source={{ uri: url }}
      originWhitelist={['http://*', 'https://*', 'data:*', 'about:*']}
      decelerationRate="normal"
      startInLoadingState
      allowsBackForwardNavigationGestures
      onNavigationStateChange={(navState) => {
        setNavState(navState);
      }}
      onMessage={() => {}} // Required for injectedJavaScript to work
      injectedJavaScript={injectedJavaScript}
    />
  );
}
