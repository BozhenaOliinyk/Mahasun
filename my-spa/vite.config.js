import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 8000,
        strictPort: true,
        proxy: {
            '/_api': {
                target: 'http://localhost:8001',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/_api/, '')
            }
        }
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/setupTests.js'],
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            lines: 70,
            functions: 70,
            branches: 70,
            statements: 70,
            exclude: [
                'src/main.jsx',
                'src/App.jsx',
                'src/pages/**/NotFound.jsx'
            ],
        }
    }
});
