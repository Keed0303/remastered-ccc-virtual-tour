import { defineConfig } from 'vite';

// Two pages: the campus and the admin page.
export default defineConfig({
  build: {
    rollupOptions: {
      input: { main: 'index.html', admin: 'admin.html' },
    },
  },
});
