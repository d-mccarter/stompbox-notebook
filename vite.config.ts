import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const buildNumber = process.env.BUILD_NUMBER ?? process.env.GITHUB_RUN_NUMBER ?? '0-dev'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub project pages: https://<user>.github.io/stompbox-notebook/
  base: '/stompbox-notebook/',
  define: {
    __BUILD_NUMBER__: JSON.stringify(buildNumber),
  },
})
