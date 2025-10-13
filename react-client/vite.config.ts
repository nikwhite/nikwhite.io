import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';

const dir = dirname(fileURLToPath(import.meta.url))
console.log(`DIR: ${dir}`);

export default defineConfig({
  root: dir,
  base: '/',
  plugins: [
    basicSsl({
      name: 'devcert',
      certDir:  join(dir, '.local'),
    }),
    react()
  ],
  build: {
    outDir: join(dir, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: join(dir, 'index.html'),
        img: join(dir, 'img', 'index.html'),
      },
    },
  },
});