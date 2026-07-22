import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const buildNumber = process.env.BUILD_NUMBER ?? process.env.GITHUB_RUN_NUMBER ?? '0-dev'
const base = '/stompbox-notebook/'

/**
 * Match clockin-logger / guitar practice: GitHub Pages always sends
 * Cache-Control: max-age=600 for HTML. Meta tags cannot override that, so
 * Safari can keep an old index.html (and its hashed JS) for minutes.
 * Emit build.json and compare it to the shell build stamped into HTML; on
 * mismatch, force a one-time navigation with cache-busting query params.
 */
function deployCacheBust(): Plugin {
  const shellScript = `
    <script>
      window.__STOMPBOX_SHELL__ = ${JSON.stringify(String(buildNumber))};
      (function () {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(function (regs) {
            regs.forEach(function (reg) { reg.unregister(); });
          }).catch(function () {});
        }
        if (window.caches && caches.keys) {
          caches.keys().then(function (keys) {
            keys.forEach(function (key) { caches.delete(key); });
          }).catch(function () {});
        }

        function bustShell(reason) {
          try {
            var shell = String(window.__STOMPBOX_SHELL__ || '');
            var key = 'stompbox_shell_bust_' + shell;
            if (sessionStorage.getItem(key) === '1') return;
            sessionStorage.setItem(key, '1');
            var u = new URL(location.href);
            u.searchParams.set('_shell', shell);
            u.searchParams.set('_t', String(Date.now()));
            console.info('Stompbox shell refresh:', reason);
            location.replace(u.toString());
          } catch (e) {}
        }

        var buildUrl = ${JSON.stringify(base + 'build.json')} + '?t=' + Date.now();
        fetch(buildUrl, { cache: 'no-store' })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (j) {
            if (!j || j.build == null) return;
            if (String(j.build) !== String(window.__STOMPBOX_SHELL__)) {
              bustShell('build-mismatch');
            }
          })
          .catch(function () {});
      })();
    </script>
  `.trim()

  return {
    name: 'deploy-cache-bust',
    transformIndexHtml(html) {
      return html
        .replace(
          /<title>.*?<\/title>/,
          `<title>Stompbox Notebook · build ${buildNumber}</title>`,
        )
        .replace(
          '<head>',
          [
            '<head>',
            `    <meta name="stompbox-build" content="${buildNumber}" />`,
            '    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />',
            '    <meta http-equiv="Pragma" content="no-cache" />',
            `    ${shellScript}`,
          ].join('\n'),
        )
    },
    writeBundle(options) {
      const outDir = options.dir ?? resolve('dist')
      writeFileSync(
        resolve(outDir, 'build.json'),
        JSON.stringify(
          {
            build: buildNumber,
            updated: new Date().toISOString(),
          },
          null,
          2,
        ) + '\n',
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), deployCacheBust()],
  // GitHub project pages: https://<user>.github.io/stompbox-notebook/
  base,
  define: {
    __BUILD_NUMBER__: JSON.stringify(buildNumber),
  },
})
