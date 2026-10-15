/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.AR_CRM_DIST_DIR || ".next",
  // KPI/analytics pages read from a JSON store on the server; keep it simple.
  experimental: {
    // allow reading the local JSON data store from server components
  },
};

export default nextConfig;
