import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Plugin to remove importmap in production builds and ensure proper script order
function removeImportmapPlugin(mode: string): Plugin {
  return {
    name: 'remove-importmap',
    transformIndexHtml: {
      order: 'post', // Run AFTER Vite adds modulepreload links
      handler(html, ctx) {
        if (mode === 'production') {
          // Remove importmap script tag and comment in production
          html = html.replace(/<!-- Importmap only for development[^>]*-->/g, '');
          html = html.replace(/<script type="importmap">[\s\S]*?<\/script>/g, '');
          // Remove any dns-prefetch for esm.sh since we're not using it in production
          html = html.replace(/<link rel="dns-prefetch" href="https:\/\/esm\.sh"[^>]*>/g, '');
          // Remove Tailwind CDN script in production
          html = html.replace(/<script[^>]*src="https:\/\/cdn\.tailwindcss\.com"[^>]*><\/script>/g, '');
          html = html.replace(/<link[^>]*href="https:\/\/cdn\.tailwindcss\.com"[^>]*>/g, '');
          
          // Reorder modulepreload links to ensure react-vendor loads before vendor
          // Match all modulepreload links
          const allPreloads = html.match(/<link rel="modulepreload"[^>]*>/g) || [];
          const reactVendorPreloads: string[] = [];
          const genaiPreloads: string[] = [];
          const vendorPreloads: string[] = [];
          const otherPreloads: string[] = [];
          
          allPreloads.forEach(preload => {
            // React-dependent libraries are now in entry bundle, so no need to handle them separately
            if (preload.includes('genai')) {
              genaiPreloads.push(preload);
            } else if (preload.includes('vendor') && !preload.includes('react')) {
              // Don't preload vendor chunk - let it load lazily after React is ready
            } else {
              otherPreloads.push(preload);
            }
          });
          
          // Remove all modulepreload links
          html = html.replace(/<link rel="modulepreload"[^>]*>/g, '');
          
          // Find where to insert them (before the main script tag)
          const scriptMatch = html.match(/<script type="module"[^>]*>/);
          if (scriptMatch) {
            const insertPos = html.indexOf(scriptMatch[0]);
            // Build the correct order: genai and others only
            // react-vendor and vendor will load on-demand after React is ready
            const reorderedPreloads = [
              ...genaiPreloads,
              ...otherPreloads
            ];
            
            if (reorderedPreloads.length > 0) {
              html = html.slice(0, insertPos) + 
                     reorderedPreloads.join('\n    ') + '\n    ' +
                     html.slice(insertPos);
            }
          }
        }
        return html;
      },
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:8000',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path, // Keep the /api prefix since backend expects it
            configure: (proxy, _options) => {
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                console.log(`[Vite Proxy] ${req.method} ${req.url} -> http://localhost:8000${req.url}`);
              });
              proxy.on('error', (err, _req, res) => {
                console.error('[Vite Proxy Error]', err);
              });
            },
          },
        },
      },
      plugins: [
        react({
          // Optimize JSX runtime
          jsxRuntime: 'automatic',
        }),
        removeImportmapPlugin(mode),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
        // Ensure React is available globally for framer-motion
        'global': 'globalThis',
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          // Prevent references to react/development in production ONLY
          // In development, we need jsx-dev-runtime for jsxDEV function
          ...(isProduction ? {
            'react/jsx-dev-runtime': 'react/jsx-runtime',
          } : {}),
        },
        dedupe: ['react', 'react-dom'],
        // Ensure React is resolved correctly for framer-motion
        conditions: ['import', 'module', 'browser', 'default'],
      },
      base: '/',
      build: {
        // Disable minification temporarily to debug module issues
        minify: false,
        // Optimize chunk splitting
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              // Only manually chunk node_modules
              if (id.includes('node_modules')) {
                // CRITICAL: Keep React core AND React-dependent libraries in entry bundle
                // This ensures everything loads together and avoids initialization order issues
                if (
                  id.includes('/react/') || 
                  id.includes('/react-dom/') ||
                  id.includes('react/jsx-runtime') ||
                  id.includes('react/jsx-dev-runtime') ||
                  id.includes('react/development') ||
                  id.includes('react/production') ||
                  id.includes('react-is') ||
                  id.includes('framer-motion') ||
                  id.includes('recharts') ||
                  id.includes('lucide-react') ||
                  id.includes('axios') ||
                  id.includes('scheduler')
                ) {
                  // Keep React and all potentially React-dependent libs in entry bundle - no chunking
                  // This prevents initialization order issues
                  return undefined;
                }
                // Exclude @google/genai from vendor - put it in its own chunk
                if (id.includes('@google/genai')) {
                  return 'genai';
                }
                // Split large libraries into separate chunks
                if (id.includes('html2canvas') || id.includes('jspdf')) {
                  return 'pdf';
                }
                // Other node_modules go to vendor chunk
                return 'vendor';
              }
              // Split pages into separate chunks for better code splitting
              if (id.includes('/pages/')) {
                const pageName = id.split('/pages/')[1]?.split('.')[0];
                if (pageName) {
                  return `page-${pageName}`;
                }
              }
              // Split large components into separate chunks
              if (id.includes('/components/AdminDashboard/')) {
                return 'admin-components';
              }
              // Let Vite automatically handle other application code chunking
            },
            // Optimize chunk file names
            chunkFileNames: 'assets/js/[name]-[hash].js',
            entryFileNames: 'assets/js/[name]-[hash].js',
            assetFileNames: (assetInfo) => {
              const info = assetInfo.name?.split('.') || [];
              const ext = info[info.length - 1];
              if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
                return `assets/images/[name]-[hash][extname]`;
              }
              if (/woff2?|eot|ttf|otf/i.test(ext)) {
                return `assets/fonts/[name]-[hash][extname]`;
              }
              return `assets/[ext]/[name]-[hash][extname]`;
            },
            // Ensure proper chunk loading order
            experimentalMinChunkSize: 20000,
            // Ensure proper module format
            format: 'es',
            // Ensure proper chunk dependencies for loading order
            generatedCode: {
              constBindings: true,
            },
            // Use default interop for better compatibility
            interop: 'compat',
          },
          // Ensure react-vendor chunk has priority
          external: [],
        },
        // Ensure chunks are loaded in the correct order
        modulePreload: {
          polyfill: true,
        },
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000,
        // Disable source maps in production to avoid initialization issues
        sourcemap: false,
        // Optimize assets - inline small assets, externalize large ones
        assetsInlineLimit: 4096,
        // CSS code splitting
        cssCodeSplit: true,
        // Ensure proper module resolution
        commonjsOptions: {
          include: [/node_modules/],
          transformMixedEsModules: true,
          requireReturnsDefault: 'auto',
          esmExternals: true,
          defaultIsModuleExports: 'auto',
        },
      },
      // Optimize dependencies
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react/jsx-runtime',
          'framer-motion',
          'lucide-react',
          'web-vitals',
          'react-is',
          'recharts',
        ],
        exclude: ['@google/genai'],
        esbuildOptions: {
          jsx: 'automatic',
        },
        // Force React to be included in the same optimization pass as framer-motion
        force: true,
      },
    };
});
