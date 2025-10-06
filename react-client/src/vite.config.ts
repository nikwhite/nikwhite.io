import { join } from 'node:path'

import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: join(import.meta.dirname, 'src'),
  base: './',
  plugins: [
    basicSsl({
      name: 'devcert',
      certDir:  join(import.meta.dirname, '.local'),
    }),
    react()
  ],
  build: {
    outDir: join(import.meta.dirname, '../react-client-build'),
    emptyOutDir: true,
  }
})