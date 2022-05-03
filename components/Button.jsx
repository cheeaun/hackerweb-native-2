import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  button: {
    padding: 12,
    borderRadius: 15,
  },
});

export default function (props) {
  const { style, pressedStyle, disabled, ...otherProps } = props;
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
        styles.button,
        style,
        disabled && {
          opacity: 0.3,
        },
        pressed && pressedStyle,
      ]}
    />
  );
}
