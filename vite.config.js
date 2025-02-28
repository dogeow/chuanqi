import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/css/game.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        tailwindcss(),
        react({
            jsxRuntime: 'automatic',
            fastRefresh: true,
            development: true
        }),
    ],
    server: {
        cors: {
            origin: ['http://127.0.0.1:8000', 'http://localhost:8000'],
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            credentials: true
        },
        hmr: {
            host: 'localhost',
        },
    },
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    optimizeDeps: {
        include: ['react', 'react-dom'],
    },
    build: {
        commonjsOptions: {
            transformMixedEsModules: true,
        },
        sourcemap: true,
    },
    css: {
        devSourcemap: true,
    },
});
