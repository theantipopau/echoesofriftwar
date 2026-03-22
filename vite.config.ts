import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@babylonjs/core')) {
            return 'babylon-core'
          }

          if (id.includes('/systems/ui/panels/')) {
            return 'ui-panels'
          }
        },
      },
    },
  }
})
