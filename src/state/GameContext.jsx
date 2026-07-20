// ============================================================
// ゲーム全体の状態管理（Context + Reducer + localStorage 永続化）
//
// v3 で追加したもの:
//   grade / gradeMax : いまの学年 / 解放済みの最高学年（年長0〜小6）。
//                      全分野の平均レベルがマスター基準に達すると次が解放
//   skills[grade]    : 習熟度は学年ごとに別管理（戻っても進んでも保持）
//   conquered        : 「まちがいから おぼえた」累計数（失敗→知識の見える化）
//   missed           : 分野ごとの「まちがえた問題」キュー（とっくんで克服）
// ============================================================

import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { loadState, saveState, todayKey } from '../engine/storage.js'
import { makeSkill, applyResult } from '../engine/difficulty.js'
import { buildCoreMission } from '../engine/missions.js'
import { DOMAINS } from '../engine/activities.js'
import { getPartner } from '../data/monsters.js'
import { planetUnlockedAt, currentPlanet } from '../data/planets.js'
import { MAX_GRADE, MASTER_LEVEL } from '../data/grades.js'

const BATTLE_DAILY_LIMIT = 3 // 息抜きバトルの1日の基本プレイ上限
const MISSED_MAX = 14 // 復習キューの分野ごとの上限

// コンテンツの大きな更新で上げる。進捗は保ったまま当日ミッションを作り直す。
const CONTENT_VERSION = 7

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

// いまの学年の習熟度（無ければ作る）
export function skillsForGrade(state, grade = state.grade) {
  return state.skills[grade] || freshSkills()
}
export function skillOf(state, domainId, grade = state.grade) {
  return (state.skills[grade] || {})[domainId] || makeSkill()
}

// 学年マスター進捗（0〜1）: 全分野の平均レベル / マスター基準
export function masteryProgress(state) {
  const skills = skillsForGrade(state)
  const doms = DOMAINS.filter((d) => d.available)
  const avg = doms.reduce((sum, d) => sum + Math.floor((skills[d.id] || makeSkill()).level), 0) / doms.length
  return Math.min(1, avg / MASTER_LEVEL)
}

export function missedCount(state) {
  return Object.values(state.missed).reduce((n, arr) => n + arr.length, 0)
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
    version: 3,
    contentVersion: CONTENT_VERSION,
    createdAt: Date.now(),
    onboarded: false,
    partnerId: partner.id,
    partnerColor: 'mint',
    grade: 0,
    gradeMax: 0,
    pendingGradeUp: null,
    xp: 0,
    streak: 0,
    lastActiveDate: null,
    conquered: 0,
    skills: { 0: freshSkills() },
    missed: {}, // { domainId: [itemKey,...] }
    unlockedMonsters: [partner.id],
    totalClears: 0,
    daily: freshDaily(today),
    battle: freshBattle(today),
    settings: { tts: true, sfx: true, bgm: true },
    history: {},
    pendingCelebration: null
  }
}

// 旧バージョンのセーブを引き継ぐ
function migrateOld(saved) {
  const fresh = createInitialState()
  const flatSkills = saved.version === 2 || saved.version === 1 ? saved.skills || {} : {}
  return {
    ...fresh,
    skills: { 0: { ...freshSkills(), ...flatSkills } },
    unlockedMonsters: saved.unlockedMonsters?.length ? saved.unlockedMonsters : fresh.unlockedMonsters,
    totalClears: saved.totalClears || 0,
    history: saved.history || {},
    settings: { ...fresh.settings, ...(saved.settings || {}) },
    xp: saved.xp ?? (saved.totalClears || 0) * 10,
    streak: saved.streak || 0,
    lastActiveDate: saved.lastActiveDate || null,
    missed: saved.missed || {},
    partnerColor: saved.partnerColor || 'mint',
    onboarded: saved.onboarded ?? ((saved.totalClears || 0) > 0)
  }
}

// 保存データ（読み込み or インポート）を、いまのバージョンの形に整える。
// v3 はそのまま引き継ぎ、旧 v1/v2 は移行、未知は新規から作る。
function normalizeSaved(saved) {
  let base
  if (saved && saved.version === 3) {
    const fresh = createInitialState()
    base = {
      ...fresh,
      ...saved,
      settings: { ...fresh.settings, ...(saved.settings || {}) },
      skills: saved.skills && saved.skills[0] ? saved.skills : { 0: freshSkills() },
      missed: saved.missed || {}
    }
  } else if (saved && (saved.version === 1 || saved.version === 2)) {
    base = migrateOld(saved)
  } else {
    base = createInitialState()
  }
  base = rolloverIfNeeded(base)
  if (base.contentVersion !== CONTENT_VERSION) {
    base = { ...base, contentVersion: CONTENT_VERSION, daily: freshDaily(todayKey()) }
  }
  return base
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

function reducer(state, action) {
  switch (action.type) {
    case 'ROLLOVER':
      return rolloverIfNeeded(state)

    case 'ONBOARD':
      return { ...state, onboarded: true, partnerColor: action.color || 'mint' }

    case 'SET_GRADE': {
      const g = Math.max(0, Math.min(state.gradeMax, action.grade))
      return {
        ...state,
        grade: g,
        skills: state.skills[g] ? state.skills : { ...state.skills, [g]: freshSkills() }
      }
    }

    // 1問の回答結果
    // まちがい → 復習キューへ（あとで「とっくん」で克服できる）
    // 復習キューにあった問題に正解 → キューから外れ、ボーナスXP＋克服数が増える
    //   ＝「失敗から学ぶと知っていることが増える」を数字と演出で見せる
    case 'ANSWER': {
      const { domainId, correct, itemKey } = action
      const grade = state.grade
      const gradeSkills = skillsForGrade(state)
      const skill = gradeSkills[domainId] || makeSkill()
      const { skill: newSkill } = applyResult(skill, correct)
      const newGradeSkills = { ...gradeSkills, [domainId]: newSkill }

      const today = todayKey()
      let streak = state.streak
      let lastActiveDate = state.lastActiveDate
      if (lastActiveDate !== today) {
        streak = lastActiveDate === yesterdayKey() ? streak + 1 : 1
        lastActiveDate = today
      }

      // 復習キューの出し入れ＋克服ボーナス
      let missed = state.missed
      let conquered = state.conquered
      let xpGain = correct ? 2 : 0
      if (itemKey) {
        const list = missed[domainId] || []
        const wasMissed = list.includes(itemKey)
        if (correct && wasMissed) {
          missed = { ...missed, [domainId]: list.filter((k) => k !== itemKey) }
          conquered += 1
          xpGain += 4 // まちがいを ちからに かえたボーナス
        } else if (!correct && !wasMissed) {
          missed = { ...missed, [domainId]: [...list, itemKey].slice(-MISSED_MAX) }
        }
      }

      // 学年マスター判定（全分野の平均レベルが基準以上 → 次の学年を解放）
      let gradeMax = state.gradeMax
      let pendingGradeUp = state.pendingGradeUp
      if (correct && grade === gradeMax && gradeMax < MAX_GRADE) {
        const doms = DOMAINS.filter((d) => d.available)
        const avg =
          doms.reduce((sum, d) => sum + Math.floor((newGradeSkills[d.id] || makeSkill()).level), 0) /
          doms.length
        if (avg >= MASTER_LEVEL) {
          gradeMax = grade + 1
          pendingGradeUp = grade + 1
        }
      }

      return {
        ...state,
        skills: { ...state.skills, [grade]: newGradeSkills },
        xp: state.xp + xpGain,
        streak,
        lastActiveDate,
        missed,
        conquered,
        gradeMax,
        pendingGradeUp,
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
      const celebration = {
        ticket: false,
        planet: null,
        monster: null,
        partnerStageUp: false,
        gradeUp: null,
        xpGain: kind === 'review' ? 8 : 6
      }

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

      // ミッション中にマスターした学年の解放は、タスク完了時にまとめて祝う
      if (state.pendingGradeUp != null) {
        celebration.gradeUp = state.pendingGradeUp
      }

      return {
        ...state,
        totalClears,
        xp: state.xp + celebration.xpGain,
        daily,
        battle,
        unlockedMonsters,
        pendingGradeUp: null,
        pendingCelebration: celebration
      }
    }

    case 'CLEAR_CELEBRATION':
      return { ...state, pendingCelebration: null }

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

    // 保護者による先取り解放
    case 'FORCE_GRADE_MAX': {
      const gm = Math.max(state.gradeMax, Math.min(MAX_GRADE, action.gradeMax))
      return { ...state, gradeMax: gm }
    }

    case 'SET_SETTING':
      return { ...state, settings: { ...state.settings, [action.key]: action.value } }

    case 'RESET_ALL':
      return createInitialState()

    // 機種変更: 書き出したデータで丸ごと置き換える（上書き）。
    // 明らかにセーブでない中身なら、安全のため何もしない。
    case 'IMPORT_STATE': {
      const data = action.data
      const looksValid =
        data &&
        typeof data === 'object' &&
        (data.version || data.skills || data.unlockedMonsters || data.totalClears != null)
      if (!looksValid) return state
      return normalizeSaved(data)
    }

    default:
      return state
  }
}

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => normalizeSaved(loadState()))

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
