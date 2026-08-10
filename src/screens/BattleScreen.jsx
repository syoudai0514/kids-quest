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
import { useGame, partnerLevel, PARTNER_COLORS, equippedWeapon } from '../state/GameContext.jsx'
import { getPartner, partnerStage, getWildMonsters, MONSTERS } from '../data/monsters.js'
import { rollScheduledWeaponReward, RARITIES } from '../data/weapons.js'
import {
  TYPES,
  typeOfElement,
  PARTNER_MOVES,
  rollDamage,
  effectiveness,
  effectLabel,
  enemyLevelFor,
  ELITE_MIN_LEVEL,
  enemyMaxHp,
  partnerMaxHp,
  enemyDamage,
  battleAttackBonus,
  battleHpBonus
} from '../engine/battle.js'
import Monster from '../components/Monster.jsx'
import { AppHeader, Starfield, Confetti } from '../components/common.jsx'
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

  const ELITE_CHANCE = 0.15 // 強敵は「ときどき」。通常戦の成功体験を中心にする。

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

  // 敵の強さは相棒のレベルに追従（±1）。ときどき「つよい てき」が出現し、
  // 属性を正しく選ばないと本当に負けることがある本気の相手になる。
  const isElite = useMemo(
    () => level >= ELITE_MIN_LEVEL && Math.random() < ELITE_CHANCE,
    [round, level]
  )
  const enemyLv = useMemo(() => enemyLevelFor(level, isElite), [round, level, isElite])

  const weapon = equippedWeapon(state)
  const isTutorialBattle = (state.rewardProgress?.battleTutorialsSeen || 0) < 5
  const E_MAX = enemyMaxHp(enemyLv, isElite)
  const P_MAX = partnerMaxHp(level, weapon)

  const [mode, setMode] = useState(canPlay ? 'intro' : 'locked')
  const [pHp, setPHp] = useState(P_MAX)
  const [eHp, setEHp] = useState(E_MAX)
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState('')
  const [shake, setShake] = useState(null)
  const [dmgFloat, setDmgFloat] = useState(null) // {side, text}
  const [pose, setPose] = useState({ partner: 'idle', enemy: 'idle' })
  const startedRef = useRef(false)
  const wasNewCatchRef = useRef(false)
  const dropRef = useRef(null) // このバトルで手に入れた そうび
  const [compactBattle, setCompactBattle] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(orientation: portrait)').matches
  )

  useEffect(() => {
    const update = () => setCompactBattle(window.matchMedia('(orientation: portrait)').matches)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    if (mode === 'locked') {
      speak(
        'いきぬきバトルの きょうの ぶんは おしまい。ついか もんだいを とくと チケットが もらえて、もっと あそべるよ！'
      )
    } else if (mode === 'intro') {
      speak(
        isElite
          ? `つよい ${enemy.name}が あらわれた！ Lv.${enemyLv}の ${TYPES[enemyType].name}タイプだ。ゆだんするな！`
          : `やせいの ${enemy.name}が あらわれた！ Lv.${enemyLv}の ${TYPES[enemyType].name}タイプだ！`
      )
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
    const bestMove = PARTNER_MOVES.find((move) => effectiveness(move.type, enemyType) > 1)
    speak(
      isTutorialBattle && bestMove
        ? `あいては ${TYPES[enemyType].name}タイプ。${bestMove.name}の みどりの やじるしを おしてみよう！`
        : `あいては ${TYPES[enemyType].name}タイプ。どの わざが きくかな？`
    )
  }

  const showDmg = (side, text) => {
    setDmgFloat({ side, text })
    setTimeout(() => setDmgFloat(null), 900)
  }

  const enemyTurn = () => {
    const dmg = enemyDamage(enemyLv, isElite)
    setShake('partner')
    setPose({ partner: 'hurt', enemy: 'attack' })
    sfx.hit()
    showDmg('partner', `-${dmg}`)
    setTimeout(() => { setShake(null); setPose({ partner: 'idle', enemy: 'idle' }) }, 420)
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
    const { dmg, mult, crit } = rollDamage(move, enemyType, level, weapon)
    const eff = effectLabel(mult)
    setShake('enemy')
    setPose({ partner: 'attack', enemy: 'hurt' })
    if (mult > 1 || crit) sfx.hitBig()
    else sfx.hit()
    showDmg('enemy', `-${dmg}${crit ? '💥' : mult > 1 ? '❗' : ''}`)
    const critTxt = crit ? ' かいしんの いちげき！' : ''
    setLog(`${stage.name}の ${move.name}！${eff ? ` ${eff}` : ''}${critTxt}`)
    speak(`${move.name}！${eff ? ` ${eff}` : ''}${critTxt}`)
    setTimeout(() => { setShake(null); setPose({ partner: 'idle', enemy: 'idle' }) }, 420)

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

  // 勝利 → ほしのわ で捕まえる演出（つよい てき に勝つと ボーナス✨＋武器ドロップ）
  const beginCatch = () => {
    const alreadyCaught = state.unlockedMonsters.includes(enemy.id)
    wasNewCatchRef.current = !alreadyCaught

    // 武器は勝利の運ではなく、学習を続けた活動日で開く宝箱から渡す。
    // これにより「バトルだけを何度も回す」より、明日の学習を楽しみにできる。
    const drop = rollScheduledWeaponReward({
      activityDays: state.rewardProgress?.activityDays?.length || 0,
      ownedIds: state.weapons || [],
      eliteWins: state.rewardProgress?.eliteWins || 0,
      chapterPassed: Object.values(state.testPassed || {}).some((result) => result?.passed)
    })
    const upgraded = drop && (!weapon || drop.atk * 2 + drop.hp > weapon.atk * 2 + weapon.hp)
    dropRef.current = drop ? { ...drop, upgraded } : null

    const dropLine = drop
      ? ` 宝箱から ${drop.name}を てにいれた！${upgraded ? ' そうび したよ！' : ''}`
      : ''

    if (alreadyCaught) {
      dispatch({ type: 'BATTLE_WON', caughtId: null, elite: isElite, weaponId: drop?.id })
      setMode('win')
      sfx.reward()
      speak(
        (isElite ? `やった！ つよい ${enemy.name}に かった！ すごいぞ！` : `やった！ ${enemy.name}に かった！ つよいね！`) +
          dropLine
      )
      return
    }
    setMode('catch')
    sfx.swoosh()
    speak(`ほしのわを なげた！`)
    setTimeout(() => {
      dispatch({ type: 'BATTLE_WON', caughtId: enemy.id, elite: isElite, weaponId: drop?.id })
      setPose({ partner: 'win', enemy: 'idle' })
      setMode('win')
      sfx.fanfare()
      speak(`やったー！ ${enemy.name}を つかまえた！ なかまが ふえたよ！` + dropLine)
    }, 1500)
  }

  const playAgain = () => {
    startedRef.current = false
    wasNewCatchRef.current = false
    dropRef.current = null
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
        <AppHeader onBack={onBack} title="⚔️ いきぬきバトル" right={<span />} />
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
          {win && isElite && (
            <div className="type-chip" style={{ background: 'rgba(255,180,60,0.35)' }}>
              👑 つよい てきに かった！
            </div>
          )}
          <Monster monster={win ? enemy : partner} colorsOverride={win ? null : colors} size={150} />
          <div className="card" style={{ textAlign: 'center', width: 'min(520px,92vw)' }}>
            <div style={{ fontSize: 'clamp(17px,3.2vw,22px)', fontWeight: 800 }}>
              {win
                ? wasNewCatchRef.current
                  ? `${enemy.name}が なかまに なった！（ずかん ${state.unlockedMonsters.length}/${MONSTERS.length}）`
                  : `${enemy.name}に かった！ ✦+${isElite ? 12 : 6}`
                : `つぎは きっと かてるよ！（Lv.${enemyLv}${isElite ? ' ・ つよい てきだった' : ''}）`}
            </div>
          </div>

          {/* 手に入れた そうび */}
          {win && dropRef.current && (
            <div
              className="card"
              style={{
                textAlign: 'center',
                width: 'min(520px,92vw)',
                border: `3px solid ${RARITIES[dropRef.current.rarity].color}`,
                boxShadow: `0 0 22px ${RARITIES[dropRef.current.rarity].glow}`
              }}
            >
              <div style={{ fontWeight: 900, color: RARITIES[dropRef.current.rarity].color, fontSize: 13 }}>
                🎁 宝箱から {RARITIES[dropRef.current.rarity].name} そうび を てにいれた！
              </div>
              <div style={{ fontSize: 46, lineHeight: 1.2 }}>{dropRef.current.emoji}</div>
              <div style={{ fontWeight: 900, fontSize: 'clamp(16px,3vw,21px)' }}>
                {dropRef.current.name}
              </div>
              <div className="row" style={{ justifyContent: 'center', gap: 12, fontWeight: 900, marginTop: 4 }}>
                <span style={{ color: 'var(--accent-2)' }}>⚔️ +{battleAttackBonus(dropRef.current)}</span>
                <span style={{ color: 'var(--accent)' }}>❤️ +{battleHpBonus(dropRef.current)}</span>
              </div>
              {dropRef.current.upgraded && (
                <div className="pill" style={{ marginTop: 6, background: 'var(--good)', color: '#10231c', border: 'none' }}>
                  ✅ つよいので そうび したよ！
                </div>
              )}
            </div>
          )}
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            {canPlay && (
              <button className="btn btn--primary btn--big" onClick={playAgain}>
                もういっかい
              </button>
            )}
            <button className="btn btn--ghost btn--big" onClick={onBack}>
              🏠 もどる
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---- イントロ / 戦闘 / 捕獲 ----
  return (
    <div className="screen fade-in battle-screen">
      <Starfield count={14} />
      <AppHeader
        className="battle-header"
        onBack={onBack}
        title="⚔️ バトル"
        right={<div className="pill">のこり {playsLeft + state.battle.tickets}</div>}
      />

      <div className="center-col battle-arena" style={{ justifyContent: 'space-between', paddingTop: 4 }}>
        {/* 敵 */}
          <div className="battle-fighter battle-fighter--enemy" style={{ alignSelf: 'flex-end', textAlign: 'center', marginRight: '5vw', position: 'relative' }}>
          <div className="row" style={{ justifyContent: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 900 }}>
              {isElite && '👑 '}
              {enemy.name}
            </span>
            <span className="type-chip">Lv.{enemyLv}</span>
            <span className="type-chip">
              {TYPES[enemyType].emoji} {TYPES[enemyType].name}
            </span>
          </div>
          <div className="hp-bar" style={{ width: 200, margin: '0 auto 6px' }}>
            <div
              className="hp-bar__fill"
              style={{ width: `${(eHp / E_MAX) * 100}%`, background: isElite ? '#ffb43c' : 'var(--bad-soft)' }}
            />
          </div>
          <div
            style={{
              position: 'relative',
              animation: shake === 'enemy' ? 'nudge 0.35s ease' : 'none',
              filter: isElite ? 'drop-shadow(0 0 14px rgba(255,180,60,0.75))' : 'none'
            }}
          >
            {dmgFloat?.side === 'enemy' && <div className="dmg-float">{dmgFloat.text}</div>}
            {mode === 'catch' && <div className="ring-throw" />}
            <Monster monster={enemy} size={compactBattle ? 108 : 158} bounce={mode === 'intro'} pose={pose.enemy} />
          </div>
        </div>

        {/* 相棒 */}
        <div className="battle-fighter battle-fighter--partner" style={{ alignSelf: 'flex-start', textAlign: 'center', marginLeft: '5vw', position: 'relative' }}>
          <div style={{ position: 'relative', animation: shake === 'partner' ? 'nudge 0.35s ease' : 'none' }}>
            {dmgFloat?.side === 'partner' && <div className="dmg-float">{dmgFloat.text}</div>}
            <Monster monster={partner} colorsOverride={colors} size={compactBattle ? 112 : 170} bounce={mode === 'intro'} pose={pose.partner} />
          </div>
          <div style={{ fontWeight: 900, margin: '2px 0' }}>
            {stage.name} <span className="type-chip">Lv.{level}</span>
            {weapon && (
              <span className="type-chip" style={{ marginLeft: 4 }}>
                {weapon.emoji} ⚔️+{battleAttackBonus(weapon)}
              </span>
            )}
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
            {isTutorialBattle && (
              <div className="battle-guide">
                {TYPES[enemyType].emoji} {TYPES[enemyType].name}には、みどりの「ばつぐん！」を えらぼう！
              </div>
            )}
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
              {PARTNER_MOVES.map((m) => {
                const mult = effectiveness(m.type, enemyType)
                const isStrong = mult > 1
                const isWeak = mult < 1
                return (
                <button
                  key={m.name}
                  className={'move-btn' + (isTutorialBattle && isStrong ? ' move-btn--strong' : '')}
                  disabled={busy}
                  onClick={() => useMove(m)}
                >
                  <span className="move-btn__emoji">{m.emoji}</span>
                  <span className="move-btn__name">{m.name}</span>
                  {isTutorialBattle && (
                    <small className={isStrong ? 'move-btn__hint move-btn__hint--strong' : isWeak ? 'move-btn__hint move-btn__hint--weak' : 'move-btn__hint'}>
                      {isStrong ? '↑ ばつぐん！' : isWeak ? '↓ ちょっと にがて' : '→ ふつう'}
                    </small>
                  )}
                </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
