import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  optimizeDeps: {
    exclude: ['vue-demi'],
  },
  build: {
    lib: {
      entry: resolve(__dirname, './index.ts'),
      fileName: 'index',
    },
    rollupOptions: {
      output: [
        {
          format: 'es',
          dir: './dist',
        },
        {
          format: 'cjs',
          dir: './dist',
        },
      ],
    },
  },
  plugins: [dts({
    root: resolve(__dirname, './packages/pro-components-hooks'),
    exclude: ['vite.config.ts'],
  })],
})
