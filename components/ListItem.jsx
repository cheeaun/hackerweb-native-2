import { useState } from 'react';
import { Pressable } from 'react-native';

import useTheme from '../hooks/useTheme';

export default function ListItem({ style = {}, ...props }) {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);
  const styles = {
    paddingHorizontal: 15,
    paddingVertical: 13,
    backgroundColor: colors.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  return (
    <Pressable
      disabled={!props.onPress || props.disabled}
      unstable_pressDelay={130}
      onPressIn={() => {
        setPressed(true);
      }}
      onPressOut={() => {
        setPressed(false);
      }}
      style={[
        styles,
        pressed && {
          backgroundColor: colors.fill,
        },
        style,
      ]}
      {...props}
    />
  );
}