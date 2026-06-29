// ============================================================
// 息抜きバトル（ご褒美の目玉）
//  - オリジナルモンスター同士の、やさしいターン制バトル。
//  - 1日の基本プレイ上限あり（state.battle.dailyLimit）。
//  - 上限を超えたら「ついか問題」で得た解放チケットで遊べる。
//  - 勝つと野生モンスターが なかまに（収集が増える）。
//  - 負けても否定せず「また あそぼう」。
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../state/GameContext.jsx'
import { getPartner, partnerStage, getWildMonsters } from '../data/monsters.js'
import Monster from '../components/Monster.jsx'
import { Starfield, Confetti } from '../components/common.jsx'
import { speak } from '../engine/tts.js'
import { sfx } from '../engine/sfx.js'

const MOVES = [
  { name: 'ほしビーム', emoji: '✨', min: 16, max: 26 },
  { name: 'コメットアタック', emoji: '☄️', min: 10, max: 34 },
  { name: 'ガードはんげき', emoji: '🛡️', min: 8, max: 16, heal: 8 }
]

function rng(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1))
}

export default function BattleScreen({ onBack }) {
  const { state, dispatch } = useGame()
  const partner = getPartner()
  const stage = partnerStage(partner, state.totalClears)

  const playsLeft = Math.max(0, state.battle.dailyLimit - state.battle.playsUsed)
  const canPlay = playsLeft > 0 || state.battle.tickets > 0

  const enemy = useMemo(() => {
    const wilds = getWildMonsters()
    return wilds[Math.floor(Math.random() * wilds.length)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ENEMY_MAX = 52
  const PARTNER_MAX = 64

  const [mode, setMode] = useState(canPlay ? 'intro' : 'locked')
  const [pHp, setPHp] = useState(PARTNER_MAX)
  const [eHp, setEHp] = useState(ENEMY_MAX)
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState('')
  const [shake, setShake] = useState(null) // 'enemy' | 'partner' | null
  const startedRef = useRef(false)

  useEffect(() => {
    if (mode === 'locked') {
      speak('いきぬきバトルの きょうの ぶんは おしまい。ついか もんだいを とくと チケットが もらえて、もっと あそべるよ！')
    } else if (mode === 'intro') {
      speak(`やせいの ${enemy.name}が あらわれた！ バトル スタート！`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const startBattle = () => {
    if (startedRef.current) return
    startedRef.current = true
    dispatch({ type: 'CONSUME_BATTLE_PLAY' })
    sfx.tap()
    setMode('fight')
    setLog('どの わざを つかう？')
    speak('どの わざで たたかう？')
  }

  const enemyTurn = (currentEHp) => {
    const dmg = rng(6, 13)
    setShake('partner')
    sfx.hit()
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
        setLog(`${enemy.name}の こうげき！ どの わざで たたかう？`)
        speak(`${enemy.name}の こうげき！`)
        setBusy(false)
      }
      return next
    })
  }

  const useMove = (move) => {
    if (busy || mode !== 'fight') return
    setBusy(true)
    const dmg = rng(move.min, move.max)
    setShake('enemy')
    sfx.hit()
    if (move.heal) {
      setPHp((hp) => Math.min(PARTNER_MAX, hp + move.heal))
    }
    setLog(`${stage.name}の ${move.name}！`)
    speak(`${move.name}！`)
    setTimeout(() => setShake(null), 350)

    setEHp((hp) => {
      const next = Math.max(0, hp - dmg)
      if (next <= 0) {
        setTimeout(() => winBattle(), 550)
      } else {
        setTimeout(() => enemyTurn(next), 800)
      }
      return next
    })
  }

  const winBattle = () => {
    const alreadyCaught = state.battle.caught.includes(enemy.id) || state.unlockedMonsters.includes(enemy.id)
    const caughtId = alreadyCaught ? null : enemy.id
    dispatch({ type: 'BATTLE_WON', caughtId })
    sfx.reward()
    setMode('win')
    if (caughtId) {
      speak(`やった！ ${enemy.name}に かった！ ${enemy.name}が なかまに なったよ！`)
    } else {
      speak(`やった！ ${enemy.name}に かった！ つよいね！`)
    }
  }

  // ---- ロック画面（今日の上限。チケットで解放を促す） ----
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
          <div style={{ fontSize: 'clamp(40px,10vw,90px)', fontWeight: 900 }}>
            {win ? '🏆 かち！' : '💪 また あそぼう！'}
          </div>
          <Monster monster={win ? enemy : partner} colorsOverride={win ? null : stage.colors} size={150} />
          <div className="card" style={{ textAlign: 'center', width: 'min(520px,92vw)' }}>
            {win ? (
              <div style={{ fontSize: 'clamp(17px,3.2vw,22px)', fontWeight: 800 }}>
                {state.unlockedMonsters.includes(enemy.id)
                  ? `${enemy.name}に かった！`
                  : `${enemy.name}が なかまに なったよ！`}
              </div>
            ) : (
              <div style={{ fontSize: 'clamp(17px,3.2vw,22px)', fontWeight: 800 }}>
                つぎは きっと かてるよ！
              </div>
            )}
          </div>
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            {canPlay && (
              <button
                className="btn btn--primary btn--big"
                onClick={() => {
                  // もう一回（権利を消費して再戦）
                  startedRef.current = false
                  setPHp(PARTNER_MAX)
                  setEHp(ENEMY_MAX)
                  setBusy(false)
                  setMode('intro')
                }}
              >
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

  // ---- イントロ / 戦闘 ----
  return (
    <div className="screen fade-in">
      <Starfield count={16} />
      <div className="topbar">
        <button className="btn btn--ghost" style={{ minHeight: 60 }} onClick={onBack}>
          🏠
        </button>
        <div className="pill">⚔️ バトル</div>
        <div className="pill">のこり {playsLeft + state.battle.tickets}</div>
      </div>

      {/* 対戦フィールド */}
      <div className="center-col" style={{ justifyContent: 'space-between', paddingTop: 6 }}>
        {/* 敵 */}
        <div style={{ alignSelf: 'flex-end', textAlign: 'center', marginRight: '6vw' }}>
          <div className="hp-bar" style={{ width: 200, marginBottom: 6 }}>
            <div
              className="hp-bar__fill"
              style={{ width: `${(eHp / ENEMY_MAX) * 100}%`, background: 'var(--bad-soft)' }}
            />
          </div>
          <div style={{ fontWeight: 800, marginBottom: 4 }}>{enemy.name}</div>
          <div style={{ animation: shake === 'enemy' ? 'nudge 0.35s ease' : 'none' }}>
            <Monster monster={enemy} size={130} bounce={mode === 'intro'} />
          </div>
        </div>

        {/* 相棒 */}
        <div style={{ alignSelf: 'flex-start', textAlign: 'center', marginLeft: '6vw' }}>
          <div style={{ animation: shake === 'partner' ? 'nudge 0.35s ease' : 'none' }}>
            <Monster monster={partner} colorsOverride={stage.colors} size={140} bounce={mode === 'intro'} />
          </div>
          <div style={{ fontWeight: 800, margin: '4px 0' }}>{stage.name}</div>
          <div className="hp-bar" style={{ width: 200 }}>
            <div
              className="hp-bar__fill"
              style={{ width: `${(pHp / PARTNER_MAX) * 100}%`, background: 'var(--accent)' }}
            />
          </div>
        </div>

        {/* 操作 */}
        {mode === 'intro' ? (
          <button className="btn btn--pink btn--big" onClick={startBattle} style={{ marginTop: 8 }}>
            ⚔️ バトル スタート！
          </button>
        ) : (
          <div style={{ width: 'min(820px,96vw)' }}>
            <div
              className="muted"
              style={{ textAlign: 'center', fontWeight: 800, marginBottom: 8, minHeight: 24 }}
            >
              {log}
            </div>
            <div className="choice-grid choice-grid--3">
              {MOVES.map((m) => (
                <button
                  key={m.name}
                  className="btn btn--sun"
                  style={{ flexDirection: 'column', minHeight: 96 }}
                  disabled={busy}
                  onClick={() => useMove(m)}
                >
                  <span style={{ fontSize: 34 }}>{m.emoji}</span>
                  <span style={{ fontSize: 'clamp(15px,2.6vw,20px)' }}>{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
