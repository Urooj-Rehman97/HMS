import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Vendor libraries go into their own cached chunks; every page is a separate lazy chunk (see src/routes/AppRoutes.jsx).
export default defineConfig({
    plugins: [react()],
    server: { port: 5173 },
    build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: { output: { manualChunks: { react: ['react', 'react-dom', 'react-router-dom'], motion: ['framer-motion'] } } },
    },
});
