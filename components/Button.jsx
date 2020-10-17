import React, { useState } from 'react';
import { StyleSheet, Pressable } from 'react-native';

const styles = StyleSheet.create({
  button: {
    padding: 12,
    borderRadius: 15,
  },
});

export default function (props) {
  const { style, pressedStyle, ...otherProps } = props;
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
      style={[styles.button, style, pressed && pressedStyle]}
    />
  );
}
