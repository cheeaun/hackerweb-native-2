import { View } from 'react-native';

import useViewport from '../hooks/useViewport';

const ReadableWidthContainer = ({ children }) => {
  const { readableWidth } = useViewport();
  return (
    <View
      style={{
        maxWidth: readableWidth,
        justifyContent: 'center',
        alignSelf: 'center',
        width: '100%',
      }}
    >
      {children}
    </View>
  );
};

export default ReadableWidthContainer;
