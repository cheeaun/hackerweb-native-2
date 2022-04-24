import { useState } from 'react';
import { View } from 'react-native';
import Text from './Text';
import useTheme from '../hooks/useTheme';

export default function CommentPage({ page }) {
  if (!page) return null;
  const { colors } = useTheme();
  const [topMargin, setTopMargin] = useState(0);
  return (
    <View
      style={{
        position: 'absolute',
        right: 8,
        padding: 4,
        backgroundColor: colors.background,
        marginTop: topMargin,
      }}
      onLayout={(e) => {
        console.log('📐 CommentPage onLayout', e.nativeEvent.layout);
        const { height } = e.nativeEvent.layout;
        setTopMargin(Math.round(-height / 2));
      }}
      pointerEvents="none"
    >
      <Text size="caption2" bold type="insignificant">
        {page}
      </Text>
    </View>
  );
}
