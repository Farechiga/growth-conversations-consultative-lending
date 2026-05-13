import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module. Excluding it from the Next/Webpack
  // bundle lets node-gyp install the prebuilt binary directly into the
  // Lambda node_modules tree.
  serverExternalPackages: ["better-sqlite3", "@prisma/client"],

  // Ensure the bundled SQLite snapshot ships with the serverless function
  // bundle. lib/db-path.ts copies this file to /tmp on cold start so writes
  // succeed for the Lambda instance lifetime (Sprint 6 Block D).
  outputFileTracingIncludes: {
    "/**/*": ["./prisma/seed.db"],
  },
};

export default nextConfig;
