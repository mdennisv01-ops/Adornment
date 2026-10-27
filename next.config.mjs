/** @type {import('next').NextConfig} */
const apiOrigin = (process.env.API_ORIGIN || 'http://localhost:4500').replace(/\/$/, '');
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${apiOrigin}/api/:path*` },
      { source: '/uploads/:path*', destination: `${apiOrigin}/uploads/:path*` },
    ];
  },
};
export default nextConfig;
