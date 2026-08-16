// なかま図鑑 + 3体チーム + 個体育成
import React, { useMemo, useState } from 'react'
import { useGame } from '../state/GameContext.jsx'
import { MONSTERS, MONSTER_BY_ID } from '../data/monsters.js'
import { MONSTER_MASTER_BY_ID } from '../data/monsterMaster/monsterMaster.js'
import { companionForMonster, companionLevel, evolutionStatus, formStatus, subjectCount, xpForLevel } from '../engine/monsterProgress.js'
import Monster from '../components/Monster.jsx'
import { AppHeader, Starfield } from '../components/common.jsx'
import { speak } from '../engine/tts.js'
import { sfx } from '../engine/sfx.js'

const PAGE_SIZE = 100

function visualMonster(monsterId, asset = null) {
  const monster = MONSTER_BY_ID[monsterId]
  const master = MONSTER_MASTER_BY_ID[monsterId]
  return monster ? { ...monster, heroAsset: asset || master?.assets?.full || monster.heroAsset } : null
}

function requirementText(status) {
  if (!status?.available) return null
  return status.ready ? 'じゅんび OK！' : status.missing[0] || 'もうすこし'
}

export default function CollectionScreen({ onBack }) {
  const { state, dispatch } = useGame()
  const unlocked = new Set(state.unlockedMonsters)
  const [page, setPage] = useState(0)
  const [selectedMonsterId, setSelectedMonsterId] = useState(null)
  const pageCount = Math.ceil(MONSTERS.length / PAGE_SIZE)
  const pageMonsters = MONSTERS.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const unlockedInPage = pageMonsters.filter((monster) => unlocked.has(monster.id)).length

  const selectedPair = selectedMonsterId ? companionForMonster(state, selectedMonsterId) : null
  const selectedCompanionId = selectedPair?.[0] || null
  const selectedCompanion = selectedPair?.[1] || null
  const selectedVisual = selectedCompanion
    ? visualMonster(selectedCompanion.currentMonsterId)
    : selectedMonsterId ? visualMonster(selectedMonsterId) : null
  const level = selectedCompanion ? companionLevel(selectedCompanion.xp) : 1
  const nextXp = level >= 99 ? 0 : xpForLevel(level + 1) - (selectedCompanion?.xp || 0)
  const evolution = selectedCompanionId ? evolutionStatus(state, selectedCompanionId) : null
  const awakening = selectedCompanionId ? formStatus(state, selectedCompanionId, 'awakening') : null
  const giga = selectedCompanionId ? formStatus(state, selectedCompanionId, 'giga') : null
  const selectedInParty = selectedCompanionId ? state.party.includes(selectedCompanionId) : false
  const partyFull = state.party.length >= 3

  const partyCards = useMemo(() => (state.party || []).map((companionId) => {
    const companion = state.companions[companionId]
    return companion ? { companionId, companion, visual: visualMonster(companion.currentMonsterId) } : null
  }).filter(Boolean), [state.party, state.companions])

  const tap = (monster, isUnlocked) => {
    if (!isUnlocked) {
      sfx.star(); speak('まだ であって いない なかま。バトルで さがそう！'); return
    }
    let seed = 0
    for (const char of monster.id) seed += char.charCodeAt(0)
    sfx.cry(seed)
    setSelectedMonsterId(monster.id)
    speak(`${monster.name}。 ${monster.desc}`)
  }

  const evolve = () => {
    if (!evolution?.ready) return
    const next = MONSTER_BY_ID[evolution.nextMonsterId]
    dispatch({ type: 'EVOLVE_COMPANION', companionId: selectedCompanionId })
    sfx.fanfare(); speak(`おめでとう！ ${next.name}に しんかしたよ！`)
  }

  const unlockMonsterForm = (kind, status) => {
    if (!status?.ready) return
    dispatch({ type: 'UNLOCK_MONSTER_FORM', companionId: selectedCompanionId, kind })
    sfx.fanfare()
    speak(kind === 'awakening' ? 'スターかくせいが できるように なったよ！' : 'ギガスターが できるように なったよ！')
  }

  return (
    <div className="screen fade-in collection-screen">
      <Starfield />
      <AppHeader onBack={onBack} title="📒 なかま・そだてる" right={<div className="pill">{unlocked.size} / {MONSTERS.length}</div>} />

      <section className="party-strip" aria-label="いまのチーム">
        <div className="party-strip__title">⭐ チーム {partyCards.length}/3</div>
        <div className="party-strip__members">
          {partyCards.map(({ companionId, companion, visual }) => (
            <button key={companionId} className={`party-chip${state.activeCompanionId === companionId ? ' party-chip--active' : ''}`} onClick={() => setSelectedMonsterId(companion.currentMonsterId)}>
              <Monster monster={visual} size={54} bounce={false} />
              <span>{visual.name}</span><small>Lv.{companionLevel(companion.xp)}</small>
            </button>
          ))}
        </div>
        <div className="party-strip__hint">「たたかう」を えらんだ こが バトルに でるよ</div>
      </section>

      <div className="row collection-pager">
        <button className="btn btn--ghost" disabled={page === 0} onClick={() => { sfx.tap(); setPage((value) => value - 1) }}>◀</button>
        <div className="pill">{page + 1}/{pageCount}（{unlockedInPage}/{pageMonsters.length}）</div>
        <button className="btn btn--ghost" disabled={page >= pageCount - 1} onClick={() => { sfx.tap(); setPage((value) => value + 1) }}>▶</button>
      </div>

      <div className="scroll-y collection-scroll">
        <div className="collection-grid">
          {pageMonsters.map((monster) => {
            const isUnlocked = unlocked.has(monster.id)
            const pair = isUnlocked ? companionForMonster(state, monster.id) : null
            const isActive = pair?.[0] === state.activeCompanionId
            return (
              <button key={monster.id} className={`card collection-card${isActive ? ' collection-card--active' : ''}`} onClick={() => tap(monster, isUnlocked)}>
                {isUnlocked ? <Monster monster={visualMonster(monster.id)} size={104} bounce={false} /> : <div className="collection-unknown">❔</div>}
                <div className="collection-card__name">{isUnlocked ? monster.name : '？？？'}</div>
                <div className="muted collection-card__meta">{isUnlocked ? `${monster.element}${pair ? `・Lv.${companionLevel(pair[1].xp)}` : ''}` : 'みっけよう'}</div>
                {isActive && <span className="collection-card__active">⚔️ たたかう</span>}
              </button>
            )
          })}
        </div>
      </div>

      {selectedVisual && (
        <div className="monster-detail-backdrop" role="presentation" onClick={() => setSelectedMonsterId(null)}>
          <section className="monster-detail" role="dialog" aria-modal="true" aria-label={`${selectedVisual.name}の育成`} onClick={(event) => event.stopPropagation()}>
            <button className="monster-detail__close" onClick={() => setSelectedMonsterId(null)} aria-label="とじる">✕</button>
            <div className="monster-detail__hero">
              <Monster monster={selectedVisual} size={150} bounce={false} />
              <div><h2>{selectedVisual.name}</h2><div className="pill">Lv.{level}</div><div className="muted">{selectedVisual.element}</div></div>
            </div>
            <div className="monster-detail__description">{selectedVisual.desc}</div>

            {selectedCompanion ? (
              <>
                <div className="monster-xp-bar"><span style={{ width: level >= 99 ? '100%' : `${Math.max(4, 100 - nextXp / Math.max(1, xpForLevel(level + 1) - xpForLevel(level)) * 100)}%` }} /></div>
                <div className="monster-detail__goal">{level >= 99 ? 'さいこうレベル！' : `つぎまで あと ${nextXp} XP`}</div>
                <div className="monster-detail__stats"><span>📚 {selectedCompanion.learningXp} XP</span><span>⚔️ {selectedCompanion.battleXp} XP</span><span>📅 {selectedCompanion.trainedDays}にち</span><span>📖 {subjectCount(selectedCompanion.domainMask)}きょうか</span></div>
                <div className="monster-detail__actions">
                  <button className="btn btn--primary" disabled={state.activeCompanionId === selectedCompanionId} onClick={() => dispatch({ type: 'SET_ACTIVE_COMPANION', companionId: selectedCompanionId })}>{state.activeCompanionId === selectedCompanionId ? '⚔️ いま たたかう' : '⚔️ このこで たたかう'}</button>
                  <button className="btn btn--ghost" disabled={(selectedInParty && state.party.length <= 1) || (!selectedInParty && partyFull)} onClick={() => dispatch({ type: 'TOGGLE_PARTY_COMPANION', companionId: selectedCompanionId })}>{selectedInParty ? (state.party.length <= 1 ? 'ひとりは のこそう' : 'チームから はずす') : (partyFull ? 'チームは 3びき' : 'チームに いれる')}</button>
                </div>
                {evolution?.available && <button className="growth-goal" disabled={!evolution.ready} onClick={evolve}><strong>🌱 しんか</strong><span>{requirementText(evolution)}</span></button>}
                {awakening?.available && <button className="growth-goal" disabled={!awakening.ready || awakening.unlocked} onClick={() => unlockMonsterForm('awakening', awakening)}><strong>✨ スターかくせい</strong><span>{awakening.unlocked ? 'つかえるよ！' : requirementText(awakening)}</span></button>}
                {giga?.available && <button className="growth-goal" disabled={!giga.ready || giga.unlocked} onClick={() => unlockMonsterForm('giga', giga)}><strong>🌟 ギガスター</strong><span>{giga.unlocked ? 'つかえるよ！' : requirementText(giga)}</span></button>}
              </>
            ) : <div className="muted">バトルで つかまえると そだてられるよ</div>}
          </section>
        </div>
      )}
    </div>
  )
}
