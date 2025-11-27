import { create } from 'zustand';

const useViewportStore = create((set) => ({
  width: 0,
  height: 0,
  setViewport: (viewport) => {
    console.log(`⌗ setViewport ${viewport.width}x${viewport.height}`);
    set(viewport);
  },
}));

export default useViewportStore;
