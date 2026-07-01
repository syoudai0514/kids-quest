// ============================================================
// ホーム画面 ＝ 宇宙の旅のハブ
//  - いまいる惑星の空の色（App が背景を切り替える）
//  - 相棒（タップすると話す・レベルバッジつき）
//  - 航路マップ: きょうのミッション5つ＝ロケットが次の惑星へ進む
//  - しゅっぱつ / バトル / ついかもんだい / ずかん
// ============================================================

import React, { useMemo, useState } from 'react'
import { useGame, partnerLevel, PARTNER_COLORS } from '../state/GameContext.jsx'
import { getPartner, partnerStage } from '../data/monsters.js'
import { currentPlanet, nextPlanet } from '../data/planets.js'
import { buildOkawariTask, buildExtraTask, OKAWARI_MAX } from '../engine/missions.js'
import Monster from '../components/Monster.jsx'
import { Starfield, useSpeakOnMount } from '../components/common.jsx'
import { sfx } from '../engine/sfx.js'
import { speak } from '../engine/tts.js'

const PARTNER_LINES = [
  'きょうも いっしょに がんばろう！',
  'つぎの ほしまで もうすこし！',
  'きみと たびが できて うれしいな',
  'バトルの とっくん しようよ！',
  'おなか すいたなぁ… ほしのかけら たべたい！'
]

// 相棒の色（オンボーディングで選んだ色）を反映
function partnerColorOverride(state, stage) {
  const c = PARTNER_COLORS[state.partnerColor]
  if (!c || state.partnerColor === 'mint') return stage.colors
  return { ...stage.colors, body: c.body, belly: c.belly }
}

export default function HomeScreen({ onStartTask, onGo }) {
  const { state } = useGame()
  const partner = getPartner()
  const stage = partnerStage(partner, state.totalClears)
  const colors = partnerColorOverride(state, stage)
  const planet = currentPlanet(state.totalClears)
  const next = nextPlanet(state.totalClears)
  const level = partnerLevel(state.xp)

  const daily = state.daily
  const coreDone = daily.coreDone
  const coreLeft = daily.coreTasks.length - daily.coreIndex
  const okawariLeft = OKAWARI_MAX - daily.okawariIndex

  const battlePlaysLeft = Math.max(0, state.battle.dailyLimit - state.battle.playsUsed)
  const canBattle = battlePlaysLeft > 0 || state.battle.tickets > 0

  const [bubble, setBubble] = useState(null)

  const greeting = useMemo(() => {
    if (coreDone) return 'きょうの ミッション ぜんぶ クリア！ すごい！'
    if (daily.coreIndex === 0) return `${planet.name}から しゅっぱつ！ きょうの ミッションだ！`
    return `あと ${coreLeft}こで つぎの ほしに ちかづくよ！`
  }, [coreDone, daily.coreIndex, coreLeft, planet.name])

  useSpeakOnMount(`${stage.name}だよ。${greeting}`, [greeting])

  const tapPartner = () => {
    const line = PARTNER_LINES[Math.floor(Math.random() * PARTNER_LINES.length)]
    setBubble(line)
    sfx.pop()
    speak(line)
    setTimeout(() => setBubble(null), 3000)
  }

  const startCore = () => {
    sfx.swoosh()
    const task = daily.coreTasks[daily.coreIndex]
    if (task) onStartTask(task)
  }
  const startOkawari = () => {
    sfx.swoosh()
    onStartTask(buildOkawariTask(daily.okawariIndex))
  }
  const startExtra = () => {
    sfx.tap()
    speak('ついか もんだいに ちょうせん！ クリアすると バトルチケットが もらえるよ')
    onStartTask(buildExtraTask(daily.extraIndex))
  }

  // 航路マップ: コア5タスクのノード + ゴール（次の惑星）
  const nodes = daily.coreTasks.length

  return (
    <div className="screen fade-in">
      <Starfield />

      <div className="topbar">
        <div className="pill">
          {planet.emoji} {planet.name}
        </div>
        <div className="row" style={{ gap: 8 }}>
          {state.streak > 1 && <div className="pill">🔥 {state.streak}にち</div>}
          <div className="pill">✨ {state.xp}</div>
          <button
            className="btn btn--ghost"
            style={{ minHeight: 58, padding: '10px 16px' }}
            onClick={() => {
              sfx.tap()
              onGo('parent')
            }}
            aria-label="おうちのひと"
          >
            👨‍👩‍👧
          </button>
        </div>
      </div>

      <div className="center-col scroll-col">
        {/* 相棒 */}
        <div className="partner-wrap" onClick={tapPartner}>
          {bubble && <div className="bubble">{bubble}</div>}
          <div style={{ position: 'relative' }}>
            <Monster monster={partner} colorsOverride={colors} size={140} />
            <div className="lv-badge">Lv.{level}</div>
          </div>
          <div style={{ fontWeight: 900, fontSize: 'clamp(19px,3.2vw,27px)', marginTop: 4 }}>
            {stage.name}
          </div>
        </div>

        {/* 航路マップ */}
        <div>
          <div
            className="muted"
            style={{ textAlign: 'center', fontWeight: 800, fontSize: 'clamp(13px,2.2vw,16px)', marginBottom: 6 }}
          >
            {coreDone
              ? '🎉 きょうの こうろ クリア！'
              : `きょうの こうろ（あと ${coreLeft}つ）`}
            {next && ` ・ ${next.name}まで あと${next.unlockAt - state.totalClears}かい`}
          </div>
          <div className="route">
            {Array.from({ length: nodes }).map((_, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div className={'route__seg' + (i <= daily.coreIndex ? ' route__seg--done' : '')} />}
                {i === daily.coreIndex && !coreDone ? (
                  <span className="route__rocket">🚀</span>
                ) : (
                  <div className={'route__node' + (i < daily.coreIndex ? ' route__node--done' : '')} />
                )}
              </React.Fragment>
            ))}
            <div className={'route__seg' + (coreDone ? ' route__seg--done' : '')} />
            <span className={'route__goal' + (coreDone ? ' route__goal--reached' : '')}>
              {(next || planet).emoji}
            </span>
          </div>
        </div>

        {/* メインアクション */}
        {!coreDone ? (
          <button className="btn btn--primary btn--big" onClick={startCore}>
            🚀 しゅっぱつ！
          </button>
        ) : okawariLeft > 0 ? (
          <button className="btn btn--pink btn--big" onClick={startOkawari}>
            🍭 おかわり であそぶ（あと{okawariLeft}）
          </button>
        ) : (
          <div className="card" style={{ textAlign: 'center', fontWeight: 800 }}>
            きょうは たっぷり がんばったね！ また あした！
          </div>
        )}

        {/* サブメニュー */}
        <div className="menu-row">
          <button
            className="menu-tile"
            style={{ background: 'linear-gradient(180deg,#ffe08a,#ffb84d)' }}
            onClick={() => {
              sfx.tap()
              onGo('battle')
            }}
          >
            <span className="menu-tile__emoji">⚔️</span>
            <span className="menu-tile__label">バトル</span>
            <span className="menu-tile__sub">
              {canBattle ? `あと ${battlePlaysLeft + state.battle.tickets}かい` : 'チケットで あそべる'}
            </span>
            {state.battle.tickets > 0 && <span className="notice-badge">🎟{state.battle.tickets}</span>}
          </button>

          <button
            className="menu-tile"
            style={{ background: 'linear-gradient(180deg,#cdb8ff,#9d7bff)' }}
            onClick={startExtra}
          >
            <span className="menu-tile__emoji">🎟️</span>
            <span className="menu-tile__label">ついかもんだい</span>
            <span className="menu-tile__sub">クリアで チケット</span>
          </button>

          <button
            className="menu-tile"
            style={{ background: 'linear-gradient(180deg,#a8ecff,#5fc9ff)' }}
            onClick={() => {
              sfx.tap()
              onGo('collection')
            }}
          >
            <span className="menu-tile__emoji">📒</span>
            <span className="menu-tile__label">ずかん</span>
            <span className="menu-tile__sub">{state.unlockedMonsters.length} / 100</span>
          </button>
        </div>
      </div>
    </div>
  )
}
