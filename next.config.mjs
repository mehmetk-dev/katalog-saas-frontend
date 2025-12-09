/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  output: "standalone",
  images: {
    // Görsel optimizasyonu aç
    unoptimized: false,
    // Remote görseller için domain ekle
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Görsel boyutlarını optimize et
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // WebP ve AVIF formatlarını kullan
    formats: ['image/avif', 'image/webp'],
  },
  // Compiler optimizasyonları
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Experimental optimizations
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts',
      'date-fns',
    ],
  },
  // Production optimizations
  poweredByHeader: false,
  compress: true,
  // Bundle analyzer için (development)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: '../bundle-report.html',
            openAnalyzer: false,
          })
        );
      }
      return config;
    },
  }),
}

export default nextConfig