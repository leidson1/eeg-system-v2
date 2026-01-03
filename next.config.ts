import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip prerendering for pages that require client-side data
  experimental: {
    ppr: false,
  },
  // Configurações para produção
  typescript: {
    // Permite build com erros de tipo (não recomendado em prod)
    ignoreBuildErrors: false,
  },
  // Output mode
  output: 'standalone',
};

export default nextConfig;
