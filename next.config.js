/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  // Static export might cause PWA installation issues, consider removing for production
  // output: 'export',
  // Set the root directory for file tracing to resolve multiple lockfile warning
  outputFileTracingRoot: __dirname,
  // Don't include the SW in the build - we have our own in /public
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { fs: false, path: false };
    }
    return config;
  }
};

module.exports = nextConfig;