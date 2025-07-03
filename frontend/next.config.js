/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    forceSwcTransforms: true // Force SWC transforms
  },
  async rewrites() {
    return [
      {
        source: '/api/analyze-statement',
        destination: 'https://demo-bl6p.onrender.com/analyze-statement'
      },
      {
        source: '/api/analyze-kotak-statement',
        destination: 'https://demo-bl6p.onrender.com/analyze-kotak'
      },
      {
        source: '/api/analyze-phonepe',
        destination: 'https://demo-bl6p.onrender.com/analyze-phonepe'
      },
      {
        source: '/api/analyze-canara',
        destination: 'https://demo-bl6p.onrender.com/analyze-canara'
      },
      {
        source: '/api/unlock-pdf',
        destination: 'https://demo-bl6p.onrender.com/unlock-pdf'
      }
    ]
  }
}

module.exports = nextConfig 