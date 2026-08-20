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
  missedCount,
  equippedWeapon,
  starTrialInfo
} from '../state/GameContext.jsx'
import { getPartner, partnerStage } from '../data/monsters.js'
import { currentPlanet, nextPlanet } from '../data/planets.js'
import { GRADES, gradeOf, MAX_GRADE } from '../data/grades.js'
import { buildOkawariTask, buildExtraTask, OKAWARI_MAX } from '../engine/missions.js'
import { basicBattlePlaysLeft, canBattleToday, dailyBattleUnlocked } from '../engine/battleTickets.js'
import { domainsForGrade, DOMAIN_BY_ID, domainName } from '../engine/activities.js'
import Monster from '../components/Monster.jsx'
import { Starfield, useSpeakOnMount } from '../components/common.jsx'
import { sfx } from '../engine/sfx.js'
import { speak } from '../engine/tts.js'
import { trialUnlocked } from '../engine/learningUnits.js'

const PARTNER_LINES = [
  'きょうも いっしょに がんばろう！',
  'つぎの ほしまで もうすこし！',
  'きみと たびが できて うれしいな',
  'まちがえても だいじょうぶ。それが ちからに なるんだ！',
  'バトルの とっくん しようよ！'
]

function StatPill({ emoji, value, suffix = '' }) {
  const valueText = String(value)
  const digits = Math.min(7, valueText.replace(/\D/g, '').length || valueText.length)

  return (
    <div className={`pill stat-pill stat-pill--digits-${digits}`}>
      <span className="stat-pill__emoji" aria-hidden="true">{emoji}</span>
      <span className="stat-pill__value">{valueText}{suffix}</span>
    </div>
  )
}

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
  const weapon = equippedWeapon(state)
  const testDone = !!state.testPassed?.[state.grade]?.passed
  const starTrial = starTrialInfo(state, state.grade)
  const trialGate = trialUnlocked(state, state.grade)

  const daily = state.daily
  const coreDone = daily.coreDone
  const coreLeft = daily.coreTasks.length - daily.coreIndex
  const okawariLeft = OKAWARI_MAX - daily.okawariIndex

  const battleUnlocked = dailyBattleUnlocked(daily)
  const battlePlaysLeft = basicBattlePlaysLeft(state.battle, daily)
  const battleTickets = state.battle.tickets
  const canBattle = canBattleToday(state.battle, daily)

  const [bubble, setBubble] = useState(null)
  const [showGradePicker, setShowGradePicker] = useState(false)
  const [showSubjectPicker, setShowSubjectPicker] = useState(false)

  const greeting = useMemo(() => {
    if (coreDone) return 'きょうの ミッション ぜんぶ クリア！ すごい！'
    if (daily.coreIndex === 0) return `まなぶと マナが うまれる。${planet.name}から しゅっぱつ！`
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

  // 「しゅっぱつ」→ 残っている教科から自分でえらぶ（順番だけ自由。全教科まわるのは変わらない）
  const openSubjectPicker = () => {
    sfx.tap()
    setShowSubjectPicker(true)
    speak('きょうは どの きょうかから やる？')
  }
  const startCoreAt = (index) => {
    sfx.swoosh()
    setShowSubjectPicker(false)
    if (index != null && index !== daily.coreIndex) {
      dispatch({ type: 'PICK_CORE_TASK', index })
      const task = daily.coreTasks[index]
      if (task) onStartTask({ ...task })
      return
    }
    const task = daily.coreTasks[daily.coreIndex]
    if (task) onStartTask(task)
  }
  const startOkawari = () => {
    sfx.swoosh()
    onStartTask(buildOkawariTask(daily.okawariIndex, state.grade))
  }
  const startExtra = () => {
    if (!battleUnlocked) {
      sfx.wrongSoft()
      speak('ついかもんだいは、きょうの ミッションを クリアしてから。クリアすると バトルが 3かい あそべるよ！')
      return
    }
    sfx.tap()
    speak('ついか もんだいに ちょうせん！ 3もん中 2もん できたら、バトルチケットが もらえるよ。同じ きょうかは、できるほど むずかしく なるよ！')
    onStartTask(buildExtraTask(daily.extraIndex, state.grade))
  }

  const pickGrade = (g) => {
    if (g.id > state.gradeMax) {
      sfx.wrongSoft()
      speak('つぎの がくねんは、いまの がくねんの しょうまつテストに ごうかくすると あくよ！')
      return
    }
    if (g.id < (state.settings.minSelectableGrade || 0)) {
      sfx.wrongSoft()
      speak('この がくねんは、ほごしゃの せっていで えらべないよ。')
      return
    }
    sfx.pop()
    dispatch({ type: 'SET_GRADE', grade: g.id })
    speak(`${g.name}の もんだいに きりかえたよ！`)
    setShowGradePicker(false)
  }

  const nodes = daily.coreTasks.length

  return (
    <div className="screen screen-in home-screen">
      <Starfield />

      <header className="topbar home-topbar">
        <div className="home-topbar__summary">
          <div className="home-topbar__row">
            <div className="pill home-pill--planet" title={planet.name}>
              {planet.emoji} {planet.name}
            </div>
            <button
              className="pill pill--tap home-pill--grade"
              onClick={() => {
                sfx.tap()
                setShowGradePicker(true)
              }}
            >
              {grade.emoji} {grade.short}
            </button>
          </div>
          <div className="home-topbar__row home-topbar__row--stats">
            {state.streak > 1 && <StatPill emoji="🔥" value={state.streak} suffix="にち" />}
            <StatPill emoji="✨" value={state.xp} />
            <StatPill emoji="✦" value={state.starShards || 0} />
          </div>
        </div>
        <button
          className="btn btn--ghost home-parent-button"
          onClick={() => {
            sfx.tap()
            onGo('parent')
          }}
          aria-label="おうちのひと"
        >
          👨‍👩‍👧
        </button>
      </header>

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
            <span>{grade.emoji} {grade.short} テストの じゅんび</span>
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
          <button className="btn btn--primary btn--big btn--glow" onClick={openSubjectPicker}>
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
              {nMissed > 0 ? `きょう ふくしゅう ${nMissed}こ` : `⚡ おぼえた数 ${state.conquered}`}
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
              {canBattle ? `あと ${battlePlaysLeft + battleTickets}かい` : battleUnlocked ? 'ついかもんだいで ふやせる！' : `ミッション あと ${coreLeft}つで 3かい！`}
            </span>
            {battleTickets > 0 && <span className="notice-badge">🎟{battleTickets}</span>}
          </button>

          <button
            className="menu-tile"
            style={{ background: 'linear-gradient(180deg,#ffb3c9,#ff7aa6)' }}
            onClick={startExtra}
          >
            <span className="menu-tile__emoji">🎟️</span>
            <span className="menu-tile__label">ついかもんだい</span>
            <span className="menu-tile__sub">{battleUnlocked ? '2/3せいかいで チケット' : 'ミッションの あとで！'}</span>
          </button>

          <button
            className="menu-tile"
            style={{ background: 'linear-gradient(180deg,#c2f0c2,#7fd17f)' }}
            onClick={() => {
              sfx.tap()
              onGo('freestudy')
            }}
          >
            <span className="menu-tile__emoji">📚</span>
            <span className="menu-tile__label">じゆうべんきょう</span>
            <span className="menu-tile__sub">すきな きょうかを えらぶ</span>
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
            <span className="menu-tile__label">なかま・そだてる</span>
            <span className="menu-tile__sub">チーム {state.party?.length || 1}/3・ゲージ {state.starGauge || 0}</span>
          </button>

          <button
            className="menu-tile"
            style={{ background: 'linear-gradient(180deg,#ffd7a1,#ffab4d)' }}
            onClick={() => {
              sfx.tap()
              if (!trialGate.unlocked) {
                speak(`ほしのしれんは、あと ${trialGate.missing.length}この たんげんを べつの日にも できたら ちょうせんできるよ`)
                return
              }
              speak(
                `${grade.name}の ほしのしれん。きょうは 6もん。2かいで 9こ できたら つぎの がくねんが あくよ！`
              )
              onGo('test')
            }}
          >
            <span className="menu-tile__emoji">🌟</span>
            <span className="menu-tile__label">ほしのしれん</span>
            <span className="menu-tile__sub">
              {testDone
                ? `クリアずみ（${Math.round((state.testPassed[state.grade]?.rate || 0) * 100)}%）`
                : !trialGate.unlocked
                  ? `あと ${trialGate.missing.length}たんげん とっくん`
                  : starTrial.todayDone
                  ? 'つづきは あした'
                  : starTrial.rounds.length === 1
                    ? `あと 1かい（いま ${starTrial.correct} / 6こ）`
                    : `2かいで 9こ できたら クリア`}
            </span>
            {!testDone && trialGate.unlocked && <span className="notice-badge">!</span>}
          </button>

          <button
            className="menu-tile"
            style={{ background: 'linear-gradient(180deg,#d5c4a1,#b89b6e)' }}
            onClick={() => {
              sfx.tap()
              onGo('equip')
            }}
          >
            <span className="menu-tile__emoji">{weapon ? weapon.emoji : '⚔️'}</span>
            <span className="menu-tile__label">そうび</span>
            <span className="menu-tile__sub">
              {weapon ? `${weapon.name}（そうび中）` : 'まなぶと 宝箱が ひらく'}
            </span>
          </button>
        </div>
      </div>

      {/* きょうの教科えらび（順番だけ自由。全教科まわるのは変わらない） */}
      {showSubjectPicker && (
        <div className="overlay" onClick={() => setShowSubjectPicker(false)}>
          <div className="card overlay__panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 900, fontSize: 'clamp(19px,3.4vw,26px)', textAlign: 'center', marginBottom: 4 }}>
              どの きょうかから やる？
            </div>
            <div className="muted" style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>
              きょうは ぜんぶの きょうかを やるよ。じゅんばんは きみが きめてOK！
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))',
                gap: 10
              }}
            >
              {daily.coreTasks.map((t, i) => {
                const dom = DOMAIN_BY_ID[t.domainId]
                const done = i < daily.coreIndex
                return (
                  <button
                    key={t.uid}
                    className="card"
                    disabled={done}
                    onClick={() => startCoreAt(i)}
                    style={{
                      textAlign: 'center',
                      cursor: done ? 'default' : 'pointer',
                      padding: '12px 6px',
                      opacity: done ? 0.4 : 1,
                      border: done ? '2px solid rgba(255,255,255,0.12)' : '3px solid var(--accent)'
                    }}
                  >
                    <div style={{ fontSize: 34 }}>{done ? '✅' : dom?.emoji}</div>
                    <div style={{ fontWeight: 900, fontSize: 'clamp(13px,2.4vw,17px)' }}>
                      {domainName(dom, state.grade)}
                    </div>
                    <div className="muted" style={{ fontSize: 11, fontWeight: 800 }}>
                      {done ? 'おわった' : 'やる'}
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="row wrap" style={{ justifyContent: 'center', marginTop: 14, gap: 10 }}>
              <button className="btn btn--primary" onClick={() => startCoreAt(null)}>
                🎲 おまかせで はじめる
              </button>
              <button className="btn btn--ghost" onClick={() => setShowSubjectPicker(false)}>
                やめる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 学年えらび */}
      {showGradePicker && (
        <div className="overlay" onClick={() => setShowGradePicker(false)}>
          <div className="card overlay__panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 900, fontSize: 'clamp(19px,3.4vw,26px)', textAlign: 'center', marginBottom: 10 }}>
              どの がくねんに チャレンジする？
            </div>
            <div className="grade-list">
              {GRADES.map((g) => {
                const notYetUnlocked = g.id > state.gradeMax
                // 保護者が下限を設定していて、まだ届かない学年（未解放とは別理由の制限）。
                const blockedByParent = !notYetUnlocked && g.id < (state.settings.minSelectableGrade || 0)
                const locked = notYetUnlocked || blockedByParent
                const active = g.id === state.grade
                return (
                  <button
                    key={g.id}
                    className={
                      'grade-item' + (active ? ' grade-item--active' : '') + (locked ? ' grade-item--locked' : '')
                    }
                    onClick={() => pickGrade(g)}
                  >
                    <span style={{ fontSize: 26 }}>{blockedByParent ? '🚫' : locked ? '🔒' : g.emoji}</span>
                    <span>{g.short}</span>
                    {active && <span className="grade-item__now">いまここ</span>}
                  </button>
                )
              })}
            </div>
            <div className="muted" style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', marginTop: 10, lineHeight: 1.6 }}>
              しょうまつテストに ごうかく（80てん いじょう）すると、つぎの がくねんが あくよ！
              {state.settings.minSelectableGrade > 0 && (
                <>
                  <br />
                  🚫は ほごしゃが えらべないように しているよ。
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
