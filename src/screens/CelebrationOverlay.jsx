// ============================================================
// ごほうび演出オーバーレイ
// 惑星の到着・新しいなかま・解放チケットを、紙吹雪と音声で祝う。
// ============================================================

import React, { useEffect, useMemo } from 'react'
import { Confetti } from '../components/common.jsx'
import Monster from '../components/Monster.jsx'
import { MONSTER_BY_ID } from '../data/monsters.js'
import { speak } from '../engine/tts.js'
import { sfx } from '../engine/sfx.js'

export default function CelebrationOverlay({ celebration, onClose }) {
  const { planet, monster, ticket, partnerStageUp } = celebration
  const hasBig = planet || monster || ticket || partnerStageUp
  const newMonster = monster ? MONSTER_BY_ID[monster] : null

  const title = useMemo(() => {
    if (monster) return 'あたらしい なかま！'
    if (planet) return 'あたらしい ほしに とうちゃく！'
    if (partnerStageUp) return 'あいぼうが おおきく なった！'
    if (ticket) return 'バトルチケット ゲット！'
    return ''
  }, [monster, planet, partnerStageUp, ticket])

  useEffect(() => {
    if (!hasBig) {
      onClose()
      return
    }
    sfx.fanfare()
    const lines = []
    if (planet) lines.push(`${planet.name}に とうちゃく！ ${planet.story}`)
    if (newMonster) lines.push(`${newMonster.name}が なかまに なったよ！`)
    if (partnerStageUp) lines.push('あいぼうが せいちょうしたよ！')
    if (ticket && !planet && !monster)
      lines.push('バトルチケットを ゲット！ いきぬきバトルが あそべるよ')
    speak(lines.join(' '))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!hasBig) return null

  return (
    <div
      className="feedback fade-in"
      style={{
        background: planet
          ? `linear-gradient(165deg, ${planet.bg[0]}ee, ${planet.bg[1]}ee)`
          : 'rgba(12,8,40,0.85)',
        pointerEvents: 'auto',
        padding: 20
      }}
    >
      <Confetti pieces={50} />
      <div
        className="card"
        style={{ textAlign: 'center', width: 'min(640px,94vw)', background: 'rgba(255,255,255,0.1)' }}
      >
        <div style={{ fontSize: 'clamp(24px,5vw,40px)', fontWeight: 900, marginBottom: 8 }}>
          {title}
        </div>

        {planet && !newMonster && <div style={{ fontSize: 'clamp(60px,14vw,120px)' }}>{planet.emoji}</div>}

        {newMonster && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
            <Monster monster={newMonster} size={150} />
          </div>
        )}

        {ticket && !planet && !newMonster && <div style={{ fontSize: 'clamp(60px,14vw,120px)' }}>🎟️</div>}

        {(planet?.story || newMonster?.desc) && (
          <div
            style={{
              fontSize: 'clamp(16px,3vw,22px)',
              fontWeight: 700,
              margin: '10px 0 14px',
              lineHeight: 1.5
            }}
          >
            {newMonster ? newMonster.desc : planet.story}
          </div>
        )}

        <div className="muted" style={{ fontWeight: 800, marginBottom: 14 }}>✨ ほしのかけら +6</div>

        <button className="btn btn--primary btn--big" onClick={onClose}>
          やったー！
        </button>
      </div>
    </div>
  )
}
