/**
 * File: vite.config.ts
 * Purpose: Configures the Vite development/build pipeline for the React onboarding application.
 * Dependencies: Vite, React plugin, Tailwind CSS plugin, Node path resolution, and DISABLE_HMR env behavior.
 * Maintainer note: HMR/file-watch settings are tuned for AI Studio editing stability.
 */
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { execSync } from 'child_process';

function getGitCommit() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
}

export default defineConfig(() => {
  const commitSha = process.env.VITE_COMMIT_SHA || getGitCommit();
  const buildTime = process.env.VITE_BUILD_TIME || new Date().toISOString();

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      // These become compile-time constants so they're always present in the bundle
      'import.meta.env.VITE_COMMIT_SHA': JSON.stringify(commitSha),
      'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
