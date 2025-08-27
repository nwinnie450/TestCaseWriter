/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Force client-side navigation to prevent RSC fetch failures
    clientRouterFilter: true,
  },
  images: {
    domains: [],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Handle PDF.js worker and canvas
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      }
      
      // Ensure PDF.js worker can be loaded
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        crypto: false,
      }
      
      // Handle PDF.js .mjs files
      config.module.rules.push({
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      })
    }
    return config
  },
  // Allow static file serving for PDF.js worker
  async rewrites() {
    return [
      {
        source: '/pdf.worker.min.js',
        destination: '/node_modules/pdfjs-dist/build/pdf.worker.min.js',
      },
    ]
  },
}

module.exports = nextConfig