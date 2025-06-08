import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Minify và optimize
    minify: 'terser',
    target: 'es2015',
    sourcemap: false,
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html')
      },
      output: {
        // Optimize chunk splitting
        manualChunks: {
          // Tách vendor code nếu có
          vendor: [],
        },
        // Clean asset names
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    },
    // Terser options for better compression
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log', 'console.info'], // Remove specific functions
      },
      mangle: {
        safari10: true // Fix Safari 10+ compatibility
      }
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000
  },
  // Development server
  server: {
    port: 3000,
    open: true,
    cors: true,
    host: true // Allow external access
  },
  // Base path cho production
  base: './',
  // Resolve aliases
  resolve: {
    alias: {
      '@': resolve(process.cwd(), '.'),
      '@js': resolve(process.cwd(), 'js'),
      '@css': resolve(process.cwd(), 'css')
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: []
  },
  // CSS configuration
  css: {
    devSourcemap: true // CSS source maps in dev
  }
});
