// ============================================================
// ごほうび演出オーバーレイ
// 惑星の到着・新しいなかま・チケット・学年の解放を、紙吹雪と音声で祝う。
// 学年解放は「成功体験」の頂点なので、いちばん派手に。
// ============================================================

import React, { useEffect, useMemo } from 'react'
import { useGame } from '../state/GameContext.jsx'
import { Confetti, Burst } from '../components/common.jsx'
import Monster from '../components/Monster.jsx'
import { MONSTER_BY_ID } from '../data/monsters.js'
import { gradeOf } from '../data/grades.js'
import { speak } from '../engine/tts.js'
import { sfx } from '../engine/sfx.js'

export default function CelebrationOverlay({ celebration, onClose }) {
  const { dispatch } = useGame()
  const { planet, monster, ticket, partnerStageUp, gradeUp, ticketReason, ticketPenalty, ticketMessage } = celebration
  const hasBig =
    planet || monster || ticket || partnerStageUp || gradeUp != null || !!ticketReason
  const newMonster = monster ? MONSTER_BY_ID[monster] : null
  const newGrade = gradeUp != null ? gradeOf(gradeUp) : null

  const title = useMemo(() => {
    if (ticketReason) return ticketPenalty ? '🎟️ チケットが へったよ' : '🎟️ チケットは あと すこし'
    if (newGrade) return '🎓 レベルマスター！'
    if (monster) return 'あたらしい なかま！'
    if (planet) return 'あたらしい ほしに とうちゃく！'
    if (partnerStageUp) return 'あいぼうが おおきく なった！'
    if (ticket) return 'バトルチケット ゲット！'
    return ''
  }, [newGrade, monster, planet, partnerStageUp, ticket])

  useEffect(() => {
    if (!hasBig) {
      onClose()
      return
    }
    sfx.fanfare()
    const lines = []
    if (newGrade)
      lines.push(
        `すごい！ いまの がくねんを マスターしたよ！ ${newGrade.name}の もんだいに チャレンジできるように なった！`
      )
    if (planet) lines.push(`${planet.name}に とうちゃく！ ${planet.story}`)
    if (newMonster) lines.push(`${newMonster.name}が なかまに なったよ！`)
    if (partnerStageUp) lines.push('あいぼうが せいちょうしたよ！')
    if (ticket && !planet && !monster && !newGrade)
      lines.push(ticketMessage || 'バトルチケットを ゲット！ いきぬきバトルが あそべるよ')
    if (ticketReason) lines.push(ticketReason)
    speak(lines.join(' '))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!hasBig) return null

  const challengeNow = () => {
    if (gradeUp != null) {
      dispatch({ type: 'SET_GRADE', grade: gradeUp })
      sfx.levelUp()
      speak(`${newGrade.name}、スタート！ きみなら できる！`)
    }
    onClose()
  }

  return (
    <div
      className="feedback fade-in"
      style={{
        background: planet
          ? `linear-gradient(165deg, ${planet.bg[0]}ee, ${planet.bg[1]}ee)`
          : 'rgba(12,8,40,0.88)',
        pointerEvents: 'auto',
        padding: 20
      }}
    >
      <Confetti pieces={newGrade ? 70 : 50} />
      {newGrade && <Burst gold count={16} />}
      <div
        className="card overlay__panel"
        style={{ textAlign: 'center', width: 'min(640px,94vw)', background: 'rgba(255,255,255,0.1)' }}
      >
        <div style={{ fontSize: 'clamp(24px,5vw,40px)', fontWeight: 900, marginBottom: 8 }}>
          {title}
        </div>

        {newGrade && (
          <>
            <div style={{ fontSize: 'clamp(60px,14vw,110px)' }}>{newGrade.emoji}</div>
            <div style={{ fontSize: 'clamp(17px,3.2vw,23px)', fontWeight: 800, margin: '8px 0 16px', lineHeight: 1.6 }}>
              いまの がくねんを マスター！
              <br />
              <span style={{ color: 'var(--accent-2)' }}>{newGrade.name}</span> が あそべるように なったよ！
            </div>
          </>
        )}

        {planet && !newMonster && !newGrade && (
          <div style={{ fontSize: 'clamp(60px,14vw,120px)' }}>{planet.emoji}</div>
        )}

        {newMonster && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
            <Monster monster={newMonster} size={150} />
          </div>
        )}

        {ticket && !planet && !newMonster && !newGrade && (
          <>
            <div style={{ fontSize: 'clamp(60px,14vw,120px)' }}>🎟️</div>
            {ticketMessage && (
              <div style={{ fontSize: 'clamp(15px,2.9vw,20px)', fontWeight: 800, margin: '0 0 10px', lineHeight: 1.6 }}>
                {ticketMessage}
              </div>
            )}
          </>
        )}

        {/* チケットが もらえなかった／へった とき（不正な連打への やさしい注意） */}
        {ticketReason && (
          <>
            <div style={{ fontSize: 'clamp(56px,12vw,100px)' }}>{ticketPenalty ? '😮' : '🤔'}</div>
            <div style={{ fontSize: 'clamp(15px,2.9vw,20px)', fontWeight: 800, margin: '8px 0 4px', lineHeight: 1.6 }}>
              {ticketReason}
            </div>
            <div className="muted" style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.6, marginBottom: 10 }}>
              ゆっくり よんで こたえると、ちゃんと チケットが もらえるよ。
              <br />まちがえても だいじょうぶ。よく 考えるのが 大事！
            </div>
          </>
        )}

        {(planet?.story || newMonster?.desc) && !newGrade && (
          <div style={{ fontSize: 'clamp(16px,3vw,22px)', fontWeight: 700, margin: '10px 0 14px', lineHeight: 1.5 }}>
            {newMonster ? newMonster.desc : planet.story}
          </div>
        )}

        {!newGrade && (
          <div className="muted" style={{ fontWeight: 800, marginBottom: 14 }}>
            ✨ ほしのかけら +{celebration.xpGain ?? 6}
          </div>
        )}

        {newGrade ? (
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            <button className="btn btn--sun btn--big" onClick={challengeNow}>
              🎓 チャレンジする！
            </button>
            <button className="btn btn--ghost" onClick={onClose}>
              あとで
            </button>
          </div>
        ) : (
          <button className="btn btn--primary btn--big" onClick={onClose}>
            やったー！
          </button>
        )}
      </div>
    </div>
  )
}
