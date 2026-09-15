import type { NextConfig } from "next";

// The frontend is fully separate from the backend. It talks to the API only through
// NEXT_PUBLIC_API_URL (see .env.local), e.g. http://localhost:5000/api
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
