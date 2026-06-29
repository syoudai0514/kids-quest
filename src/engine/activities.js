// ============================================================
// 学習分野（ドメイン）のレジストリ
//
// ここに分野を登録すると、ホーム画面・ミッション・難易度調整に自動的に乗る。
// 「かく」「すうじ」を足すときは、generateQuestion を持つドメインを
// 1つ追加するだけでよい設計。
//
// generateQuestion(params) は difficulty.difficultyParams() の結果を受け取り、
// 問題オブジェクトを返す。問題は ActivityPlayer が共通描画する。
// ============================================================

import { generateReadingQuestion } from '../data/content/reading.js'

export const DOMAINS = [
  {
    id: 'yomu',
    name: 'よむ',
    emoji: '📖',
    color: 'linear-gradient(180deg,#8bf7d8,#46c9a6)',
    available: true,
    generateQuestion: generateReadingQuestion
  },
  {
    id: 'kaku',
    name: 'かく',
    emoji: '✏️',
    color: 'linear-gradient(180deg,#ffa9c5,#ff7aa6)',
    available: false, // 次の拡張で指なぞり書きを追加予定
    comingSoon: 'もうすぐ あそべるよ！',
    generateQuestion: null
  },
  {
    id: 'suuji',
    name: 'すうじ',
    emoji: '🔢',
    color: 'linear-gradient(180deg,#ffe08a,#ffb84d)',
    available: false, // 次の拡張で「かぞえる・大小・たしざん」を追加予定
    comingSoon: 'もうすぐ あそべるよ！',
    generateQuestion: null
  }
]

export const DOMAIN_BY_ID = Object.fromEntries(DOMAINS.map((d) => [d.id, d]))

export function availableDomains() {
  return DOMAINS.filter((d) => d.available)
}
