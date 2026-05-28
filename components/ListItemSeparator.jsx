import { StyleSheet } from 'react-native';

import Separator from './Separator';

export default function ListItemSeparator() {
  return (
    <Separator
      style={{
        marginLeft: 15,
        marginRight: 15,
        marginTop: -StyleSheet.hairlineWidth,
      }}
    />
  );
}