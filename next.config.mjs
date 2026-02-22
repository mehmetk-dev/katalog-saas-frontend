import { withSentryConfig } from "@sentry/nextjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Monorepo / çoklu lockfile ortamlarında Turbopack kökünü sabitle
  turbopack: {
    root: projectRoot,
  },
  typescript: {
    // Temporarily ignore TypeScript errors for production build
    ignoreBuildErrors: true,
  },
  // Turbopack config removed to fix path resolution issues
  // Standalone output is required for Docker but buggy on Windows during local builds
  output: process.platform === "win32" ? undefined : "standalone",
  images: {
    // Görsel optimizasyonu aç
    unoptimized: false,
    // Remote görseller için güvenilir domain'ler
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
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
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts', '@radix-ui/react-icons'],
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

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "fogistanbul",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors.
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
