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
      includeAssets: ['favicon.svg'],
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
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // 全アセットをキャッシュしてオフラインでも完全に動くように
        navigateFallback: 'index.html'
      }
    })
  ]
}))
