import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated } from 'react-native';

export default function (props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      delay: 700,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);
  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <ActivityIndicator {...props} />
    </Animated.View>
  );
}
