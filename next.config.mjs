/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => [
    {
      source: '/sw.js',
      headers: [
        { key: 'Cache-Control', value: 'no-cache' },
        { key: 'Content-Type', value: 'application/javascript' },
      ],
    },
  ],
};

export default nextConfig;
