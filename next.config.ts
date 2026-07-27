import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    COMMIT_HASH: process.env.AWS_COMMIT_ID || 'dev-local',
    BUILD_ID: process.env.AWS_JOB_ID || 'local-dev',
  },
};

export default nextConfig;
