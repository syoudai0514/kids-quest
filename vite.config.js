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
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        // 全アセットをキャッシュしてオフラインでも完全に動くように
        navigateFallback: 'index.html'
      }
    })
  ]
}))
