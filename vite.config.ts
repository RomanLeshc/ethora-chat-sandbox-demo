import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Some transitive deps (XMPP stack) reference Node's `global`.
  define: { global: 'window' },
  server: { host: true },
});
