import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// オフライン対応の PWA 設定。
// Android タブレットのブラウザで「ホームに追加」してアプリのように使える。
//
// base: GitHub Pages（https://<user>.github.io/kids-quest/）で動くよう、
// 本番ビルドだけ '/kids-quest/' を基準にする。開発サーバは '/' のまま。
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/kids-quest/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-180-v2.png'],
      manifest: {
        name: 'ほしぞらクエスト',
        short_name: 'ほしぞら',
        description: '宇宙と恐竜を旅しながら「よむ・かく・すうじ」を学ぶ毎日ミッション',
        lang: 'ja',
        dir: 'ltr',
        theme_color: '#1b1140',
        background_color: '#1b1140',
        display: 'fullscreen',
        orientation: 'landscape',
        start_url: './',
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
            // ONNX RuntimeのWASM。日本語解析はアプリ内の軽量実装へ移行済み。
            // 旧 narrator-wasm-v1 の約60MB辞書WASMを再利用しないよう世代を変える。
            urlPattern: /\/assets\/.*\.wasm$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'narrator-wasm-v2-lite',
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
