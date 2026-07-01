// ============================================================
// ゲーム全体の状態管理（Context + Reducer + localStorage 永続化）
//
// v2 で追加したもの:
//   xp          : ほしのかけら。正解・クリア・バトルで貯まり相棒が育つ
//   streak      : 連続で遊んだ日数（🔥）
//   missed      : 分野ごとの「まちがえた問題」キュー（後日再出題＝復習）
//   onboarded   : はじめての おはなし（オンボーディング）を見たか
//   partnerColor: 相棒の色（はじめに選ぶ）
// ============================================================

import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { loadState, saveState, todayKey } from '../engine/storage.js'
import { makeSkill, applyResult } from '../engine/difficulty.js'
import { buildCoreMission } from '../engine/missions.js'
import { DOMAINS } from '../engine/activities.js'
import { getPartner } from '../data/monsters.js'
import { planetUnlockedAt, currentPlanet } from '../data/planets.js'

const BATTLE_DAILY_LIMIT = 3 // 息抜きバトルの1日の基本プレイ上限
const MISSED_MAX = 12 // 復習キューの分野ごとの上限

// コンテンツの大きな更新で上げる。進捗は保ったまま当日ミッションを作り直す。
const CONTENT_VERSION = 5

// XP → 相棒レベル（ゆるやかな二次曲線）
export function partnerLevel(xp) {
  return Math.min(99, Math.floor(Math.sqrt(Math.max(0, xp) / 6)) + 1)
}

// 相棒の色バリエーション（オンボーディングで選ぶ）
export const PARTNER_COLORS = {
  mint: { label: 'ミント', body: '#7af0d0', belly: '#bafbe9' },
  sky: { label: 'そら', body: '#7ac9f0', belly: '#c9ecfb' },
  peach: { label: 'もも', body: '#ffb0c9', belly: '#ffdde9' }
}

function freshSkills() {
  const s = {}
  for (const d of DOMAINS) s[d.id] = makeSkill()
  return s
}

function freshDaily(date) {
  return {
    date,
    coreTasks: buildCoreMission(),
    coreIndex: 0,
    coreDone: false,
    tasksClearedToday: 0,
    correctToday: 0,
    attemptsToday: 0,
    perDomainToday: {},
    ticketsEarnedToday: 0,
    okawariIndex: 0,
    extraIndex: 0
  }
}

function freshBattle(date) {
  return {
    date,
    playsUsed: 0,
    tickets: 0,
    dailyLimit: BATTLE_DAILY_LIMIT,
    wins: 0,
    caught: []
  }
}

function createInitialState() {
  const today = todayKey()
  const partner = getPartner()
  return {
    version: 2,
    contentVersion: CONTENT_VERSION,
    createdAt: Date.now(),
    onboarded: false,
    partnerId: partner.id,
    partnerColor: 'mint',
    xp: 0,
    streak: 0,
    lastActiveDate: null,
    skills: freshSkills(),
    missed: {}, // { domainId: [itemKey,...] }
    unlockedMonsters: [partner.id],
    totalClears: 0,
    daily: freshDaily(today),
    battle: freshBattle(today),
    settings: { tts: true, sfx: true },
    history: {},
    pendingCelebration: null
  }
}

// v1（旧バージョン）のセーブを引き継ぐ
function migrateV1(saved) {
  const fresh = createInitialState()
  return {
    ...fresh,
    skills: { ...fresh.skills, ...(saved.skills || {}) },
    unlockedMonsters: saved.unlockedMonsters?.length ? saved.unlockedMonsters : fresh.unlockedMonsters,
    totalClears: saved.totalClears || 0,
    history: saved.history || {},
    settings: { ...fresh.settings, ...(saved.settings || {}) },
    xp: (saved.totalClears || 0) * 10,
    onboarded: (saved.totalClears || 0) > 0 || (saved.unlockedMonsters?.length || 0) > 1
  }
}

function rolloverIfNeeded(state) {
  const today = todayKey()
  if (state.daily.date === today && state.battle.date === today) return state
  const history = { ...state.history }
  if (state.daily && state.daily.attemptsToday > 0) {
    history[state.daily.date] = {
      clears: state.daily.tasksClearedToday,
      correct: state.daily.correctToday,
      attempts: state.daily.attemptsToday,
      perDomain: state.daily.perDomainToday,
      ticketsEarned: state.daily.ticketsEarnedToday
    }
  }
  return { ...state, history, daily: freshDaily(today), battle: freshBattle(today) }
}

function yesterdayKey() {
  return todayKey(new Date(Date.now() - 24 * 60 * 60 * 1000))
}

function addDomainTally(perDomain, domainId, correct) {
  const cur = perDomain[domainId] || { correct: 0, attempts: 0 }
  return {
    ...perDomain,
    [domainId]: { correct: cur.correct + (correct ? 1 : 0), attempts: cur.attempts + 1 }
  }
}

function updateMissed(missed, domainId, itemKey, correct) {
  if (!itemKey) return missed
  const list = missed[domainId] || []
  if (correct) {
    if (!list.includes(itemKey)) return missed
    return { ...missed, [domainId]: list.filter((k) => k !== itemKey) }
  }
  if (list.includes(itemKey)) return missed
  return { ...missed, [domainId]: [...list, itemKey].slice(-MISSED_MAX) }
}

function reducer(state, action) {
  switch (action.type) {
    case 'ROLLOVER':
      return rolloverIfNeeded(state)

    case 'ONBOARD':
      return { ...state, onboarded: true, partnerColor: action.color || 'mint' }

    // 1問の回答結果（難易度調整＋集計＋XP＋ストリーク＋復習キュー）
    case 'ANSWER': {
      const { domainId, correct, itemKey } = action
      const skill = state.skills[domainId] || makeSkill()
      const { skill: newSkill } = applyResult(skill, correct)

      const today = todayKey()
      let streak = state.streak
      let lastActiveDate = state.lastActiveDate
      if (lastActiveDate !== today) {
        streak = lastActiveDate === yesterdayKey() ? streak + 1 : 1
        lastActiveDate = today
      }

      return {
        ...state,
        skills: { ...state.skills, [domainId]: newSkill },
        xp: state.xp + (correct ? 2 : 0),
        streak,
        lastActiveDate,
        missed: updateMissed(state.missed, domainId, itemKey, correct),
        daily: {
          ...state.daily,
          correctToday: state.daily.correctToday + (correct ? 1 : 0),
          attemptsToday: state.daily.attemptsToday + 1,
          perDomainToday: addDomainTally(state.daily.perDomainToday, domainId, correct)
        }
      }
    }

    // タスク（数問のまとまり）をクリア → ごほうび進行
    case 'CLEAR_TASK': {
      const { kind } = action
      const totalClears = state.totalClears + 1

      let daily = { ...state.daily, tasksClearedToday: state.daily.tasksClearedToday + 1 }
      let battle = state.battle
      let unlockedMonsters = state.unlockedMonsters
      const celebration = { ticket: false, planet: null, monster: null, partnerStageUp: false, xpGain: 6 }

      if (kind === 'core') {
        const coreIndex = state.daily.coreIndex + 1
        daily = { ...daily, coreIndex, coreDone: coreIndex >= state.daily.coreTasks.length }
      } else if (kind === 'okawari') {
        daily = { ...daily, okawariIndex: state.daily.okawariIndex + 1 }
      } else if (kind === 'extra') {
        daily = {
          ...daily,
          extraIndex: state.daily.extraIndex + 1,
          ticketsEarnedToday: state.daily.ticketsEarnedToday + 1
        }
        battle = { ...battle, tickets: battle.tickets + 1 }
        celebration.ticket = true
      }

      const newPlanet = planetUnlockedAt(totalClears)
      if (newPlanet) {
        celebration.planet = newPlanet
        if (newPlanet.unlockMonster && !unlockedMonsters.includes(newPlanet.unlockMonster)) {
          unlockedMonsters = [...unlockedMonsters, newPlanet.unlockMonster]
          celebration.monster = newPlanet.unlockMonster
        }
      }

      const partner = getPartner()
      if (partner.stages) {
        const crossed = partner.stages.find((st) => st.at === totalClears && st.at > 0)
        if (crossed) celebration.partnerStageUp = true
      }

      return {
        ...state,
        totalClears,
        xp: state.xp + 6,
        daily,
        battle,
        unlockedMonsters,
        pendingCelebration: celebration
      }
    }

    case 'CLEAR_CELEBRATION':
      return { ...state, pendingCelebration: null }

    // 息抜きバトルを1回プレイする権利を消費（無料枠→チケットの順）
    case 'CONSUME_BATTLE_PLAY': {
      const b = state.battle
      if (b.playsUsed < b.dailyLimit) {
        return { ...state, battle: { ...b, playsUsed: b.playsUsed + 1 } }
      }
      if (b.tickets > 0) {
        return { ...state, battle: { ...b, tickets: b.tickets - 1 } }
      }
      return state
    }

    case 'BATTLE_WON': {
      const b = state.battle
      const caught = action.caughtId && !state.unlockedMonsters.includes(action.caughtId)
      return {
        ...state,
        xp: state.xp + 12,
        battle: {
          ...b,
          wins: b.wins + 1,
          caught: caught ? [...b.caught, action.caughtId] : b.caught
        },
        unlockedMonsters: caught
          ? [...state.unlockedMonsters, action.caughtId]
          : state.unlockedMonsters
      }
    }

    case 'SET_SETTING':
      return { ...state, settings: { ...state.settings, [action.key]: action.value } }

    case 'RESET_ALL':
      return createInitialState()

    default:
      return state
  }
}

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => {
    const saved = loadState()
    let base
    if (saved && saved.version === 2) {
      // 新フィールドが増えても壊れないよう、初期値の上に被せる
      const fresh = createInitialState()
      base = {
        ...fresh,
        ...saved,
        settings: { ...fresh.settings, ...(saved.settings || {}) },
        missed: saved.missed || {}
      }
    } else if (saved && saved.version === 1) {
      base = migrateV1(saved)
    } else {
      base = createInitialState()
    }
    base = rolloverIfNeeded(base)
    if (base.contentVersion !== CONTENT_VERSION) {
      base = { ...base, contentVersion: CONTENT_VERSION, daily: freshDaily(todayKey()) }
    }
    return base
  })

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'ROLLOVER' }), 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}

export function useCurrentPlanet() {
  const { state } = useGame()
  return currentPlanet(state.totalClears)
}
