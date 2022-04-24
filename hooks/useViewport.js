import { useWindowDimensions } from 'react-native';

import useViewportStore from './useViewportStore';

const useViewport = () => {
  const width = useViewportStore((state) => state.width);
  const height = useViewportStore((state) => state.height);
  const { fontScale } = useWindowDimensions();

  // font size: 8px? 72 chars?
  const readableWidth = 8 * 72 * fontScale;

  // Min viewable height - meant for reducing UI space usage when viewport height is too small (iPhone landscape)
  // 428 = iPhone 12 Pro Max's width
  // 445 = iPhone SE 2020's height
  const viewableHeight = 440 * fontScale;

  return {
    readableWidth,
    exceedsReadableWidth: width >= readableWidth,
    viewableHeight,
    underViewableHeight: height <= viewableHeight,
    orientation: width <= height ? 'portrait' : 'landscape',
  };
};

export default useViewport;
