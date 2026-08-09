// ============================================================
// 授業（レッスン）画面 — 問題の前に「教わる」ターン
//
// ・ポイントを1つずつ見せながら読み上げる（いっぺんに出すと読まない）
// ・「もういちど」で聞き直せる
// ・復習モード（正解率が低かった教科）では、その旨をやさしく伝える
// ============================================================

import React, { useEffect, useState } from 'react'
import { DOMAIN_BY_ID, domainName } from '../engine/activities.js'
import { AppHeader, Starfield } from '../components/common.jsx'
import { speak, cancelSpeak } from '../engine/tts.js'
import { sfx } from '../engine/sfx.js'

export default function LessonScreen({ lesson, domainId, grade, isReview, onDone }) {
  const dom = DOMAIN_BY_ID[domainId]
  const [step, setStep] = useState(-1) // -1 = タイトル、0..n-1 = ポイント、n = まとめ
  const points = lesson?.points || []
  const total = points.length

  useEffect(() => {
    if (!lesson) {
      onDone()
      return
    }
    speak(
      isReview
        ? `${domainName(dom, grade)}の おさらいだよ。${lesson.title}。もういちど いっしょに かくにん しよう`
        : `きょうの じゅぎょうは、${lesson.title}`
    )
    return () => cancelSpeak()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson])

  if (!lesson) return null

  const next = () => {
    sfx.tap()
    const n = step + 1
    setStep(n)
    if (n < total) speak(points[n])
    else speak(`${lesson.tip} じゃあ、やってみよう！`)
  }

  const repeat = () => {
    sfx.tap()
    if (step < 0) speak(lesson.title)
    else if (step < total) speak(points[step])
    else speak(lesson.tip)
  }

  const finish = () => {
    sfx.reward()
    cancelSpeak()
    onDone()
  }

  return (
    <div className="screen screen-in">
      <Starfield count={14} />

      <AppHeader
        onBack={finish}
        backIcon="⏭"
        backLabel="スキップ"
        title={isReview ? '🔁 おさらい じゅぎょう' : '📚 じゅぎょう'}
        right={<div className="pill">{dom?.emoji} {domainName(dom, grade)}</div>}
      />

      <div className="center-col scroll-col">
        {isReview && (
          <div className="conquer-tag">
            まちがえても だいじょうぶ。もういちど かくにん すれば つよくなる！
          </div>
        )}

        <div
          className="card"
          style={{ width: 'min(680px,94vw)', textAlign: 'center', padding: '18px 16px' }}
        >
          <div style={{ fontSize: 52 }}>{dom?.emoji}</div>
          <div style={{ fontWeight: 900, fontSize: 'clamp(20px,4vw,30px)', lineHeight: 1.4 }}>
            {lesson.title}
          </div>

          {/* ポイントを1つずつ */}
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {points.map((p, i) => {
              const shown = i <= step
              return (
                <div
                  key={i}
                  className="card"
                  style={{
                    textAlign: 'left',
                    background: shown ? 'rgba(122,240,208,0.16)' : 'rgba(255,255,255,0.05)',
                    border: i === step ? '3px solid var(--accent)' : '2px solid rgba(255,255,255,0.12)',
                    opacity: shown ? 1 : 0.35,
                    fontWeight: 800,
                    fontSize: 'clamp(15px,2.8vw,20px)',
                    lineHeight: 1.6,
                    padding: '12px 14px'
                  }}
                >
                  <span style={{ color: 'var(--accent-2)', marginRight: 8 }}>{i + 1}.</span>
                  {shown ? p : '？？？'}
                </div>
              )
            })}
          </div>

          {step >= total && (
            <div
              className="card"
              style={{
                marginTop: 12,
                background: 'rgba(255,209,102,0.18)',
                border: '3px solid var(--accent-2)',
                fontWeight: 800,
                fontSize: 'clamp(14px,2.6vw,19px)',
                lineHeight: 1.6
              }}
            >
              💡 コツ: {lesson.tip}
            </div>
          )}
        </div>

        <div className="row wrap" style={{ justifyContent: 'center', gap: 10 }}>
          <button className="btn btn--ghost" onClick={repeat}>
            🔊 もういちど
          </button>
          {step < total ? (
            <button className="btn btn--primary btn--big btn--glow" onClick={next}>
              {step < 0 ? '▶️ じゅぎょうを はじめる' : `つぎへ（${step + 1}/${total}）`}
            </button>
          ) : (
            <button className="btn btn--primary btn--big btn--glow" onClick={finish}>
              ✅ わかった！ もんだいへ
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
