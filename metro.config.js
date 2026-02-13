const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    ...defaultConfig.resolver,
    extraNodeModules: {
      ...(defaultConfig.resolver?.extraNodeModules ?? {}),
      '@env': require.resolve('./src/types/env.d.ts'),
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
