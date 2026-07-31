import type { NextConfig } from "next";
import {withSentryConfig} from "@sentry/nextjs";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: { optimizePackageImports: ["lucide-react"] }
};

export default withSentryConfig(nextConfig,{silent:true,widenClientFileUpload:false,webpack:{treeshake:{removeDebugLogging:true}}});
