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

// @vercel/blob (photo uploads) ships browser versions of the Node modules it uses, declared in its
// package.json "browser" field, which Metro doesn't apply to bare imports. Point them there.
// @vercel/oidc is only for server-side credentials (it needs Node); the app uploads with client tokens.
const blobDist = path.dirname(require.resolve('@vercel/blob/client'));
const blobBrowserModules = {
  undici: path.join(blobDist, 'undici-browser.js'),
  crypto: path.join(blobDist, 'crypto-browser.js'),
  stream: path.join(blobDist, 'stream-browser.js'),
};
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (blobBrowserModules[moduleName] && context.originModulePath.startsWith(blobDist)) {
    return { type: 'sourceFile', filePath: blobBrowserModules[moduleName] };
  }
  if (moduleName === '@vercel/oidc' && context.originModulePath.startsWith(blobDist)) {
    return { type: 'empty' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
