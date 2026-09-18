import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/puzzle": ["./lib/valid-five-letter-words.txt"],
    "/api/admin/words": ["./lib/valid-five-letter-words.txt"],
  },
};

export default nextConfig;
