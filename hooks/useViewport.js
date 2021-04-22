import { useWindowDimensions } from 'react-native';
import useViewportStore from './useViewportStore';

const useViewport = () => {
  const width = useViewportStore((state) => state.width);
  const height = useViewportStore((state) => state.height);
  const { fontScale } = useWindowDimensions();
  // font size: 8px? 72 chars?
  const readableWidth = 8 * 72 * fontScale;
  return {
    readableWidth,
    exceedsReadableWidth: width >= readableWidth,
    orientation: width <= height ? 'portrait' : 'landscape',
  };
};

export default useViewport;
