/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Set the root directory for Turbopack.
    // This helps Next.js correctly identify your project root, especially when
    // there are multiple lockfiles in parent directories.
    root: __dirname,
  },
};

module.exports = nextConfig;
