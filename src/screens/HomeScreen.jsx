// ============================================================
// ホーム画面（ハブ）
// 相棒モンスター・今いる惑星・今日のミッション進捗・大きなボタン。
// ============================================================

import React, { useMemo } from 'react'
import { useGame } from '../state/GameContext.jsx'
import { getPartner, partnerStage } from '../data/monsters.js'
import { currentPlanet, nextPlanet } from '../data/planets.js'
import { buildOkawariTask, buildExtraTask } from '../engine/missions.js'
import Monster from '../components/Monster.jsx'
import { Starfield, ProgressDots, useSpeakOnMount } from '../components/common.jsx'
import { sfx } from '../engine/sfx.js'
import { speak } from '../engine/tts.js'

export default function HomeScreen({ onStartTask, onGo }) {
  const { state } = useGame()
  const partner = getPartner()
  const stage = partnerStage(partner, state.totalClears)
  const planet = currentPlanet(state.totalClears)
  const next = nextPlanet(state.totalClears)

  const daily = state.daily
  const coreDone = daily.coreDone
  const coreLeft = daily.coreTasks.length - daily.coreIndex

  const battlePlaysLeft = Math.max(0, state.battle.dailyLimit - state.battle.playsUsed)
  const canBattle = battlePlaysLeft > 0 || state.battle.tickets > 0

  const greeting = useMemo(() => {
    if (coreDone) return `${stage.name}だよ。きょうのミッション ぜんぶ クリア！ すごいね！`
    if (daily.coreIndex === 0) return `${stage.name}だよ。きょうも うちゅうの たびに しゅっぱつ！`
    return `${stage.name}だよ。あと ${coreLeft}こで ミッション クリアだよ！`
  }, [coreDone, daily.coreIndex, coreLeft, stage.name])

  useSpeakOnMount(greeting, [greeting])

  const startCore = () => {
    sfx.tap()
    const task = daily.coreTasks[daily.coreIndex]
    if (task) onStartTask(task)
  }
  const startOkawari = () => {
    sfx.tap()
    onStartTask(buildOkawariTask(daily.okawariIndex))
  }
  const startExtra = () => {
    sfx.tap()
    speak('ついか もんだいに ちょうせん！ クリアすると バトルチケットが もらえるよ')
    onStartTask(buildExtraTask(daily.extraIndex))
  }

  return (
    <div className="screen fade-in">
      <Starfield />

      {/* 上部バー */}
      <div className="topbar">
        <div className="pill">
          {planet.emoji} {planet.name}
        </div>
        <div className="row">
          <div className="pill">⭐ {state.totalClears}</div>
          <button
            className="btn btn--ghost"
            style={{ minHeight: 64, padding: '12px 18px' }}
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

      <div className="center-col home-body">
        {/* 相棒モンスター */}
        <div style={{ textAlign: 'center' }}>
          <Monster monster={partner} colorsOverride={stage.colors} size={150} />
          <div style={{ fontWeight: 900, fontSize: 'clamp(20px,3.5vw,30px)', marginTop: 8 }}>
            {stage.name}
          </div>
        </div>

        {/* ミッション進捗 */}
        <div className="card" style={{ width: 'min(720px,94vw)', textAlign: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: 'clamp(18px,3vw,26px)', marginBottom: 10 }}>
            {coreDone ? '🎉 きょうのミッション クリア！' : 'きょうのミッション'}
          </div>
          <ProgressDots total={daily.coreTasks.length} index={daily.coreIndex} />
          {next && (
            <div className="muted" style={{ marginTop: 10, fontSize: 'clamp(13px,2.2vw,17px)' }}>
              つぎの ほし「{next.name}」まで あと {next.unlockAt - state.totalClears}かい
            </div>
          )}
        </div>

        {/* 大きなボタン */}
        <div className="menu-grid">
          {!coreDone ? (
            <button className="menu-tile" style={{ background: 'var(--accent)' }} onClick={startCore}>
              <span className="menu-tile__emoji">🚀</span>
              <span className="menu-tile__label">ミッション スタート</span>
            </button>
          ) : (
            <button className="menu-tile" style={{ background: 'var(--accent-3)' }} onClick={startOkawari}>
              <span className="menu-tile__emoji">🍭</span>
              <span className="menu-tile__label">おかわり であそぶ</span>
            </button>
          )}

          <button
            className="menu-tile"
            style={{ background: 'var(--accent-2)', position: 'relative' }}
            onClick={() => {
              sfx.tap()
              onGo('battle')
            }}
          >
            <span className="menu-tile__emoji">⚔️</span>
            <span className="menu-tile__label">いきぬきバトル</span>
            <span className="muted" style={{ color: '#5a3a00', fontSize: 14, fontWeight: 800 }}>
              {canBattle
                ? `あと ${battlePlaysLeft + state.battle.tickets}かい`
                : 'チケットで あそべるよ'}
            </span>
            {state.battle.tickets > 0 && <span className="notice-badge">🎟{state.battle.tickets}</span>}
          </button>

          <button className="menu-tile" style={{ background: '#b6a8ff' }} onClick={startExtra}>
            <span className="menu-tile__emoji">🎟️</span>
            <span className="menu-tile__label">ついか もんだい</span>
            <span style={{ color: '#2a1f5c', fontSize: 14, fontWeight: 800 }}>
              クリアで バトルチケット
            </span>
          </button>

          <button
            className="menu-tile"
            style={{ background: '#8bf7ff' }}
            onClick={() => {
              sfx.tap()
              onGo('collection')
            }}
          >
            <span className="menu-tile__emoji">📒</span>
            <span className="menu-tile__label">なかま ずかん</span>
            <span style={{ color: '#0c3a30', fontSize: 14, fontWeight: 800 }}>
              {state.unlockedMonsters.length}たい
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
