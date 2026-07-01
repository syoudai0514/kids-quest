// ============================================================
// なかま ずかん（モンスター収集ビュー）
// 出会ったモンスターは色つき＋説明、まだのモンスターは「？」。
// タップで名前と説明を読み上げる。
// ============================================================

import React from 'react'
import { useGame } from '../state/GameContext.jsx'
import { MONSTERS } from '../data/monsters.js'
import Monster from '../components/Monster.jsx'
import { Starfield } from '../components/common.jsx'
import { speak } from '../engine/tts.js'
import { sfx } from '../engine/sfx.js'

export default function CollectionScreen({ onBack }) {
  const { state } = useGame()
  const unlocked = new Set(state.unlockedMonsters)

  const tap = (m, isUnlocked) => {
    if (isUnlocked) {
      // なかまは「鳴き声」つき（idから音程が決まる）
      let seed = 0
      for (const ch of m.id) seed += ch.charCodeAt(0)
      sfx.cry(seed)
      speak(`${m.name}。 ${m.desc}`)
    } else {
      sfx.star()
      speak('まだ であって いない なかま。バトルで さがそう！')
    }
  }

  return (
    <div className="screen fade-in">
      <Starfield />
      <div className="topbar">
        <button className="btn btn--ghost" style={{ minHeight: 60 }} onClick={onBack}>
          🏠 もどる
        </button>
        <div className="topbar__title">📒 なかま ずかん</div>
        <div className="pill">
          {unlocked.size} / {MONSTERS.length}
        </div>
      </div>

      <div className="scroll-y" style={{ flex: 1, padding: '6px 4px 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 16,
            maxWidth: 980,
            margin: '0 auto'
          }}
        >
          {MONSTERS.map((m) => {
            const isUnlocked = unlocked.has(m.id)
            return (
              <button
                key={m.id}
                className="card"
                onClick={() => tap(m, isUnlocked)}
                style={{
                  cursor: 'pointer',
                  textAlign: 'center',
                  opacity: isUnlocked ? 1 : 0.6,
                  border: m.role === 'partner' ? '3px solid var(--accent)' : undefined
                }}
              >
                {isUnlocked ? (
                  <Monster monster={m} size={110} bounce={false} />
                ) : (
                  <div
                    style={{
                      height: 110,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 70,
                      filter: 'grayscale(1) brightness(0.5)'
                    }}
                  >
                    ❔
                  </div>
                )}
                <div style={{ fontWeight: 900, marginTop: 6, fontSize: 'clamp(15px,2.6vw,20px)' }}>
                  {isUnlocked ? m.name : '？？？'}
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {isUnlocked ? m.element : 'みっけよう'}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
