import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Two pages for now: the campus and the admin page.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: { main: 'index.html', admin: 'admin.html' },
    },
  },
});
