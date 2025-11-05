const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// config.transformer.minifierConfig.compress.drop_console = true;
config.transformer.minifierConfig.output.comments = false;

module.exports = config;
