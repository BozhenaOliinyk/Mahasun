import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 8000,
        strictPort: true,
        proxy: {
            '/_api':{
                target:'http://localhost:8001',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/_api/,'')
            }
        }
    }
});
