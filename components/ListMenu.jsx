import { View } from 'react-native';

import ReadableWidthContainer from './ReadableWidthContainer';

export default function ListMenu(props) {
  return (
    <ReadableWidthContainer>
      <View
        {...props}
        style={{
          marginHorizontal: 15,
          borderRadius: 24,
          borderCurve: 'continuous',
          overflow: 'hidden',
        }}
      />
    </ReadableWidthContainer>
  );
}