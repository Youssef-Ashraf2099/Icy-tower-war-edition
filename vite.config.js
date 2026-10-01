import { defineConfig } from 'vite';

export default defineConfig({
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      // Prevent Vite file watcher from monitoring Cargo build artifacts in src-tauri
      ignored: ['**/src-tauri/**', '**/target/**']
    }
  },
  build: {
    target: ['es2021', 'chrome100', 'safari13'],
    minify: true
  }
});
