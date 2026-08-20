import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// オフライン対応の PWA 設定。
// Android タブレットのブラウザで「ホームに追加」してアプリのように使える。
//
// GitHub Pages の正規URL /mana-evo/ 用。本番だけ専用baseを使う。
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/mana-evo/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icon-180-v2.png'],
      manifest: {
        name: 'マナエボ',
        short_name: 'マナエボ',
        description: 'まなびが、進化になる。学んで冒険し、仲間を育てよう。',
        lang: 'ja',
        dir: 'ltr',
        theme_color: '#1b1140',
        background_color: '#1b1140',
        display: 'fullscreen',
        orientation: 'landscape',
        start_url: '/mana-evo/',
        scope: '/mana-evo/',
        id: '/mana-evo/',
        icons: [
          { src: 'icon-192-v2.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512-v2.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        // この実行環境では Workbox の terser 子プロセスが終了し、SW 生成だけが失敗する。
        // development モードなら機能は同じで圧縮だけを省くため、確実に PWA を生成できる。
        mode: 'development',
        // ナビ音声は通常のアプリ更新で全員にダウンロードさせない。保護者が
        // 「ダウンロード」を押した時だけ、音声モデルと推論WASMを取得する。
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        runtimeCaching: [
          {
            // ONNX Runtimeと自然な日本語用の辞書WASM。旧軽量版のキャッシュを
            // 再利用せず、辞書版だけをこの世代で保存する。
            urlPattern: /\/assets\/.*\.wasm$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'narrator-wasm-v3-dictionary',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 6, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            // 設定JSONは小さいが、保存済みモデルをオフラインで起動する際にも必要。
            urlPattern: /^https:\/\/huggingface\.co\/ayousanz\/piper-plus-tsukuyomi-chan\/resolve\/main\/.*\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'narrator-config-v1',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 3, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ],
        // 全アセットをキャッシュしてオフラインでも完全に動くように
        navigateFallback: 'index.html'
      }
    })
  ]
}))
