/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  // Next.js 15'te swcMinify varsayılan olduğu için kaldırıldı
  poweredByHeader: false,
  images: {
    domains: [
      "localhost",
      "firebasestorage.googleapis.com",
      "storage.googleapis.com",
    ],
    formats: ["image/avif", "image/webp"],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    optimisticClientCache: true,
  },
  output: "standalone",
  // Gzip sıkıştırma performans için aktif edildi
  compress: true,
  // HTTP/2 desteği artık bu şekilde yapılandırılmıyor
  // Sayfa çoğaltma - sayfa geçişlerini hızlandırır
  staticPageGenerationTimeout: 120,
  // İsteğe bağlı bileşen yükleme (webpack İçin)
  webpack: (config, { dev, isServer }) => {
    // Performans optimizasyonları
    if (!dev && !isServer) {
      // Webpack bundle analizini etkinleştir (isteğe bağlı)
      if (process.env.ANALYZE === "true") {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: "server",
            analyzerPort: 8888,
            openAnalyzer: true,
          }),
        );
      }

      // Kullanılmayan runtime kodunu kaldır ve parçalama için optimize et
      config.optimization.splitChunks = {
        chunks: "all",
        maxInitialRequests: 25,
        maxAsyncRequests: 25,
        minSize: 20000,
        minChunks: 1,
        cacheGroups: {
          commons: {
            test: /[\\/]node_modules[\\/]/,
            name(module, chunks, cacheGroupKey) {
              const moduleFileName = module
                .identifier()
                .split("/")
                .reduceRight((item) => item);
              const allChunksNames = chunks.map((item) => item.name).join("~");
              return `${cacheGroupKey}-${allChunksNames}-${moduleFileName}`;
            },
            chunks: "all",
            priority: -10,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },
  // API proxy eklendi - Backend'e tüm istekleri yönlendir
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
  // CORS ayarları
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
