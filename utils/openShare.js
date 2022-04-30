import { Share } from 'react-native';

export default function ({ url }) {
  return Share.share({ url });
}
