import type { NextConfig } from "next";

const snapshotFiles = [
  "src/data/generated/inail-infortuni-serie.json",
  "src/data/generated/inail-infortuni-serie.meta.json",
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/": snapshotFiles,
    "/infortuni/*": snapshotFiles,
    "/api/dati/*": snapshotFiles,
  },
};

export default nextConfig;
