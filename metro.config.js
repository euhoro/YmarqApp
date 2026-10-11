// https://docs.expo.dev/guides/customizing-metro/
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// server/ is a separate Node package (the Hono server); keep it out of the app bundle.
const serverDir = path.resolve(__dirname, 'server').replace(/[/\\]/g, '[/\\\\]');
// .claude/ holds agent worktrees (full copies of the repo); never bundle them either.
const claudeDir = path.resolve(__dirname, '.claude').replace(/[/\\]/g, '[/\\\\]');
config.resolver.blockList = [
  new RegExp(`^${serverDir}[/\\\\].*`),
  new RegExp(`^${claudeDir}[/\\\\].*`),
];

module.exports = config;
