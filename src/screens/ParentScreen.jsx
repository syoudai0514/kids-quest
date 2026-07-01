// ============================================================
// 保護者向けビュー（おまけ）
//  - 今日やった量、得意/苦手の傾向、息抜き解放（チケット）の回数。
//  - 音声・効果音の ON/OFF、データのリセット。
//  - すべて端末内にのみ保存（プライバシー説明つき）。
// ============================================================

import React, { useState } from 'react'
import { useGame } from '../state/GameContext.jsx'
import { DOMAINS } from '../engine/activities.js'
import { trendLabel } from '../engine/difficulty.js'
import { setTtsEnabled } from '../engine/tts.js'
import { setSfxEnabled } from '../engine/sfx.js'

function Stat({ label, value, sub }) {
  return (
    <div className="card" style={{ flex: '1 1 140px', textAlign: 'center' }}>
      <div style={{ fontSize: 'clamp(26px,5vw,40px)', fontWeight: 900 }}>{value}</div>
      <div className="muted" style={{ fontWeight: 700 }}>{label}</div>
      {sub && <div className="muted" style={{ fontSize: 12 }}>{sub}</div>}
    </div>
  )
}

function trendColor(label) {
  if (label === 'とくい！') return 'var(--good)'
  if (label === 'おうえん中') return 'var(--bad-soft)'
  return 'var(--accent)'
}

export default function ParentScreen({ onBack }) {
  const { state, dispatch } = useGame()
  const d = state.daily
  const accuracy = d.attemptsToday ? Math.round((d.correctToday / d.attemptsToday) * 100) : 0
  const [confirmReset, setConfirmReset] = useState(false)

  // 直近7日間の取り組み日数
  const activeDays = Object.keys(state.history).length + (d.attemptsToday > 0 ? 1 : 0)

  const toggle = (key) => {
    const next = !state.settings[key]
    dispatch({ type: 'SET_SETTING', key, value: next })
    if (key === 'tts') setTtsEnabled(next)
    if (key === 'sfx') setSfxEnabled(next)
  }

  return (
    <div className="screen fade-in">
      <div className="topbar">
        <button className="btn btn--ghost" style={{ minHeight: 56 }} onClick={onBack}>
          ← もどる
        </button>
        <div className="topbar__title">👨‍👩‍👧 おうちのひとへ</div>
        <div style={{ width: 60 }} />
      </div>

      <div className="scroll-y" style={{ flex: 1, padding: '4px 8px 28px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* 今日のサマリー */}
          <div>
            <h3 style={{ margin: '4px 0 10px' }}>きょうの がんばり</h3>
            <div className="row wrap">
              <Stat label="クリアした タスク" value={d.tasksClearedToday} />
              <Stat label="といた もんだい" value={d.attemptsToday} />
              <Stat label="せいかい率" value={`${accuracy}%`} />
              <Stat
                label="息抜き解放"
                value={d.ticketsEarnedToday}
                sub="追加問題で獲得したチケット数"
              />
              <Stat label="連続日数" value={`${state.streak}日`} sub="毎日つづけると🔥" />
            </div>
          </div>

          {/* 分野ごとの傾向 */}
          <div>
            <h3 style={{ margin: '4px 0 10px' }}>とくい・にがての けいこう</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DOMAINS.map((dom) => {
                const sk = state.skills[dom.id]
                const today = d.perDomainToday[dom.id]
                const label = dom.available ? trendLabel(sk) : 'じゅんびちゅう'
                return (
                  <div key={dom.id} className="card row" style={{ alignItems: 'center', gap: 14 }}>
                    <div style={{ fontSize: 30 }}>{dom.emoji}</div>
                    <div className="grow">
                      <div style={{ fontWeight: 900 }}>{dom.name}</div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {dom.available
                          ? `レベル ${Math.floor(sk.level)} ・ きょう ${
                              today ? `${today.correct}/${today.attempts}` : '0/0'
                            }`
                          : 'もうすぐ ついか予定'}
                      </div>
                    </div>
                    <div
                      className="pill"
                      style={{ background: trendColor(label), color: '#10231c', border: 'none' }}
                    >
                      {label}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>
              ※「おうえん中」の分野は、アプリが自動でヒントを増やし、段階を細かくして支えます。
              苦手意識を持たせない設計です。
            </p>
          </div>

          {/* 設定 */}
          <div>
            <h3 style={{ margin: '4px 0 10px' }}>せってい</h3>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label className="row" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800 }}>🔊 おんせい よみあげ</span>
                <button
                  className={'btn ' + (state.settings.tts ? 'btn--primary' : 'btn--ghost')}
                  style={{ minHeight: 52, padding: '8px 20px' }}
                  onClick={() => toggle('tts')}
                >
                  {state.settings.tts ? 'ON' : 'OFF'}
                </button>
              </label>
              <label className="row" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800 }}>🎵 こうかおん</span>
                <button
                  className={'btn ' + (state.settings.sfx ? 'btn--primary' : 'btn--ghost')}
                  style={{ minHeight: 52, padding: '8px 20px' }}
                  onClick={() => toggle('sfx')}
                >
                  {state.settings.sfx ? 'ON' : 'OFF'}
                </button>
              </label>
            </div>
          </div>

          {/* データ */}
          <div>
            <h3 style={{ margin: '4px 0 10px' }}>データ</h3>
            <div className="card">
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, marginTop: 0 }}>
                とりくみ日数: {activeDays}日 ／ 累計クリア: {state.totalClears}回
                <br />
                すべてのデータは この端末のなかだけに保存されます（アカウント登録不要）。
              </p>
              {!confirmReset ? (
                <button className="btn btn--ghost" onClick={() => setConfirmReset(true)}>
                  さいしょから やりなおす
                </button>
              ) : (
                <div className="row wrap">
                  <button
                    className="btn btn--pink"
                    onClick={() => {
                      dispatch({ type: 'RESET_ALL' })
                      setConfirmReset(false)
                      onBack()
                    }}
                  >
                    ほんとうに けす
                  </button>
                  <button className="btn btn--ghost" onClick={() => setConfirmReset(false)}>
                    やめる
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
