// ============================================================
// はじめての おはなし（オンボーディング）
// 相棒ホッシュとの出会い → すきな色を選ぶ → しゅっぱつ！
// 5歳が一人で進められるよう、読み上げ＋タップ2回だけ。
// ============================================================

import React, { useEffect, useState } from 'react'
import { useGame, PARTNER_COLORS } from '../state/GameContext.jsx'
import { getPartner } from '../data/monsters.js'
import Monster from '../components/Monster.jsx'
import { Starfield, Confetti } from '../components/common.jsx'
import { speak } from '../engine/tts.js'
import { sfx } from '../engine/sfx.js'

export default function OnboardingScreen() {
  const { dispatch } = useGame()
  const partner = getPartner()
  const [color, setColor] = useState('mint')
  const [step, setStep] = useState(0) // 0: 出会い / 1: 色えらび

  useEffect(() => {
    const t = setTimeout(() => {
      speak(
        'こんにちは！ ぼくは ほしのモンスター、ホッシュ！ きみと いっしょに うちゅうを たびしたいな。ぼくの いろを えらんでね！'
      )
      setStep(1)
    }, 600)
    return () => clearTimeout(t)
  }, [])

  const colors =
    color === 'mint'
      ? partner.colors
      : { ...partner.colors, body: PARTNER_COLORS[color].body, belly: PARTNER_COLORS[color].belly }

  const pickColor = (key) => {
    setColor(key)
    sfx.pop()
    speak(`${PARTNER_COLORS[key].label}いろ、いいね！`)
  }

  const start = () => {
    sfx.fanfare()
    speak('しゅっぱつ しんこう！ ほしぞらクエストの はじまりだ！')
    dispatch({ type: 'ONBOARD', color })
  }

  return (
    <div className="screen fade-in">
      <Starfield count={40} />
      <Confetti pieces={20} />
      <div className="center-col">
        <div style={{ fontSize: 'clamp(24px,4.5vw,40px)', fontWeight: 900, textAlign: 'center' }}>
          🚀 ほしぞらクエスト
        </div>

        <div className="bubble">こんにちは！ ぼく、ホッシュ！ いっしょに うちゅうを たびしよう！</div>

        <Monster monster={partner} colorsOverride={colors} size={180} />

        {step >= 1 && (
          <>
            <div className="muted" style={{ fontWeight: 800, fontSize: 'clamp(15px,2.6vw,20px)' }}>
              すきな いろを えらんでね
            </div>
            <div className="swatch-row">
              {Object.entries(PARTNER_COLORS).map(([key, c]) => (
                <button
                  key={key}
                  className={'swatch' + (color === key ? ' swatch--active' : '')}
                  style={{ background: `linear-gradient(180deg, ${c.body}, ${c.belly})` }}
                  onClick={() => pickColor(key)}
                  aria-label={c.label}
                />
              ))}
            </div>
            <button className="btn btn--primary btn--big" onClick={start}>
              🚀 しゅっぱつ！
            </button>
          </>
        )}
      </div>
    </div>
  )
}
