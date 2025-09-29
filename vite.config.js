import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: './frontend', // Define a pasta frontend como raiz
  plugins: [react()],
  server: {
    proxy: {
      // forward /api requests to backend running on port 5000
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
});
