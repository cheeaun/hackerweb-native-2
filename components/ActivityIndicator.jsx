import React, { useRef, useEffect } from 'react';
import { ActivityIndicator, Animated } from 'react-native';

// https://github.com/siddharthkp/use-timeout
function useTimeout(callback, delay) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      const id = setTimeout(tick, delay);
      return () => clearTimeout(id);
    }
  }, [delay]);
}

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
