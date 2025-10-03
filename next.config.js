/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wukkulrwjqqxcxiwnflc.storage.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    // Reduce bundle size by optimizing icon library imports
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self' https://*.clerk.com;
              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com https://r.stripe.com https://tidy-bat-20.clerk.accounts.dev https://*.clerk.com https://clerk.repur.fi blob:;
              worker-src 'self' blob:;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https://q.stripe.com https://js.stripe.com https://stripe-camo.global.ssl.fastly.net https://d1wqzb5bdbcre6.cloudfront.net https://qr.stripe.com https://b.stripecdn.com https://files.stripe.com https://wukkulrwjqqxcxiwnflc.supabase.co https://img.clerk.com;
              media-src 'none';
              connect-src 'self' https://api.clerk.com https://r.stripe.com https://tidy-bat-20.clerk.accounts.dev https://clerk-telemetry.com https://*.clerk.com https://accounts.repur.fi;
              frame-src https://js.stripe.com https://checkout.stripe.com https://*.clerk.com;
              font-src 'self' https://*.clerk.com;
            `.replace(/\n/g, '').replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Public uploads cache for faster repeat visits and better LCP on image-heavy pages
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
