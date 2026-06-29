// ============================================================
// ゲーム全体の状態管理（Context + Reducer + localStorage 永続化）
//
// ここが「毎日ミッション」「難易度」「収集」「息抜きバトル解放」の
// ロジックの中心。UI はここの state と actions を読むだけ。
// ============================================================

import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { loadState, saveState, todayKey } from '../engine/storage.js'
import { makeSkill, applyResult } from '../engine/difficulty.js'
import { buildCoreMission } from '../engine/missions.js'
import { DOMAINS } from '../engine/activities.js'
import { getPartner } from '../data/monsters.js'
import { planetUnlockedAt, currentPlanet } from '../data/planets.js'

const BATTLE_DAILY_LIMIT = 3 // 息抜きバトルの1日の基本プレイ上限

// コンテンツの大きな更新があったら上げる。上げると、進捗(習熟度・収集・累計)は
// 保ったまま「今日のミッション」を新コンテンツで作り直す。
const CONTENT_VERSION = 3

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
    perDomainToday: {}, // { domainId: {correct, attempts} }
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
    caught: [] // 捕まえた野生モンスターの id
  }
}

function createInitialState() {
  const today = todayKey()
  const partner = getPartner()
  return {
    version: 1,
    contentVersion: CONTENT_VERSION,
    createdAt: Date.now(),
    partnerId: partner.id,
    skills: freshSkills(),
    unlockedMonsters: [partner.id],
    totalClears: 0,
    daily: freshDaily(today),
    battle: freshBattle(today),
    settings: { tts: true, sfx: true },
    history: {}, // { date: {clears, correct, attempts, perDomain, ticketsEarned} }
    pendingCelebration: null
  }
}

// 日付が変わっていたら今日の分をリセット（履歴は残す）
function rolloverIfNeeded(state) {
  const today = todayKey()
  if (state.daily.date === today && state.battle.date === today) return state

  // 前日の daily を history に保存
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
  return {
    ...state,
    history,
    daily: freshDaily(today),
    battle: freshBattle(today)
  }
}

function addDomainTally(perDomain, domainId, correct) {
  const cur = perDomain[domainId] || { correct: 0, attempts: 0 }
  return {
    ...perDomain,
    [domainId]: {
      correct: cur.correct + (correct ? 1 : 0),
      attempts: cur.attempts + 1
    }
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return action.state

    case 'ROLLOVER':
      return rolloverIfNeeded(state)

    // 1問の回答結果（難易度調整＋当日の集計）
    case 'ANSWER': {
      const { domainId, correct } = action
      const skill = state.skills[domainId] || makeSkill()
      const { skill: newSkill } = applyResult(skill, correct)
      const daily = {
        ...state.daily,
        correctToday: state.daily.correctToday + (correct ? 1 : 0),
        attemptsToday: state.daily.attemptsToday + 1,
        perDomainToday: addDomainTally(state.daily.perDomainToday, domainId, correct)
      }
      return {
        ...state,
        skills: { ...state.skills, [domainId]: newSkill },
        daily
      }
    }

    // タスク（数問のまとまり）をクリア → ごほうび進行
    case 'CLEAR_TASK': {
      const { kind } = action // 'core' | 'okawari' | 'extra'
      const prevClears = state.totalClears
      const totalClears = prevClears + 1

      let daily = {
        ...state.daily,
        tasksClearedToday: state.daily.tasksClearedToday + 1
      }
      let battle = state.battle
      let unlockedMonsters = state.unlockedMonsters
      const celebration = { ticket: false, planet: null, monster: null, partnerStageUp: false }

      // コアの進行
      if (kind === 'core') {
        const coreIndex = state.daily.coreIndex + 1
        daily = {
          ...daily,
          coreIndex,
          coreDone: coreIndex >= state.daily.coreTasks.length
        }
      } else if (kind === 'okawari') {
        daily = { ...daily, okawariIndex: state.daily.okawariIndex + 1 }
      } else if (kind === 'extra') {
        // 追加問題をクリア → 息抜きバトルの解放チケットを1枚
        daily = {
          ...daily,
          extraIndex: state.daily.extraIndex + 1,
          ticketsEarnedToday: state.daily.ticketsEarnedToday + 1
        }
        battle = { ...battle, tickets: battle.tickets + 1 }
        celebration.ticket = true
      }

      // 惑星の解放（累計クリア数がしきい値に達したら）
      const newPlanet = planetUnlockedAt(totalClears)
      if (newPlanet) {
        celebration.planet = newPlanet
        if (newPlanet.unlockMonster && !unlockedMonsters.includes(newPlanet.unlockMonster)) {
          unlockedMonsters = [...unlockedMonsters, newPlanet.unlockMonster]
          celebration.monster = newPlanet.unlockMonster
        }
      }

      // 相棒の進化段階が上がったか（6, 16 クリアなどのしきい値）
      const partner = getPartner()
      if (partner.stages) {
        const crossed = partner.stages.find((st) => st.at === totalClears && st.at > 0)
        if (crossed) celebration.partnerStageUp = true
      }

      return {
        ...state,
        totalClears,
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
      return state // 遊べない（UI 側でブロック）
    }

    case 'BATTLE_WON': {
      const b = state.battle
      const caught = action.caughtId && !b.caught.includes(action.caughtId)
      return {
        ...state,
        battle: {
          ...b,
          wins: b.wins + 1,
          caught: caught ? [...b.caught, action.caughtId] : b.caught
        },
        unlockedMonsters:
          caught && !state.unlockedMonsters.includes(action.caughtId)
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
    let base = saved && saved.version === 1 ? saved : createInitialState()
    base = rolloverIfNeeded(base)
    // コンテンツ更新時: 進捗は保ちつつ、今日のミッションだけ新内容で作り直す
    if (base.contentVersion !== CONTENT_VERSION) {
      base = {
        ...base,
        contentVersion: CONTENT_VERSION,
        daily: freshDaily(todayKey())
      }
    }
    return base
  })

  // 永続化
  useEffect(() => {
    saveState(state)
  }, [state])

  // 起動中に日付をまたいだ場合に備えてたまにチェック
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

// 便利セレクタ
export function useCurrentPlanet() {
  const { state } = useGame()
  return currentPlanet(state.totalClears)
}
