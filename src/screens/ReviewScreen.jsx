// ============================================================
// とっくん（復習）画面 — 「まちがいは たからもの」
//
// まちがえた問題が「ちからのタネ」として並び、とっくんで正解すると
// 金の演出とボーナス✨つきで「ちからに なった！」に変わる。
// 「まちがいから おぼえた数」を大きく見せて、
// 失敗するほど知っていることが増える、を体感させる。
// ============================================================

import React, { useEffect } from 'react'
import { useGame, missedCount } from '../state/GameContext.jsx'
import { DOMAIN_BY_ID } from '../engine/activities.js'
import { KIND_LABELS } from '../data/content/numbers.js'
import { Starfield } from '../components/common.jsx'
import { speak } from '../engine/tts.js'
import { sfx } from '../engine/sfx.js'

// itemKey → 子ども向けの表示
function labelOf(domainId, key) {
  if (domainId === 'yomu') {
    if (key.startsWith('k:')) return { big: key.slice(2), sub: 'かんじ' }
    if (key.startsWith('w:')) return { big: key.slice(2), sub: 'ことば' }
  }
  if (domainId === 'kaku') return { big: key, sub: 'かく' }
  if (domainId === 'suuji' && key.startsWith('n:')) {
    return { big: '🔢', sub: KIND_LABELS[key.slice(2)] || 'さんすう' }
  }
  return { big: '❓', sub: '' }
}

export default function ReviewScreen({ onBack, onStartTask }) {
  const { state } = useGame()
  const count = missedCount(state)

  // 全分野のキュー項目を平らに
  const items = []
  for (const [domainId, keys] of Object.entries(state.missed)) {
    for (const key of keys) items.push({ domainId, key })
  }

  useEffect(() => {
    if (count === 0) {
      speak(`すごい！ いまは ぜんぶ おぼえてるよ。きみは まちがいから ${state.conquered}こも おぼえたんだ！`)
    } else {
      speak(
        `とっくんの じかん！ まちがえた もんだいは、おぼえられる チャンス。${count}こ とっくんして、ちからに かえよう！`
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const start = () => {
    sfx.swoosh()
    // 最大6問ぶんをシャッフルして とっくんタスクに
    const plan = [...items].sort(() => Math.random() - 0.5).slice(0, 6)
    onStartTask({
      uid: `review_${Date.now()}`,
      kind: 'review',
      domainId: plan[0].domainId,
      questionCount: plan.length,
      plan
    })
  }

  return (
    <div className="screen screen-in">
      <Starfield />
      <div className="topbar">
        <button className="btn btn--ghost" style={{ minHeight: 60 }} onClick={onBack}>
          🏠 もどる
        </button>
        <div className="topbar__title">🎯 とっくん</div>
        <div className="pill">⚡ {state.conquered}</div>
      </div>

      <div className="center-col scroll-col">
        {/* 「失敗から学んだ数」を主役に */}
        <div className="conquer-counter">
          <div className="conquer-counter__num">{state.conquered}</div>
          <div className="conquer-counter__label">まちがいから おぼえた かず</div>
        </div>

        {count === 0 ? (
          <div className="card" style={{ textAlign: 'center', width: 'min(560px,92vw)' }}>
            <div style={{ fontSize: 60 }}>🏆</div>
            <div style={{ fontWeight: 900, fontSize: 'clamp(18px,3.4vw,26px)', margin: '8px 0' }}>
              いまは ぜんぶ おぼえてる！
            </div>
            <div className="muted" style={{ fontWeight: 700, lineHeight: 1.6 }}>
              まちがえたら ここに あつまるよ。
              <br />
              まちがいは あたらしく おぼえられる チャンス！
            </div>
          </div>
        ) : (
          <>
            <div className="muted" style={{ fontWeight: 800, fontSize: 'clamp(14px,2.6vw,18px)' }}>
              とっくんで 「ちから」に かえよう（あと {count}こ）
            </div>
            <div className="seed-grid">
              {items.slice(0, 12).map(({ domainId, key }) => {
                const l = labelOf(domainId, key)
                const dom = DOMAIN_BY_ID[domainId]
                return (
                  <div key={`${domainId}:${key}`} className="seed-card">
                    <span className="seed-card__big">{l.big}</span>
                    <span className="seed-card__sub">
                      {dom?.emoji} {l.sub}
                    </span>
                  </div>
                )
              })}
            </div>
            <button className="btn btn--sun btn--big" onClick={start}>
              ⚡ とっくん スタート！
            </button>
          </>
        )}
      </div>
    </div>
  )
}
