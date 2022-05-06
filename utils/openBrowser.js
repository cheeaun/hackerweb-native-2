import { Alert } from 'react-native';

import * as WebBrowser from 'expo-web-browser';

export default function (url) {
  return WebBrowser.openBrowserAsync(url, {
    enableBarCollapsing: true,
    presentationStyle: 'automatic',
  }).catch((e) => {
    Alert.alert('An error occured', e.message || e.toString());
  });
}
