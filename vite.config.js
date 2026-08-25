import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const standalone = mode === 'standalone'
    || process.env.VITE_STANDALONE === 'true'
    || process.env.VITE_STANDALONE === '1';
  const freeai = mode === 'freeai';
  const base = process.env.VITE_BASE || '/';

  const input = freeai
    ? { freeai: resolve(rootDir, 'freeai.html') }
    : { main: resolve(rootDir, 'index.html') };

  const hostedExtras = !standalone && !freeai;

  return {
    base,
    preview: {
      allowedHosts: true,
    },
    server: {
      allowedHosts: true,
    },
    build: {
      rollupOptions: {
        input,
        output: freeai
          ? {
              manualChunks(id) {
                if (!id.includes('node_modules')) return undefined;
                // Base44 SDK + its HTTP stack are only reachable through the
                // lazily imported MedScan adapter; keep them out of the shell.
                if (id.includes('@base44') || id.includes('axios')) return 'base44';
                if (id.includes('react-router')) return 'router';
                if (id.includes('/react/') || id.includes('react-dom')) return 'react';
                if (id.includes('lucide-react')) return 'icons';
                return 'vendor';
              },
            }
          : undefined,
      },
      outDir: freeai ? 'dist-freeai' : 'dist',
      emptyOutDir: true,
      chunkSizeWarningLimit: 600,
    },
    plugins: [
      base44({
        // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
        // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
        legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
        hmrNotifier: hostedExtras,
        navigationNotifier: hostedExtras,
        analyticsTracker: hostedExtras,
        visualEditAgent: hostedExtras,
      }),
      react(),
    ],
  };
});
