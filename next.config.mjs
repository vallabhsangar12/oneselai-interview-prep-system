/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Ensure server-only packages are not bundled for the client
  serverExternalPackages: ['pdf-parse', 'pg', 'mongodb', 'bcryptjs', 'jsonwebtoken'],
}

export default nextConfig
