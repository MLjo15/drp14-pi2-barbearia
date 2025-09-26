import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: './frontend', // Define a pasta frontend como raiz
  plugins: [react()],
});
