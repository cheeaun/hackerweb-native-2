const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

config.transformer.babelTransformerPath = require.resolve(
  'react-native-svg-transformer',
);
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== 'svg',
);
config.resolver.sourceExts.push('svg');

config.transformer.minifierPath = 'metro-minify-terser';
// config.transformer.minifierConfig.compress.drop_console = true;
config.transformer.minifierConfig.output.comments = false;

module.exports = config;
