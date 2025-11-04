const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Use custom transformer for SVG support
config.transformer.babelTransformerPath = require.resolve(
  './metro.transformer.js',
);

// Remove 'svg' from asset extensions
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== 'svg',
);

// Add 'svg' to source extensions
config.resolver.sourceExts.push('svg');

config.transformer.minifierPath = 'metro-minify-terser';
// config.transformer.minifierConfig.compress.drop_console = true;
config.transformer.minifierConfig.output.comments = false;

module.exports = config;
