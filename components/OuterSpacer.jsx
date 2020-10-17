import React from 'react';
import { View } from 'react-native';

export default function ({
  size = 'default',
  align = 'bottom',
  style = {},
  ...props
}) {
  const heights = {
    default: 34,
    large: 48,
  };
  return (
    <View
      style={[
        {
          height: heights[size],
          paddingVertical: 8,
          paddingHorizontal: 15,
          justifyContent: align === 'bottom' ? 'flex-end' : 'flex-start',
        },
        style,
      ]}
      {...props}
    />
  );
}
