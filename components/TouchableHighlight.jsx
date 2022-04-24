import { useState } from 'react';
import { PlatformColor, Pressable } from 'react-native';

export default function (props) {
  const { style, ...otherProps } = props;
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      {...otherProps}
      onPressIn={() => {
        setPressed(true);
      }}
      onPressOut={() => {
        setPressed(false);
      }}
      style={[
        style,
        {
          padding: 2,
          borderRadius: 5,
          margin: -2,
        },
        pressed && {
          backgroundColor: PlatformColor('opaqueSeparator'),
        },
      ]}
    />
  );
}
