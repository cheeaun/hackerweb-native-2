const upstreamTransformer = require('@expo/metro-config/babel-transformer');
const svgTransformer = require('react-native-svg-transformer');

module.exports.transform = async ({ src, filename, options }) => {
  if (filename.endsWith('.svg')) {
    return svgTransformer.transform({ src, filename, options });
  }
  return upstreamTransformer.transform({ src, filename, options });
};

