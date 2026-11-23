/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    mdxRs: true,
  },
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  images: {
    domains: [],
  },
  env: {
    CUSTOM_KEY: 'mars-credit',
  },
  async headers() {
    return [
      {
        source: '/api/network',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=5, stale-while-revalidate=10',
          },
        ],
      },
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=10, stale-while-revalidate=30',
          },
        ],
      },
    ]
  },
}

const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})

module.exports = withMDX(nextConfig)

