import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      external: ['moment'],
    },
  },
  // Add more configuration options as needed (see Vite docs)
});
