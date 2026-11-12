import type { NextConfig } from "next";

// Nota: gli snapshot vengono importati come moduli JSON dai componenti, quindi
// finiscono già nel bundle della pagina. `outputFileTracingIncludes` serve solo
// per i file letti da disco a runtime: qui non ce ne sono. La vecchia voce su
// `inail-infortuni-serie.json` (178 MB) puntava a un file che nessun componente
// carica e che è escluso da git: è stata rimossa per non far tracciare in build
// un artifact inesistente in CI.
const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
