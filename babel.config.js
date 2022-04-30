module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Caution: Reanimated plugin has to be listed last.
    // https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/installation/
    plugins: ['react-native-reanimated/plugin'],
  };
};
