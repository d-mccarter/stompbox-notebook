import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const buildNumber = process.env.BUILD_NUMBER ?? process.env.GITHUB_RUN_NUMBER ?? '0-dev'

function htmlBuildMeta(): Plugin {
  return {
    name: 'html-build-meta',
    transformIndexHtml(html) {
      return html
        .replace(
          /<title>.*?<\/title>/,
          `<title>Stompbox Notebook · build ${buildNumber}</title>`,
        )
        .replace(
          '</head>',
          [
            `    <meta name="stompbox-build" content="${buildNumber}" />`,
            '    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />',
            '    <meta http-equiv="Pragma" content="no-cache" />',
            `  </head>`,
          ].join('\n'),
        )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), htmlBuildMeta()],
  // GitHub project pages: https://<user>.github.io/stompbox-notebook/
  base: '/stompbox-notebook/',
  define: {
    __BUILD_NUMBER__: JSON.stringify(buildNumber),
  },
})
