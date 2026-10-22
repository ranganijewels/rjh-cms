/** @type {import('next').NextConfig} */

// Cross-origin endpoints the browser talks to directly (axios, uploads, and
// the storefront defaults the Customize editor seeds from).
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1').replace(/\/api\/v\d+\/?$/, '')
const STOREFRONT_ORIGIN = (process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000').replace(/\/+$/, '')

const isDev = process.env.NODE_ENV === 'development'

// Pragmatic CSP for a client-rendered admin app.
// - script-src keeps 'unsafe-inline' because Next.js injects its bootstrap
//   scripts without nonces; the header still blocks external script loads.
//   Upgrade path: plumb a nonce through src/middleware.ts to drop it.
// - img/media are broad (https:) because editors paste customer-supplied
//   media URLs (review avatars, reel posters) that can live on any host.
// - connect-src names the API and storefront explicitly; dev also allows
//   websockets for HMR.
// - frame-ancestors 'none' kills clickjacking on every route.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data:",
  'img-src \'self\' data: blob: https:',
  'media-src \'self\' blob: https:',
  `connect-src 'self' ${API_ORIGIN} ${STOREFRONT_ORIGIN}${isDev ? ' ws: wss:' : ''}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Browsers only honour HSTS over HTTPS, so this is inert on localhost.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
]

const nextConfig = {
  // Zero-downtime deploys: each build goes to its own release folder (set by
  // /root/deploy.sh); the live process keeps reading its previous folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  images: {
    // next/image is only used for blog covers, which come from the media
    // pipeline (API host) or the storefront — not an open proxy for any
    // https host. Everything else renders through plain <img>.
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'api.ranganijewelry.com' },
      { protocol: 'https', hostname: 'ranganijewelry.com' },
      { protocol: 'https', hostname: 'www.ranganijewelry.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
export default nextConfig
