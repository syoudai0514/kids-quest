// ============================================================
// そうび画面 — あつめた武器を見て、つけかえる
//
// ・いま そうび中の武器を大きく表示（こうげき・たいりょくの数字つき）
// ・持っている武器はタップで そうび、まだの武器は「？」でコレクション欲を
// ・レアリティごとに いろ と ほしの数がちがう
// ============================================================

import React from 'react'
import { useGame, equippedWeapon, partnerLevel } from '../state/GameContext.jsx'
import { WEAPONS, RARITIES, getWeapon, nextWeaponAwardDay, weaponAwardsDue } from '../data/weapons.js'
import { partnerMaxHp, battleAttackBonus, battleHpBonus } from '../engine/battle.js'
import { Starfield } from '../components/common.jsx'
import { speak } from '../engine/tts.js'
import { sfx } from '../engine/sfx.js'

function Stars({ n, color }) {
  return (
    <span style={{ letterSpacing: 1, color, fontSize: 12 }}>
      {'★'.repeat(n)}
    </span>
  )
}

export default function EquipScreen({ onBack }) {
  const { state, dispatch } = useGame()
  const owned = new Set(state.weapons || [])
  const cur = equippedWeapon(state)
  const level = partnerLevel(state.xp)
  const activityDays = state.rewardProgress?.activityDays?.length || 0
  const chestReady = weaponAwardsDue(activityDays) > owned.size
  const nextChestDay = nextWeaponAwardDay(activityDays + 1, owned.size)

  const equip = (w) => {
    if (!owned.has(w.id)) {
      sfx.star()
      speak('この そうびは まだ もっていないよ。バトルで かつと てにはいる！')
      return
    }
    if (state.equipped === w.id) return
    dispatch({ type: 'EQUIP_WEAPON', weaponId: w.id })
    sfx.levelUp()
    speak(`${w.name}を そうびした！ こうげき プラス${battleAttackBonus(w)}！`)
  }

  return (
    <div className="screen fade-in">
      <Starfield />
      <div className="topbar">
        <button className="btn btn--ghost" style={{ minHeight: 60 }} onClick={onBack}>
          🏠 もどる
        </button>
        <div className="topbar__title">⚔️ そうび</div>
        <div className="pill">
          {owned.size} / {WEAPONS.length}
        </div>
      </div>

      <div className="scroll-y" style={{ flex: 1, padding: '6px 8px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* いまのそうび */}
          <div
            className="card"
            style={{
              textAlign: 'center',
              marginBottom: 16,
              border: `3px solid ${cur ? RARITIES[cur.rarity].color : 'rgba(255,255,255,0.2)'}`,
              boxShadow: cur ? `0 0 24px ${RARITIES[cur.rarity].glow}` : 'none'
            }}
          >
            <div className="muted" style={{ fontWeight: 800, fontSize: 13 }}>
              いまの そうび
            </div>
            <div style={{ fontSize: 62, lineHeight: 1.1 }}>{cur ? cur.emoji : '👊'}</div>
            <div style={{ fontWeight: 900, fontSize: 'clamp(18px,3.4vw,26px)' }}>
              {cur ? cur.name : 'すで たたかう'}
            </div>
            {cur && <Stars n={RARITIES[cur.rarity].stars} color={RARITIES[cur.rarity].color} />}
            <div
              className="row"
              style={{ justifyContent: 'center', gap: 14, marginTop: 8, fontWeight: 900 }}
            >
              <span style={{ color: 'var(--accent-2)' }}>⚔️ こうげき +{battleAttackBonus(cur)}</span>
              <span style={{ color: 'var(--accent)' }}>❤️ たいりょく +{battleHpBonus(cur)}</span>
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
              いまの さいだいたいりょく {partnerMaxHp(level, cur)}
            </div>
          </div>

          <div className="muted" style={{ fontWeight: 800, marginBottom: 8, fontSize: 14 }}>
            {chestReady
              ? '🎁 宝箱が じゅんびできた！ バトルに かつと ひらくよ'
              : nextChestDay
                ? `🎁 つぎの 宝箱まで あと ${Math.max(0, nextChestDay - activityDays)} かつどうび`
                : '🎁 まなぶと 宝箱が ひらくよ'}
          </div>

          {/* 一覧 */}
          {Object.values(RARITIES).map((rar) => {
            const list = WEAPONS.filter((w) => w.rarity === rar.key)
            const have = list.filter((w) => owned.has(w.id)).length
            return (
              <div key={rar.key} style={{ marginBottom: 18 }}>
                <div
                  className="row"
                  style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}
                >
                  <div style={{ fontWeight: 900, color: rar.color }}>
                    {rar.name} <Stars n={rar.stars} color={rar.color} />
                  </div>
                  <div className="muted" style={{ fontSize: 13, fontWeight: 800 }}>
                    {have}/{list.length}
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))',
                    gap: 10
                  }}
                >
                  {list.map((w) => {
                    const has = owned.has(w.id)
                    const isOn = state.equipped === w.id
                    return (
                      <button
                        key={w.id}
                        className="card"
                        onClick={() => equip(w)}
                        style={{
                          textAlign: 'center',
                          cursor: 'pointer',
                          padding: '10px 6px',
                          opacity: has ? 1 : 0.45,
                          border: isOn
                            ? `3px solid ${rar.color}`
                            : '2px solid rgba(255,255,255,0.14)',
                          boxShadow: isOn ? `0 0 18px ${rar.glow}` : undefined
                        }}
                      >
                        <div style={{ fontSize: 34, filter: has ? 'none' : 'grayscale(1)' }}>
                          {has ? w.emoji : '❔'}
                        </div>
                        <div style={{ fontWeight: 900, fontSize: 12, lineHeight: 1.3 }}>
                          {has ? w.name : '？？？'}
                        </div>
                        {has && (
                          <div className="muted" style={{ fontSize: 11, fontWeight: 800 }}>
                            ⚔️+{battleAttackBonus(w)} ❤️+{battleHpBonus(w)}
                          </div>
                        )}
                        {isOn && (
                          <div
                            className="pill"
                            style={{
                              marginTop: 4,
                              fontSize: 10,
                              padding: '2px 8px',
                              background: rar.color,
                              color: '#10231c',
                              border: 'none'
                            }}
                          >
                            そうび中
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
