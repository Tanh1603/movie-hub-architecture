//@ts-check

const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  staticPageGenerationTimeout: 120,
  // Enable standalone output for optimized Docker builds (reduces image size by 80%)
  output: 'standalone',
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  webpack: (config, { isServer, webpack }) => {
    console.log(`> Webpack building for ${isServer ? 'server' : 'client'}`);

    const path = require('path');
    const dummyPath = path.resolve(__dirname, 'dummy-module.js');

    config.resolve.alias = {
      ...config.resolve.alias,
      'class-transformer/storage': dummyPath,
      'class-transformer': dummyPath,
      'class-validator': dummyPath,
      '@nestjs/microservices': dummyPath,
      '@nestjs/swagger': dummyPath,
      'nestjs-zod': dummyPath,
      '@grpc/proto-loader': dummyPath,
    };

    if (!isServer) {
      // Provide empty modules for server-side only dependencies in client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'class-transformer/storage': false,
        'class-transformer': false,
        'class-validator': false,
        '@nestjs/microservices': false,
        '@nestjs/websockets/socket-module': false,
        '@nestjs/common/utils/load-package.util': false,
        '@grpc/proto-loader': false,
        '@opencensus/propagation-stackdriver': false,
        '@nestjs/swagger': false,
      };
    }

    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp:
          /class-transformer\/storage|class-validator|@grpc\/proto-loader/,
      })
    );

    return config;
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
