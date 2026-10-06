import type { NextConfig } from 'next';

// STATIC_EXPORT=1 produces a fully static preview build in /out (no server routes).
const staticExport = process.env.STATIC_EXPORT === '1';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(staticExport ? { output: 'export' as const, trailingSlash: true, assetPrefix: '/assets' } : {}),
  images: {
    unoptimized: staticExport,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [390, 640, 768, 1024, 1280, 1440, 1920],
  },
  ...(staticExport ? {} : { headers }),
};

async function headers() {
    return [
      {
        // 3D assets and decoders are content-addressed by release; cache them hard.
        source: '/(models|decoders|textures)/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
  ];
}

export default nextConfig;
