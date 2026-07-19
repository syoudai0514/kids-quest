// ============================================================
// ホーム画面 ＝ 宇宙の旅のハブ
//  - 航路マップ / 相棒（Lv・タップで会話） / しゅっぱつ
//  - 学年バッジ: タップで学年えらび（マスターすると次が解放＝先取り）
//  - マスターメーター: いまの学年をどこまで極めたか
//  - とっくん: まちがえた問題を「ちから」に変える（バッジで数を表示）
// ============================================================

import React, { useMemo, useState } from 'react'
import {
  useGame,
  partnerLevel,
  PARTNER_COLORS,
  masteryProgress,
  missedCount
} from '../state/GameContext.jsx'
import { getPartner, partnerStage } from '../data/monsters.js'
import { currentPlanet, nextPlanet } from '../data/planets.js'
import { GRADES, gradeOf } from '../data/grades.js'
import { buildOkawariTask, buildExtraTask, OKAWARI_MAX } from '../engine/missions.js'
import Monster from '../components/Monster.jsx'
import { Starfield, useSpeakOnMount } from '../components/common.jsx'
import { sfx } from '../engine/sfx.js'
import { speak } from '../engine/tts.js'

const PARTNER_LINES = [
  'きょうも いっしょに がんばろう！',
  'つぎの ほしまで もうすこし！',
  'きみと たびが できて うれしいな',
  'まちがえても だいじょうぶ。それが ちからに なるんだ！',
  'バトルの とっくん しようよ！'
]

function partnerColorOverride(state, stage) {
  const c = PARTNER_COLORS[state.partnerColor]
  if (!c || state.partnerColor === 'mint') return stage.colors
  return { ...stage.colors, body: c.body, belly: c.belly }
}

export default function HomeScreen({ onStartTask, onGo }) {
  const { state, dispatch } = useGame()
  const partner = getPartner()
  const stage = partnerStage(partner, state.totalClears)
  const colors = partnerColorOverride(state, stage)
  const planet = currentPlanet(state.totalClears)
  const next = nextPlanet(state.totalClears)
  const level = partnerLevel(state.xp)
  const grade = gradeOf(state.grade)
  const mastery = masteryProgress(state)
  const nMissed = missedCount(state)

  const daily = state.daily
  const coreDone = daily.coreDone
  const coreLeft = daily.coreTasks.length - daily.coreIndex
  const okawariLeft = OKAWARI_MAX - daily.okawariIndex

  const battlePlaysLeft = Math.max(0, state.battle.dailyLimit - state.battle.playsUsed)
  const canBattle = battlePlaysLeft > 0 || state.battle.tickets > 0

  const [bubble, setBubble] = useState(null)
  const [showGradePicker, setShowGradePicker] = useState(false)

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

  const pickGrade = (g) => {
    if (g.id > state.gradeMax) {
      sfx.wrongSoft()
      speak('いまの がくねんを マスターすると あくよ！ メーターを いっぱいに しよう')
      return
    }
    sfx.pop()
    dispatch({ type: 'SET_GRADE', grade: g.id })
    speak(`${g.name}の もんだいに きりかえたよ！`)
    setShowGradePicker(false)
  }

  const nodes = daily.coreTasks.length

  return (
    <div className="screen screen-in">
      <Starfield />

      <div className="topbar" style={{ flexWrap: 'wrap' }}>
        <div className="row" style={{ gap: 8 }}>
          <div className="pill">
            {planet.emoji} {planet.name}
          </div>
          <button
            className="pill pill--tap"
            onClick={() => {
              sfx.tap()
              setShowGradePicker(true)
            }}
          >
            {grade.emoji} {grade.short}
          </button>
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
          <div className="partner-aura" style={{ position: 'relative' }}>
            <Monster monster={partner} colorsOverride={colors} size={135} />
            <div className="lv-badge">Lv.{level}</div>
          </div>
          <div style={{ fontWeight: 900, fontSize: 'clamp(19px,3.2vw,27px)', marginTop: 2 }}>
            {stage.name}
          </div>
        </div>

        {/* マスターメーター（いまの学年をどこまで極めたか） */}
        <div style={{ width: 'min(560px,90vw)' }}>
          <div
            className="muted"
            style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 'clamp(12px,2vw,15px)', marginBottom: 4 }}
          >
            <span>{grade.emoji} {grade.short} マスターメーター</span>
            <span>{Math.round(mastery * 100)}%</span>
          </div>
          <div className="hp-bar">
            <div
              className="hp-bar__fill hp-bar__fill--gold"
              style={{ width: `${Math.round(mastery * 100)}%` }}
            />
          </div>
        </div>

        {/* 航路マップ */}
        <div>
          <div
            className="muted"
            style={{ textAlign: 'center', fontWeight: 800, fontSize: 'clamp(13px,2.2vw,16px)', marginBottom: 6 }}
          >
            {coreDone ? '🎉 きょうの こうろ クリア！' : `きょうの こうろ（あと ${coreLeft}つ）`}
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
          <button className="btn btn--primary btn--big btn--glow" onClick={startCore}>
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
            style={{ background: 'linear-gradient(180deg,#cdb8ff,#9d7bff)' }}
            onClick={() => {
              sfx.tap()
              onGo('review')
            }}
          >
            <span className="menu-tile__emoji">🎯</span>
            <span className="menu-tile__label">とっくん</span>
            <span className="menu-tile__sub">
              {nMissed > 0 ? 'まちがいを ちからに！' : `⚡ おぼえた数 ${state.conquered}`}
            </span>
            {nMissed > 0 && <span className="notice-badge">{nMissed}</span>}
          </button>

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
            style={{ background: 'linear-gradient(180deg,#ffb3c9,#ff7aa6)' }}
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

      {/* 学年えらび */}
      {showGradePicker && (
        <div className="overlay" onClick={() => setShowGradePicker(false)}>
          <div className="card overlay__panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 900, fontSize: 'clamp(19px,3.4vw,26px)', textAlign: 'center', marginBottom: 10 }}>
              どの がくねんに チャレンジする？
            </div>
            <div className="grade-list">
              {GRADES.map((g) => {
                const locked = g.id > state.gradeMax
                const active = g.id === state.grade
                return (
                  <button
                    key={g.id}
                    className={
                      'grade-item' + (active ? ' grade-item--active' : '') + (locked ? ' grade-item--locked' : '')
                    }
                    onClick={() => pickGrade(g)}
                  >
                    <span style={{ fontSize: 26 }}>{locked ? '🔒' : g.emoji}</span>
                    <span>{g.short}</span>
                    {active && <span className="grade-item__now">いまここ</span>}
                  </button>
                )
              })}
            </div>
            <div className="muted" style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', marginTop: 10, lineHeight: 1.6 }}>
              マスターメーターを 100%にすると つぎの がくねんが あくよ！
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
