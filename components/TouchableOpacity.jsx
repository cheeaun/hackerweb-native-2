import { useState } from 'react';
import { Pressable } from 'react-native';

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
        {
          opacity: pressed ? 0.5 : 1,
        },
        style,
      ]}
    />
  );
}
