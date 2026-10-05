// https://docs.expo.dev/guides/customizing-metro/
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// api/ is a separate Node package (the Hono server); keep it out of the app bundle.
const apiDir = path.resolve(__dirname, 'api').replace(/[/\\]/g, '[/\\\\]');
config.resolver.blockList = [new RegExp(`^${apiDir}[/\\\\].*`)];

module.exports = config;
