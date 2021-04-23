import useViewport from './useViewport';

export default () => {
  const { underViewableHeight } = useViewport();
  return underViewableHeight ? 32 : 56;
};
