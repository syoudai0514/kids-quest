// ============================================================
// 息抜きバトル（ご褒美の目玉）
//
//  - 属性の三すくみ（🔥→🌿→💧→🔥、⭐は安定）で「考えて選ぶ」楽しさ
//  - 相手の属性は常に表示。効果は表示＋音声（ばつぐん！/いまひとつ）
//  - 勝つと「ほしのわ」で捕まえて なかまに（未捕獲を優先して出現）
//  - 1日の基本プレイ上限 + 追加問題で得た解放チケット
//  - 負けても否定しない（「また あそぼう！」）
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useGame, partnerLevel, PARTNER_COLORS } from '../state/GameContext.jsx'
import { getPartner, partnerStage, getWildMonsters } from '../data/monsters.js'
import {
  TYPES,
  typeOfElement,
  PARTNER_MOVES,
  rollDamage,
  effectLabel,
  enemyMaxHp,
  partnerMaxHp,
  enemyDamage
} from '../engine/battle.js'
import Monster from '../components/Monster.jsx'
import { Starfield, Confetti } from '../components/common.jsx'
import { speak } from '../engine/tts.js'
import { sfx } from '../engine/sfx.js'

export default function BattleScreen({ onBack }) {
  const { state, dispatch } = useGame()
  const partner = getPartner()
  const stage = partnerStage(partner, state.totalClears)
  const level = partnerLevel(state.xp)

  const pColor = PARTNER_COLORS[state.partnerColor]
  const colors =
    pColor && state.partnerColor !== 'mint'
      ? { ...stage.colors, body: pColor.body, belly: pColor.belly }
      : stage.colors

  const playsLeft = Math.max(0, state.battle.dailyLimit - state.battle.playsUsed)
  const canPlay = playsLeft > 0 || state.battle.tickets > 0

  const [round, setRound] = useState(0) // もう一回 のたびに敵を引き直す
  const enemy = useMemo(() => {
    const wilds = getWildMonsters()
    const caught = new Set(state.unlockedMonsters)
    const fresh = wilds.filter((w) => !caught.has(w.id))
    const pool = fresh.length ? fresh : wilds
    return pool[Math.floor(Math.random() * pool.length)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])
  const enemyType = typeOfElement(enemy.element)

  const E_MAX = enemyMaxHp(state.totalClears)
  const P_MAX = partnerMaxHp(level)

  const [mode, setMode] = useState(canPlay ? 'intro' : 'locked')
  const [pHp, setPHp] = useState(P_MAX)
  const [eHp, setEHp] = useState(E_MAX)
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState('')
  const [shake, setShake] = useState(null)
  const [dmgFloat, setDmgFloat] = useState(null) // {side, text}
  const startedRef = useRef(false)
  const wasNewCatchRef = useRef(false)

  useEffect(() => {
    if (mode === 'locked') {
      speak(
        'いきぬきバトルの きょうの ぶんは おしまい。ついか もんだいを とくと チケットが もらえて、もっと あそべるよ！'
      )
    } else if (mode === 'intro') {
      speak(`やせいの ${enemy.name}が あらわれた！ ${TYPES[enemyType].name}タイプだ！`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, round])

  const startBattle = () => {
    if (startedRef.current) return
    startedRef.current = true
    dispatch({ type: 'CONSUME_BATTLE_PLAY' })
    sfx.swoosh()
    setMode('fight')
    setLog('どの わざで たたかう？')
    speak(`あいては ${TYPES[enemyType].name}タイプ。どの わざが きくかな？`)
  }

  const showDmg = (side, text) => {
    setDmgFloat({ side, text })
    setTimeout(() => setDmgFloat(null), 900)
  }

  const enemyTurn = () => {
    const dmg = enemyDamage()
    setShake('partner')
    sfx.hit()
    showDmg('partner', `-${dmg}`)
    setTimeout(() => setShake(null), 350)
    setPHp((hp) => {
      const next = Math.max(0, hp - dmg)
      if (next <= 0) {
        setTimeout(() => {
          setMode('lose')
          sfx.wrongSoft()
          speak('うーん ざんねん！ でも だいじょうぶ、また あそぼう！ つよく なって リベンジだ！')
        }, 500)
      } else {
        setLog(`${enemy.name}の こうげき！ つぎの わざは？`)
        setBusy(false)
      }
      return next
    })
  }

  const useMove = (move) => {
    if (busy || mode !== 'fight') return
    setBusy(true)
    const { dmg, mult } = rollDamage(move, enemyType)
    const eff = effectLabel(mult)
    setShake('enemy')
    if (mult > 1) sfx.hitBig()
    else sfx.hit()
    showDmg('enemy', `-${dmg}${mult > 1 ? '❗' : ''}`)
    setLog(`${stage.name}の ${move.name}！${eff ? ` ${eff}` : ''}`)
    speak(`${move.name}！${eff ? ` ${eff}` : ''}`)
    setTimeout(() => setShake(null), 350)

    setEHp((hp) => {
      const next = Math.max(0, hp - dmg)
      if (next <= 0) {
        setTimeout(() => beginCatch(), 600)
      } else {
        setTimeout(() => enemyTurn(), 900)
      }
      return next
    })
  }

  // 勝利 → ほしのわ で捕まえる演出
  const beginCatch = () => {
    const alreadyCaught = state.unlockedMonsters.includes(enemy.id)
    wasNewCatchRef.current = !alreadyCaught
    if (alreadyCaught) {
      dispatch({ type: 'BATTLE_WON', caughtId: null })
      setMode('win')
      sfx.reward()
      speak(`やった！ ${enemy.name}に かった！ つよいね！`)
      return
    }
    setMode('catch')
    sfx.swoosh()
    speak(`ほしのわを なげた！`)
    setTimeout(() => {
      dispatch({ type: 'BATTLE_WON', caughtId: enemy.id })
      setMode('win')
      sfx.fanfare()
      speak(`やったー！ ${enemy.name}を つかまえた！ なかまが ふえたよ！`)
    }, 1500)
  }

  const playAgain = () => {
    startedRef.current = false
    wasNewCatchRef.current = false
    setBusy(false)
    setRound((r) => r + 1)
    setMode('intro')
  }

  // 再戦時に HP をリセット（round が変わったとき）
  useEffect(() => {
    setPHp(P_MAX)
    setEHp(E_MAX)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  // ---- ロック画面 ----
  if (mode === 'locked') {
    return (
      <div className="screen fade-in">
        <Starfield />
        <div className="topbar">
          <button className="btn btn--ghost" style={{ minHeight: 60 }} onClick={onBack}>
            🏠 もどる
          </button>
          <div className="pill">⚔️ いきぬきバトル</div>
          <div style={{ width: 60 }} />
        </div>
        <div className="center-col">
          <div style={{ fontSize: 90 }}>😴</div>
          <div className="card" style={{ textAlign: 'center', width: 'min(560px,92vw)' }}>
            <div style={{ fontSize: 'clamp(20px,4vw,30px)', fontWeight: 900, marginBottom: 12 }}>
              きょうの バトルは おやすみ
            </div>
            <div style={{ fontSize: 'clamp(15px,2.8vw,20px)', lineHeight: 1.6 }}>
              「ついか もんだい」を クリアすると、
              <br />
              バトルチケット 🎟️ が もらえて もっと あそべるよ！
            </div>
          </div>
          <button className="btn btn--sun btn--big" onClick={onBack}>
            ついか もんだいに いく
          </button>
        </div>
      </div>
    )
  }

  // ---- 勝敗画面 ----
  if (mode === 'win' || mode === 'lose') {
    const win = mode === 'win'
    return (
      <div className="screen fade-in">
        <Starfield />
        {win && <Confetti pieces={45} />}
        <div className="center-col">
          <div style={{ fontSize: 'clamp(38px,9vw,80px)', fontWeight: 900 }}>
            {win ? (wasNewCatchRef.current ? '🌟 つかまえた！' : '🏆 かち！') : '💪 また あそぼう！'}
          </div>
          <Monster monster={win ? enemy : partner} colorsOverride={win ? null : colors} size={150} />
          <div className="card" style={{ textAlign: 'center', width: 'min(520px,92vw)' }}>
            <div style={{ fontSize: 'clamp(17px,3.2vw,22px)', fontWeight: 800 }}>
              {win
                ? wasNewCatchRef.current
                  ? `${enemy.name}が なかまに なった！（ずかん ${state.unlockedMonsters.length}/100）`
                  : `${enemy.name}に かった！ ✨+12`
                : 'つぎは きっと かてるよ！'}
            </div>
          </div>
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            {canPlay && (
              <button className="btn btn--primary btn--big" onClick={playAgain}>
                もういっかい
              </button>
            )}
            <button className="btn btn--ghost btn--big" onClick={onBack}>
              🏠 ホームへ
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---- イントロ / 戦闘 / 捕獲 ----
  return (
    <div className="screen fade-in">
      <Starfield count={14} />
      <div className="topbar">
        <button className="btn btn--ghost" style={{ minHeight: 60 }} onClick={onBack}>
          🏠
        </button>
        <div className="pill">⚔️ バトル</div>
        <div className="pill">のこり {playsLeft + state.battle.tickets}</div>
      </div>

      <div className="center-col" style={{ justifyContent: 'space-between', paddingTop: 4 }}>
        {/* 敵 */}
        <div style={{ alignSelf: 'flex-end', textAlign: 'center', marginRight: '5vw', position: 'relative' }}>
          <div className="row" style={{ justifyContent: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 900 }}>{enemy.name}</span>
            <span className="type-chip">
              {TYPES[enemyType].emoji} {TYPES[enemyType].name}
            </span>
          </div>
          <div className="hp-bar" style={{ width: 200, margin: '0 auto 6px' }}>
            <div
              className="hp-bar__fill"
              style={{ width: `${(eHp / E_MAX) * 100}%`, background: 'var(--bad-soft)' }}
            />
          </div>
          <div style={{ position: 'relative', animation: shake === 'enemy' ? 'nudge 0.35s ease' : 'none' }}>
            {dmgFloat?.side === 'enemy' && <div className="dmg-float">{dmgFloat.text}</div>}
            {mode === 'catch' && <div className="ring-throw" />}
            <Monster monster={enemy} size={125} bounce={mode === 'intro'} />
          </div>
        </div>

        {/* 相棒 */}
        <div style={{ alignSelf: 'flex-start', textAlign: 'center', marginLeft: '5vw', position: 'relative' }}>
          <div style={{ position: 'relative', animation: shake === 'partner' ? 'nudge 0.35s ease' : 'none' }}>
            {dmgFloat?.side === 'partner' && <div className="dmg-float">{dmgFloat.text}</div>}
            <Monster monster={partner} colorsOverride={colors} size={135} bounce={mode === 'intro'} />
          </div>
          <div style={{ fontWeight: 900, margin: '2px 0' }}>
            {stage.name} <span className="type-chip">Lv.{level}</span>
          </div>
          <div className="hp-bar" style={{ width: 200, margin: '0 auto' }}>
            <div
              className="hp-bar__fill"
              style={{ width: `${(pHp / P_MAX) * 100}%`, background: 'var(--accent)' }}
            />
          </div>
        </div>

        {/* 操作 */}
        {mode === 'intro' ? (
          <button className="btn btn--pink btn--big" onClick={startBattle} style={{ marginTop: 6 }}>
            ⚔️ バトル スタート！
          </button>
        ) : mode === 'catch' ? (
          <div className="pill" style={{ fontSize: 'clamp(17px,3vw,22px)' }}>🌀 ほしのわを なげた…！</div>
        ) : (
          <div style={{ width: 'min(760px,96vw)' }}>
            <div
              className="muted"
              style={{ textAlign: 'center', fontWeight: 800, marginBottom: 8, minHeight: 24 }}
            >
              {log}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
                gap: 10
              }}
            >
              {PARTNER_MOVES.map((m) => (
                <button key={m.name} className="move-btn" disabled={busy} onClick={() => useMove(m)}>
                  <span className="move-btn__emoji">{m.emoji}</span>
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
