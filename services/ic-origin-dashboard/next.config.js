/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // output: 'export', // Disabled for Ralph Wuggum Production Mode (Enables SSR/Actions)
    images: {
        unoptimized: true,
    }
}

module.exports = nextConfig
