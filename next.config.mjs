/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: false,
    images: {
      domains: ['wink.vercel.app', 'localhost', 'flirty.vercel.app', 'pbs.twimg.com'],
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
          config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
          };
        }
        return config;
      },
    };
    
    export default nextConfig;