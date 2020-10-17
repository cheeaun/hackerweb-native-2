import React from 'react';
import { StyleSheet, View, PlatformColor } from 'react-native';

export default function Separator(props) {
  const { style, vertical, ...otherProps } = props;
  return (
    <View
      style={[
        {
          backgroundColor: PlatformColor('separator'),
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
