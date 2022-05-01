import { View } from 'react-native';

import ReadableWidthContainer from './ReadableWidthContainer';

export default function ({
  size = 'default',
  align = 'bottom',
  style = {},
  innerStyle = {},
  ...props
}) {
  const heights = {
    small: 20,
    default: 34,
    large: 48,
  };
  return (
    <View
      style={[
        {
          minHeight: heights[size],
          justifyContent: align === 'bottom' ? 'flex-end' : 'flex-start',
        },
        style,
      ]}
    >
      <ReadableWidthContainer>
        <View
          style={[
            {
              paddingVertical: 8,
              paddingHorizontal: 15,
            },
            innerStyle,
          ]}
          {...props}
        />
      </ReadableWidthContainer>
    </View>
  );
}
