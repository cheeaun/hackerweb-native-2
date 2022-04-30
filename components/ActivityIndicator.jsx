// import { useEffect, useRef } from 'react';
import { ActivityIndicator } from 'react-native';

import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export default function (props) {
  return (
    <Animated.View entering={FadeIn.duration(700).delay(300)} exiting={FadeOut}>
      <ActivityIndicator {...props} />
    </Animated.View>
  );
}
