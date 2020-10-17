import * as WebBrowser from 'expo-web-browser';

export default function (url) {
  return WebBrowser.openBrowserAsync(url, {
    enableBarCollapsing: true,
  });
}
