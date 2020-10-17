import { Share } from 'react-native';
import * as Haptics from 'expo-haptics';

export default function ({ url }) {
  Haptics.selectionAsync();
  return Share.share({ url });
}
