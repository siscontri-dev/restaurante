/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Habilitar características experimentales de React 19
    reactCompiler: false,
  },
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  // Optimizaciones para desarrollo
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
