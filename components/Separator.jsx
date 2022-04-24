import { StyleSheet, View } from 'react-native';

import useTheme from '../hooks/useTheme';

export default function Separator(props) {
  const { colors } = useTheme();
  const { style, vertical, opaque, ...otherProps } = props;
  return (
    <View
      style={[
        {
          backgroundColor: opaque ? colors.opaqueSeparator : colors.separator,
        },
        vertical
          ? {
              width: StyleSheet.hairlineWidth,
            }
          : {
              height: StyleSheet.hairlineWidth,
            },
        style,
      ]}
      {...otherProps}
    />
  );
}
