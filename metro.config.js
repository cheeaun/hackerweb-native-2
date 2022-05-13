const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

config.transformer.babelTransformerPath = require.resolve(
  'react-native-svg-transformer',
);
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== 'svg',
);
config.resolver.sourceExts.push('svg');

config.transformer.minifierPath = require.resolve('metro-minify-esbuild');
config.transformer.minifierConfig = {
  // ESBuild options...
};

module.exports = config;
