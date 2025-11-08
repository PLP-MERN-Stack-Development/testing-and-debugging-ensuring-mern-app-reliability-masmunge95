import path from "path"
import { fileURLToPath } from "url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// Recreate __dirname for ES module scope
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  // Load env variables the Vite way so VITE_ variables match import.meta.env in the client
  const env = loadEnv(mode, process.cwd(), '');

  // Use localhost for development proxy and the production URL for the production CSP.
  const isProduction = mode === 'production';
  const apiOrigin = isProduction && env.VITE_API_URL ? new URL(env.VITE_API_URL).origin : 'http://localhost:5000';

  return {
    plugins: [
      react(),
      tailwindcss(),
      // This plugin is only needed for the development server, not for tests.
      command === 'serve' && {
          name: 'configure-response-headers',
          configureServer: (server) => {
            server.middlewares.use((_req, res, next) => {
              const clerkFrontendApi = 'working-toucan-66.clerk.accounts.dev';
              res.setHeader(
                'Content-Security-Policy',
                [
                  // More comprehensive CSP for local development
                  "default-src 'self'",
                  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://${clerkFrontendApi} https://*.google.com https://*.gstatic.com https://challenges.cloudflare.com https://*.cloudflare.com`,
                  `style-src 'self' 'unsafe-inline' https://${clerkFrontendApi} https://fonts.googleapis.com`,
                  `connect-src 'self' ${apiOrigin} https://${clerkFrontendApi} wss://${clerkFrontendApi} https://clerk-telemetry.com https://*.google.com https://challenges.cloudflare.com https://*.cloudflare.com`,
                  `frame-src 'self' https://${clerkFrontendApi} https://*.google.com https://challenges.cloudflare.com https://*.cloudflare.com`,
                  `img-src 'self' data: blob: https://img.clerk.com ${apiOrigin}`,
                  `font-src 'self' data:`,
                  `worker-src 'self' blob:`,
                ].join('; ')
              );
              // Add Permissions-Policy headers to silence warnings
              res.setHeader('Permissions-Policy', 'browsing-topics=(), interest-cohort=()');
              next();
            });
          },
        },
    ].filter(Boolean), // Filter out falsy values if the command is not 'serve'
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
    },
    // Server-specific options like proxy are only for development, not for tests.
    ...(command === 'serve' && {
      server: {
        proxy: {
          '/api': {
            target: 'http://localhost:5000',
            changeOrigin: true,
          },
          '/uploads': {
            target: 'http://localhost:5000',
            changeOrigin: true,
          },
        },
      },
    }),
  };
});
