/** @type {import('next').NextConfig} */
const nextConfig = {
  // Development optimizations
  reactStrictMode: true,
  swcMinify: true,

  // Hot reload settings
  webpack: (config, { dev }) => {
    // Handle canvas for Konva.js
    config.externals = [...config.externals, { canvas: 'canvas' }]

    // Development optimizations
    if (dev) {
      // Enable source maps for better debugging
      config.devtool = 'eval-source-map'

      // Optimize rebuild performance
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      }

      // Improve module resolution
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': '/src',
      }
    }

    // Handle Electric SQL WASM modules
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }

    return config
  },

  // TypeScript and ESLint settings
  typescript: {
    // Allow production builds to succeed even if type errors exist
    ignoreBuildErrors: false,
  },
  eslint: {
    // Run ESLint during builds
    ignoreDuringBuilds: false,
  },

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
    NEXT_PUBLIC_DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE || 'false',
  },

  // Image optimization
  images: {
    domains: ['localhost', 'battleship.app'],
    formats: ['image/avif', 'image/webp'],
  },

  // Experimental features for better DX
  experimental: {
    // Enable Turbopack for faster dev builds (optional)
    // turbo: true,

    // Server components optimizations
    serverComponentsExternalPackages: ['electric-sql', 'wa-sqlite'],
  },

  // Headers for CORS and security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ]
  },

  // Redirects and rewrites
  async rewrites() {
    return [
      // Proxy Electric SQL sync endpoint if needed
      {
        source: '/electric/:path*',
        destination: process.env.ELECTRIC_SERVICE_URL
          ? `${process.env.ELECTRIC_SERVICE_URL}/:path*`
          : 'http://localhost:5133/:path*',
      },
    ]
  },
}

export default nextConfig
