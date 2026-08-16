// ============================================================
// ゲーム全体の状態管理（Context + Reducer + localStorage 永続化）
//
// v3 で追加したもの:
//   grade / gradeMax : いまの学年 / 解放済みの最高学年（年長0〜小6）。
//                      全分野の平均レベルがマスター基準に達すると次が解放
//   skills[grade]    : 習熟度は学年ごとに別管理（戻っても進んでも保持）
//   conquered        : 「まちがいから おぼえた」累計数（失敗→知識の見える化）
//   srs              : 間隔反復のスケジュール（まちがい→1→3→7→14→30日）
// ============================================================

import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { loadState, saveState, todayKey, migrateContentVersion, profileSnapshot, saveProfileSnapshot } from '../engine/storage.js'
import { makeSkill, applyResult } from '../engine/difficulty.js'
import { buildCoreMission } from '../engine/missions.js'
import { DOMAINS, domainsForGrade } from '../engine/activities.js'
import { getPartner } from '../data/monsters.js'
import { planetUnlockedAt, currentPlanet } from '../data/planets.js'
import { MAX_GRADE } from '../data/grades.js'
import { getWeapon, weaponScore, starterWeaponsFor } from '../data/weapons.js'
import { dayNumber, isDue, scheduleAnswer, scheduleNext, dueCount, migrateMissed } from '../engine/srs.js'
import { DEFAULT_TTS_RATE, migrateTtsRate } from '../config/ttsRates.js'
import { persistentReviewSnapshot } from '../engine/reviewKey.js'
import { advanceEnglishProgress, emptyEnglishProgress, englishDueEntries } from '../engine/englishProgress.js'
import { recordUnitResult, promotionResult, unitLedger, unitReady } from '../engine/learningUnits.js'
import { migrateEnglishWordStats } from '../engine/englishMigration.js'
import { migrateLearningProgress, UNIT_PROGRESS_VERSION } from '../engine/progressMigration.js'
import { grantBattleTicket, normalizeBattleTickets, spendBattleTicket } from '../engine/battleTickets.js'
import { freshDailyMission, lowerGradeProgress } from '../engine/gradeReset.js'
import { activeReviewSrs, activeStatsDomainId } from '../engine/reviewMode.js'
export { activeReviewSrs, activeStatsDomainId } from '../engine/reviewMode.js'

// 1日3戦は自由に遊べる。さらに、教科をやりきる・追加問題を正解すると
// チケットで増えていく。「がんばるほど遊べる」を保ちつつ、以前より
// 遊べる回数が減らないようにしている（連打でチケットを稼ぐ対策は別途）。
const BATTLE_DAILY_LIMIT = 3
// 1回のとっくんで出す上限（溜まりすぎて心が折れないように）
export const REVIEW_BATCH_MAX = 8

// コンテンツの大きな更新で上げる。進捗と開始済みの当日ミッションは保つ。
const CONTENT_VERSION = 15
export const STAR_TRIAL_QUESTIONS = 6
export const STAR_TRIAL_ROUNDS = 2
export const STAR_TRIAL_PASS_CORRECT = 9

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

// 学年マスター進捗（0〜1）: 達成済み必須単元数 / 全必須単元数
export function masteryProgress(state) {
  const ledger = unitLedger(state.grade)
  if (!ledger.length) return 0
  const done = ledger.filter(({ domainId, unitId }) => unitReady(state.unitStats?.[state.grade]?.[domainId]?.[unitId])).length
  return done / ledger.length
}

// きょう復習する問題の数（ホームのバッジ・とっくんの件数）
export function missedCount(state) {
  return dueCount(activeReviewSrs(state)) + englishDueEntries(state, dayNumber()).length
}

// いま そうびしている武器（無ければ null）
export function equippedWeapon(state) {
  return getWeapon(state.equipped)
}

function freshBattle(date, previous = null) {
  return {
    date,
    playsUsed: 0,
    tickets: previous?.tickets || 0,
    // 旧セーブとの区別のため、前の記録がない新規状態には ticketGrants を
    // 置かない。normalizeBattleTickets が旧来の数値 tickets を安全に移行する。
    ...(previous?.ticketGrants ? { ticketGrants: previous.ticketGrants } : {}),
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
    starShards: 0, // バトル由来の収集通貨。成長XPとは分ける。
    rewardProgress: { activityDays: [], eliteWins: 0, battleTutorialsSeen: 0 },
    skills: { 0: freshSkills() },
    srs: {}, // { domainId: { itemKey: {box, due, lapses} } } 間隔反復
    unitStats: {}, // { grade: { domain: { unitId: 学習回数・別日成功 } } }
    // 書字は単元ではなく文字ごと。未経験文字を別の成功で自由書きにしない。
    writingStats: {}, // { 'grade:文字': { attempts, successDays, guideSeen, freeSuccess } }
    // 英語は「別の日に思い出せた」ことを可視化する。録音そのものでは上げない。
    englishWordStats: {},
    englishPhraseStats: {},
    englishAlphabetStats: {},
    // { domainId: { reviewKey: question } }。誤答した問題を同じ形で復習するための保存。
    reviewQuestions: {},
    weapons: ['w01'], // 持っている武器のid（さいしょの1本）
    equipped: 'w01', // そうび中の武器id
    testPassed: {}, // { 学年: { rate, at } } 章末テストの合格記録
    // { 学年: { rounds: [{correct,total,day,at}] } }。「ほしのしれん」の直近2回。
    starTrials: {},
    lessonSeen: {}, // { '学年:教科': 回数 } 授業を見た回数
    domainAccuracy: {}, // { '学年:教科': {c, n} } 直近の正解率（おさらい授業の判定用）
    unlockedMonsters: [partner.id],
    totalClears: 0,
    daily: freshDailyMission(today, 0),
    battle: freshBattle(today),
    // neural は端末の声ではなく、アプリ内で動く女性ナビ音声。
    // showLifeEndTopics: どうとくD視点で「生き物の死」を扱うかの保護者設定。
    // 既定OFF。ONにしない限り、現在の学年（gradeMax ではなく grade）が
    // 5未満のときも一切生成候補に入らない（doutoku.js 側で判定）。
    // mode: 'normal' | 'hard'。保護者のみ変更可（ParentScreen）。既定は
    // 'normal'。settingsForCurrentVersion() が fresh を先に展開するため、
    // 既存セーブにも自動で 'normal' が入る（マイグレーション不要）。
    settings: { tts: true, ttsRate: DEFAULT_TTS_RATE, ttsRateScheme: 'dictionary-v4', ttsVolume: 0.9, ttsVoice: 'neural', sfx: true, bgm: true, showLifeEndTopics: false, mode: 'normal' },
    history: {},
    pendingCelebration: null
  }
}

function settingsForCurrentVersion(savedSettings) {
  const fresh = createInitialState().settings
  const savedRate = migrateTtsRate(savedSettings?.ttsRate)
  // 前版の「はやめ」を新しい「ふつう」にする。保存データには方式名も残し、
  // 次回起動時にもう一段ずつ遅く移行してしまうことを防ぐ。
  const needsDictionaryV4RateMigration = savedSettings?.ttsRateScheme !== 'dictionary-v4'
  const ttsRate = needsDictionaryV4RateMigration
    ? savedRate === 0.9 ? 0.7 : savedRate === 0.7 ? 0.5 : savedRate
    : savedRate
  return {
    ...fresh,
    ...(savedSettings || {}),
    // 以前の「gentle / lively」は同じ端末音声を指していたため、
    // 本物のアプリ専用ナビへ自動移行する。
    ttsVoice: savedSettings?.ttsVoice === 'device' ? 'device' : 'neural',
    ttsRate,
    ttsRateScheme: 'dictionary-v4'
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
    settings: settingsForCurrentVersion(saved.settings),
    xp: saved.xp ?? (saved.totalClears || 0) * 10,
    streak: saved.streak || 0,
    lastActiveDate: saved.lastActiveDate || null,
    srs: migrateMissed(saved.missed),
    partnerColor: saved.partnerColor || 'mint',
    onboarded: saved.onboarded ?? ((saved.totalClears || 0) > 0)
  }
}

// 保存データ（読み込み or インポート）を、いまのバージョンの形に整える。
// v3 はそのまま引き継ぎ、旧 v1/v2 は移行、未知は新規から作る。
function normalizeProfileSaved(saved) {
  let base
  if (saved && saved.version === 3) {
    const fresh = createInitialState()
    base = {
      ...fresh,
      ...saved,
      settings: settingsForCurrentVersion(saved.settings),
      skills: saved.skills && saved.skills[0] ? saved.skills : { 0: freshSkills() },
      srs: saved.srs || migrateMissed(saved.missed),
      reviewQuestions: saved.reviewQuestions || {}, englishWordStats: saved.englishWordStats || {}, englishPhraseStats: saved.englishPhraseStats || {}, englishAlphabetStats: saved.englishAlphabetStats || {}, unitStats: saved.unitStats || {}, writingStats: saved.writingStats || {}
    }
  } else if (saved && (saved.version === 1 || saved.version === 2)) {
    base = migrateOld(saved)
  } else {
    base = createInitialState()
  }
  base = rolloverIfNeeded(base)
  // コンテンツ更新でも、今日すでに始めたミッションは絶対に作り直さない。
  // 進行中の教科・報酬への期待を守り、翌日のロールオーバーで自然に新構成になる。
  if (base.contentVersion !== CONTENT_VERSION) base = migrateContentVersion(base, CONTENT_VERSION)

  // 武器システム導入前のセーブには、これまでのがんばりに見合う武器を手わたす
  //（新機能のせいで「急に敵が強くなった」と感じさせないため）
  //
  // 判定は「保存データに weapons が入っていたか」で行う。
  // base.weapons を見てしまうと、createInitialState() の初期装備 ['w01'] が
  // マージで入ってしまい、遡り付与が一度も発動しない（実際に起きていた不具合）。
  const savedWeapons = Array.isArray(saved?.weapons) ? saved.weapons : null
  if (!savedWeapons || savedWeapons.length === 0) {
    const caught = (base.unlockedMonsters || []).length
    const granted = starterWeaponsFor(caught, partnerLevel(base.xp || 0))
    // すでに持っていた分があれば失わないように合成する
    const merged = [...new Set([...(savedWeapons || []), ...granted])]
    const best = merged.reduce(
      (acc, id) => (weaponScore(getWeapon(id)) > weaponScore(getWeapon(acc)) ? id : acc),
      merged[0]
    )
    base = { ...base, weapons: merged, equipped: best }
  } else {
    base = { ...base, weapons: savedWeapons }
  }
  if (!base.equipped || !base.weapons.includes(base.equipped)) {
    base = { ...base, equipped: base.weapons[0] || null }
  }

  // v4で増えた項目を、古いセーブにも用意する
  if (!base.srs || typeof base.srs !== 'object') {
    base = { ...base, srs: migrateMissed(base.missed) }
  }
  if (!base.reviewQuestions || typeof base.reviewQuestions !== 'object') {
    base = { ...base, reviewQuestions: {} }
  }
  if (!base.englishWordStats || typeof base.englishWordStats !== 'object') base = { ...base, englishWordStats: {} }
  if (!base.englishPhraseStats || typeof base.englishPhraseStats !== 'object') base = { ...base, englishPhraseStats: {} }
  if (!base.englishAlphabetStats || typeof base.englishAlphabetStats !== 'object') base = { ...base, englishAlphabetStats: {} }
  if (!base.unitStats || typeof base.unitStats !== 'object') base = { ...base, unitStats: {} }
  if (!base.writingStats || typeof base.writingStats !== 'object') base = { ...base, writingStats: {} }
  // v15: 選択肢順を含んだ旧itemKeyはdistinctItemsに使わない。過去の回数・
  // 解放済み学年は守り、現在学年だけ新しい安定knowledgeIdで再確認する。
  if ((base.unitProgressVersion || 0) < UNIT_PROGRESS_VERSION) {
    base = migrateLearningProgress(base)
  }
  // 旧コンテンツ版だけで ew173 は star だった。現行では diamond なので、
  // 現行保存を毎回 star に移し替えて消すことは絶対にしない。
  if ((saved?.contentVersion || 0) > 0 && (saved?.contentVersion || 0) < 13 && base.englishWordStats.ew173) {
    base = { ...base, englishWordStats: migrateEnglishWordStats(base.englishWordStats, saved.contentVersion) }
    base = { ...base, englishMigrationVersion: 1 }
  }
  if (base.missed) {
    // 旧形式は取り込み済みなので落とす（保存サイズを増やさない）
    const { missed, ...rest } = base
    base = rest
  }
  if (!base.testPassed) base = { ...base, testPassed: {} }
  if (!base.starTrials || typeof base.starTrials !== 'object') base = { ...base, starTrials: {} }
  if (!base.lessonSeen) base = { ...base, lessonSeen: {} }
  if (!base.domainAccuracy) base = { ...base, domainAccuracy: {} }
  if (typeof base.starShards !== 'number') base = { ...base, starShards: 0 }
  if (!base.rewardProgress || !Array.isArray(base.rewardProgress.activityDays)) {
    // 過去のセーブは武器・進捗を維持し、これからの学習日だけ新しい宝箱ペースで数える。
    base = { ...base, rewardProgress: { activityDays: [], eliteWins: 0, battleTutorialsSeen: 0 } }
  }
  base = {
    ...base,
    rewardProgress: {
      activityDays: base.rewardProgress.activityDays,
      eliteWins: base.rewardProgress.eliteWins || 0,
      battleTutorialsSeen: base.rewardProgress.battleTutorialsSeen || 0
    }
  }
  base = {
    ...base,
    daily: { ...freshDailyMission(base.daily?.date || todayKey(), base.grade || 0), ...(base.daily || {}) },
    battle: { ...freshBattle(base.battle?.date || todayKey()), ...(base.battle || {}), dailyLimit: BATTLE_DAILY_LIMIT }
  }
  base = { ...base, battle: normalizeBattleTickets(base.battle, todayKey()) }
  // すでに先の学年へ進んでいた子が、テスト制になって戻されないようにする
  //（これまでの解放は そのまま みとめる）
  if (base.gradeMax > 0) {
    const tp = { ...base.testPassed }
    for (let g = 0; g < base.gradeMax; g++) {
      if (!tp[g]) tp[g] = { rate: 1, passed: true, at: base.createdAt || Date.now(), grandfathered: true }
    }
    base = { ...base, testPassed: tp }
  }
  return base
}

// v12: 既存の単一セーブを最初の子どもプロフィールとして包む。
// 各プロフィールは完全なゲーム状態を持つので、学年・図鑑・コイン・連続記録・
// 英語復習・当日ミッションが兄弟姉妹間で混ざらない。
export function normalizeSaved(saved) {
  const envelope = saved?.profiles && typeof saved.profiles === 'object' ? saved : null
  const activeProfileId = envelope?.activeProfileId && envelope.profiles[envelope.activeProfileId]
    ? envelope.activeProfileId
    : 'child-1'
  const activeSaved = envelope ? envelope.profiles[activeProfileId]?.state : saved
  const base = normalizeProfileSaved(activeSaved)
  const profiles = { ...(envelope?.profiles || {}) }
  const oldProfile = profiles[activeProfileId]
  profiles[activeProfileId] = {
    name: oldProfile?.name || 'ぼうけんしゃ 1',
    state: profileSnapshot(base)
  }
  return { ...base, activeProfileId, profiles }
}

// その教科は「おさらい授業」を出したほうがよいか（直近の正解率が低い）
export const REVIEW_LESSON_RATE = 0.6
export function needsReviewLesson(state, domainId, grade = state.grade) {
  const a = state.domainAccuracy?.[`${grade}:${domainId}`]
  if (!a || a.n < 5) return false
  return a.c / a.n < REVIEW_LESSON_RATE
}

// この学年の章末テストに合格しているか
export function isGradePassed(state, grade) {
  return !!state.testPassed?.[grade]?.passed
}

// 「ほしのしれん」の進行。1日6問、直近2回＝12問中9問でクリア。
export function starTrialInfo(state, grade = state.grade) {
  const rounds = state.starTrials?.[grade]?.rounds || []
  const relevant = rounds.slice(-STAR_TRIAL_ROUNDS)
  const correct = relevant.reduce((sum, r) => sum + (r.correct || 0), 0)
  const total = relevant.reduce((sum, r) => sum + (r.total || 0), 0)
  const last = relevant[relevant.length - 1]
  return {
    rounds: relevant,
    correct,
    total,
    remainingRounds: Math.max(0, STAR_TRIAL_ROUNDS - relevant.length),
    todayDone: last?.day === dayNumber(),
    passed: promotionResult(state, grade).passed
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
  return {
    ...state,
    history,
    daily: freshDailyMission(today, state.grade || 0),
    battle: normalizeBattleTickets(freshBattle(today, state.battle), today)
  }
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

function reduceProfile(state, action) {
  switch (action.type) {
    case 'ROLLOVER':
      return rolloverIfNeeded(state)

    case 'ONBOARD':
      return { ...state, onboarded: true, partnerColor: action.color || 'mint' }

    case 'SET_GRADE': {
      const g = Math.max(0, Math.min(state.gradeMax, action.grade))
      if (g === state.grade) return state
      // 学年で教科の構成が変わる（生活→理科・社会など）ので、
      // 今日のミッションを その学年の教科で作り直す（進んだ数はそのまま）
      const tasks = buildCoreMission(g)
      return {
        ...state,
        grade: g,
        skills: state.skills[g] ? state.skills : { ...state.skills, [g]: freshSkills() },
        daily: {
          ...state.daily,
          coreTasks: tasks,
          coreIndex: Math.min(state.daily.coreIndex, tasks.length),
          coreDone: state.daily.coreIndex >= tasks.length
        }
      }
    }

    // 1問の回答結果
    // まちがい → 復習キューへ（あとで「とっくん」で克服できる）
    // 復習キューにあった問題に正解 → キューから外れ、ボーナスXP＋克服数が増える
    //   ＝「失敗から学ぶと知っていることが増える」を数字と演出で見せる
    case 'ANSWER': {
      const { domainId, correct, itemKey, unitId } = action
      const grade = state.grade
      // むずかしいモードの問題は、生のitemKeyが 'hard:' から始まる
      // （suuji等でknowledgeIdが 'skill:hard:math:xxx' に変形されても
      // action.question.itemKey には元の値が残る）。通常の習熟度・SRS・
      // 単元進捗・おさらい判定に一切混ざらないよう、statsIdだけ
      // 'hard:${domainId}' に切り替える（計画書§4.2(d)(f)）。
      const isHard = String(action.question?.itemKey || itemKey || '').startsWith('hard:')
      const statsId = isHard ? `hard:${domainId}` : domainId
      const gradeSkills = skillsForGrade(state)
      const skill = gradeSkills[statsId] || makeSkill()
      const { skill: newSkill } = applyResult(skill, correct)
      const newGradeSkills = { ...gradeSkills, [statsId]: newSkill }

      const today = todayKey()
      let streak = state.streak
      let lastActiveDate = state.lastActiveDate
      if (lastActiveDate !== today) {
        streak = lastActiveDate === yesterdayKey() ? streak + 1 : 1
        lastActiveDate = today
      }

      // 間隔反復（ライトナー方式）
      //   まちがえた   → その日のうちに もう一度（box0）
      //   期限の来た問題に正解 → 次に会う日を のばす（1→3→7→14→30日）
      //   最高boxに到達 → 「完全に自分のものになった」= conquered
      let srs = state.srs
      const unitStats = recordUnitResult(state.unitStats, grade, statsId, unitId, correct, dayNumber(), itemKey)
      let reviewQuestions = state.reviewQuestions || {}
      let conquered = state.conquered
      let xpGain = correct ? 2 : 0
      // 通常の英語は englishWordStats 等の専用スケジューラで管理するため、
      // ここのsrsは使わない。ただしhardえいご文法は語彙・会話のような
      // 個別スケジューラを持たない固定バンクなので、りか/しゃかいのhardと
      // 同じ一般的なsrs（間隔反復）にのせる（isHardはitemKeyの'hard:'接頭辞
      // から上で判定済み。統計名前空間も既に'hard:english'に分離されている）。
      if (itemKey && (domainId !== 'english' || isHard)) {
        const day = dayNumber()
        const byKey = srs[statsId] || {}
        const prev = byKey[itemKey]
        const wasDue = isDue(prev, day) // 復習として出ていた問題か
        {
          const { entry, mastered } = scheduleAnswer(prev, correct, day)
          srs = { ...srs, [statsId]: { ...byKey, [itemKey]: entry } }
          // 固定知識は同じ設問を保存する。算数は skillId から別の類題を作るため、
          // 計算式そのものは保存しない。
          if (action.question && domainId !== 'suuji') {
            const snapshot = persistentReviewSnapshot(domainId, action.question, itemKey)
            if (snapshot) {
              reviewQuestions = {
                ...reviewQuestions,
                [statsId]: { ...reviewQuestions[statsId], [itemKey]: snapshot }
              }
            }
          }
          // むずかしいモードは正解しても conquered（図鑑コンプ演出）や
          // 期限復習ボーナスXPの対象にしない。報酬設計は変更しない
          // （計画書§4.2(f)・§9）が、参加のごほうびとして基礎XPは出す。
          if (!isHard && correct && wasDue) {
            xpGain += 4 // まちがいを ちからに かえたボーナス
            if (mastered) conquered += 1
          }
        }
      }

      // 英語単語は 1→3→7→14日。日をまたがない連打では段階を進めない。
      let englishWordStats = state.englishWordStats || {}
      let englishPhraseStats = state.englishPhraseStats || {}
      let englishAlphabetStats = state.englishAlphabetStats || {}
      if (domainId === 'english' && !isHard && action.englishItemKey) {
        const rawKey = String(action.englishItemKey).split('#')[0]
        const isPhrase = rawKey.startsWith('enp:') || rawKey.startsWith('eng:')
        const isAlphabet = rawKey.startsWith('ena:')
        const key = rawKey.replace(/^(?:en[wap]?|eng):/, '')
        const stats = isAlphabet ? englishAlphabetStats : isPhrase ? englishPhraseStats : englishWordStats
        const prevStat = stats[key] || emptyEnglishProgress(dayNumber())
        const todayDay = dayNumber()
        const next = advanceEnglishProgress(prevStat, correct, todayDay)
        if (isAlphabet) englishAlphabetStats = { ...englishAlphabetStats, [key]: next }
        else if (isPhrase) englishPhraseStats = { ...englishPhraseStats, [key]: next }
        else englishWordStats = { ...englishWordStats, [key]: next }
      }

      let writingStats = state.writingStats || {}
      if (domainId === 'kaku' && action.question?.target) {
        const key = `${grade}:${action.question.target}`
        const prev = writingStats[key] || { attempts: 0, successDays: [], guideSeen: false, freeSuccess: false }
        const day = dayNumber()
        const successDays = correct && !prev.successDays.includes(day) ? [...prev.successDays, day].slice(-12) : prev.successDays
        writingStats = { ...writingStats, [key]: {
          ...prev, attempts: prev.attempts + 1, successDays,
          guideSeen: prev.guideSeen || action.question.stage === 'trace',
          freeSuccess: prev.freeSuccess || (correct && action.question.stage === 'free' && prev.successDays.some((d) => d < day))
        } }
      }

      // v4: 学年の解放は「章末テストの合格」で行うので、ここでは解放しない
      //（メーターは いまどれくらい仕上がっているかの めやす表示に使う）

      // 教科ごとの直近の正解率（「おさらい授業」を出すかの判定に使う）
      const accKey = `${grade}:${statsId}`
      const prevAcc = state.domainAccuracy[accKey] || { c: 0, n: 0 }
      let acc = { c: prevAcc.c + (correct ? 1 : 0), n: prevAcc.n + 1 }
      if (acc.n > 20) acc = { c: Math.round(acc.c / 2), n: Math.round(acc.n / 2) } // 直近を重く見る

      return {
        ...state,
        domainAccuracy: { ...state.domainAccuracy, [accKey]: acc },
        skills: { ...state.skills, [grade]: newGradeSkills },
        xp: state.xp + xpGain,
        streak,
        lastActiveDate,
        srs,
        unitStats,
        writingStats,
        englishWordStats,
        englishPhraseStats,
        englishAlphabetStats,
        reviewQuestions,
        conquered,
        daily: {
          ...state.daily,
          correctToday: state.daily.correctToday + (correct ? 1 : 0),
          attemptsToday: state.daily.attemptsToday + 1,
          perDomainToday: addDomainTally(state.daily.perDomainToday, domainId, correct)
        }
      }
    }

    case 'ENGLISH_SPEAKING_DONE': {
      const rawKey = String(action.itemKey || '').split('#')[0]
      if (rawKey.startsWith('ena:')) return state
      const isPhrase = rawKey.startsWith('enp:')
      const key = rawKey.replace(/^en[wp]?:/, '')
      if (!key) return state
      const stats = isPhrase ? state.englishPhraseStats : state.englishWordStats
      const prev = stats?.[key] || emptyEnglishProgress(dayNumber())
      const next = { ...stats, [key]: { ...prev, speakingCount: (prev.speakingCount || 0) + 1 } }
      return isPhrase ? { ...state, englishPhraseStats: next } : { ...state, englishWordStats: next }
    }

    // タスク（数問のまとまり）をクリア → ごほうび進行
    case 'CLEAR_TASK': {
      const { kind } = action
      const totalClears = state.totalClears + 1

      let daily = { ...state.daily, tasksClearedToday: state.daily.tasksClearedToday + 1 }
      let battle = state.battle
      const activeDays = state.rewardProgress?.activityDays || []
      const today = todayKey()
      const rewardProgress = activeDays.includes(today)
        ? state.rewardProgress
        : { ...state.rewardProgress, activityDays: [...activeDays, today] }
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
        // 1日3戦は自由。2教科・5教科を終えると追加戦を1回ずつ解放する。
        // 「正解数」ではなく教科を最後までやった行動に対して渡すので、連打の近道にならない。
        if ([2, state.daily.coreTasks.length].includes(coreIndex) && !(daily.battleUnlocks || []).includes(coreIndex)) {
          battle = grantBattleTicket(battle, todayKey())
          daily = {
            ...daily,
            ticketsEarnedToday: daily.ticketsEarnedToday + 1,
            battleUnlocks: [...(daily.battleUnlocks || []), coreIndex]
          }
          celebration.ticket = true
          celebration.ticketMessage = coreIndex === 2
            ? '2つの きょうかを がんばったから、ついかバトルが あそべるよ！'
            : 'きょうの きょうかを ぜんぶ がんばったから、ついかバトルが あそべるよ！'
        }
      } else if (kind === 'okawari') {
        daily = { ...daily, okawariIndex: state.daily.okawariIndex + 1 }
      } else if (kind === 'extra') {
        // 追加問題は「あと1枚ほしい」が、そのまま学習の動機になる場所にする。
        // 3問中2問以上を自力で解けたら1枚。考えて間違えたことは減点しない。
        // ただし、出題直後の誤答を繰り返す連打だけは、手持ちから1枚減らす。
        // 能力ではなく行動だけを調整するため、苦手でも安心して取り組める。
        daily = { ...daily, extraIndex: state.daily.extraIndex + 1 }
        const acc = typeof action.accuracy === 'number' ? action.accuracy : 0
        if (action.suspicious) {
          const lost = Math.min(1, battle.tickets)
          battle = lost ? spendBattleTicket(battle, todayKey()) : battle
          celebration.ticketPenalty = lost > 0 ? lost : 0
          celebration.ticketReason = lost > 0
            ? 'はやおしが つづいたから、チケットが 1まい へったよ'
            : 'はやおしが つづいたから、こんかいは チケットなしだよ'
          celebration.xpGain = 1
        } else if (acc >= 2 / 3) {
          battle = grantBattleTicket(battle, todayKey())
          daily = { ...daily, ticketsEarnedToday: daily.ticketsEarnedToday + 1 }
          celebration.ticket = true
          celebration.ticketMessage = '3もん中 2もん できた！ バトルチケットを ゲット！'
        } else {
          celebration.ticketReason = 'あと 1もん できたら チケットだったよ！ また ちょうせんしよう'
        }
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
        rewardProgress,
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
        return {
          ...state,
          battle: { ...b, playsUsed: b.playsUsed + 1 },
          rewardProgress: {
            ...state.rewardProgress,
            battleTutorialsSeen: (state.rewardProgress?.battleTutorialsSeen || 0) + 1
          }
        }
      }
      if (b.tickets > 0) {
        return {
          ...state,
          battle: spendBattleTicket(b, todayKey()),
          rewardProgress: {
            ...state.rewardProgress,
            battleTutorialsSeen: (state.rewardProgress?.battleTutorialsSeen || 0) + 1
          }
        }
      }
      return state
    }

    case 'BATTLE_WON': {
      const b = state.battle
      const caught = action.caughtId && !state.unlockedMonsters.includes(action.caughtId)
      const shardGain = action.elite ? 12 : 6

      // 武器ドロップ。今のそうびより強ければ自動でそうびする
      //（小さい子が メニューを行き来しなくても 強くなれるように）
      let weapons = state.weapons
      let equipped = state.equipped
      if (action.weaponId && !weapons.includes(action.weaponId)) {
        weapons = [...weapons, action.weaponId]
        const got = getWeapon(action.weaponId)
        if (weaponScore(got) > weaponScore(getWeapon(equipped))) equipped = action.weaponId
      }

      return {
        ...state,
        starShards: state.starShards + shardGain,
        rewardProgress: {
          ...state.rewardProgress,
          eliteWins: (state.rewardProgress?.eliteWins || 0) + (action.elite ? 1 : 0)
        },
        weapons,
        equipped,
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

    // ミッションでやる教科を えらぶ（順番の入れかえだけ）。
    // 全教科をひととおり やる のは変わらないので バランスは保たれる。
    case 'PICK_CORE_TASK': {
      const { coreTasks, coreIndex } = state.daily
      const i = action.index
      if (i == null || i < coreIndex || i >= coreTasks.length || i === coreIndex) return state
      const next = [...coreTasks]
      ;[next[coreIndex], next[i]] = [next[i], next[coreIndex]]
      return { ...state, daily: { ...state.daily, coreTasks: next } }
    }

    case 'EQUIP_WEAPON': {
      if (!state.weapons.includes(action.weaponId)) return state
      return { ...state, equipped: action.weaponId }
    }

    // 保護者向け: 武器を整理する。そうび中のものを消したときは、
    // 残っている先頭の武器へ自動で持ち替える（武器ゼロでも安全に戦える）。
    case 'REMOVE_WEAPON': {
      if (!state.weapons.includes(action.weaponId)) return state
      const weapons = state.weapons.filter((id) => id !== action.weaponId)
      const equipped = state.equipped === action.weaponId ? weapons[0] || null : state.equipped
      return { ...state, weapons, equipped }
    }

    // 章末テストの結果。合格したら次の学年を解放する（v4の解放条件）
    case 'CHAPTER_TEST_RESULT': {
      const g = action.grade
      const prev = state.testPassed[g]
      const best = Math.max(prev?.rate || 0, action.rate)
      const testPassed = {
        ...state.testPassed,
        [g]: { rate: best, passed: (prev?.passed || false) || action.passed, at: Date.now() }
      }
      let gradeMax = state.gradeMax
      let pendingGradeUp = state.pendingGradeUp
      if (action.passed && g >= state.gradeMax && state.gradeMax < MAX_GRADE) {
        gradeMax = g + 1
        pendingGradeUp = g + 1
      }
      // 章末テストの誤答も、必ずとっくんに入れる。
      // 画面だけ「入ったよ」と言って実際には保存しない、という不一致を防ぐ。
      let srs = state.srs
      let reviewQuestions = state.reviewQuestions || {}
      const today = dayNumber()
      for (const result of action.results || []) {
        if (result.correct || !result.domainId || !result.itemKey) continue
        const byKey = srs[result.domainId] || {}
        const { entry } = scheduleNext(byKey[result.itemKey], false, today)
        srs = { ...srs, [result.domainId]: { ...byKey, [result.itemKey]: entry } }
        const snapshot = persistentReviewSnapshot(result.domainId, result.question, result.itemKey)
        if (snapshot) {
          reviewQuestions = {
            ...reviewQuestions,
            [result.domainId]: { ...reviewQuestions[result.domainId], [result.itemKey]: snapshot }
          }
        }
      }
      return { ...state, testPassed, gradeMax, pendingGradeUp, srs, reviewQuestions }
    }

    // ほしのしれん: 6問ずつを別日に行い、直近2回の合計で判定する。
    case 'STAR_TRIAL_RESULT': {
      const g = action.grade
      const round = {
        correct: action.correct || 0,
        total: action.total || STAR_TRIAL_QUESTIONS,
        correctDomains: [...new Set((action.results || []).filter((r) => r.correct && ['yomu', 'kaku', 'suuji', 'seikatsu', 'rika', 'shakai'].includes(r.domainId)).map((r) => r.domainId))],
        unitIds: [...new Set((action.results || []).map((r) => r.unitId).filter(Boolean))],
        day: dayNumber(),
        at: Date.now()
      }
      const oldRounds = state.starTrials?.[g]?.rounds || []
      const rounds = [...oldRounds, round].slice(-STAR_TRIAL_ROUNDS)
      const result = promotionResult({ ...state, starTrials: { ...state.starTrials, [g]: { rounds: oldRounds.slice(-1) } } }, g, round)
      const { correct, total, passed } = result
      const starTrials = { ...state.starTrials, [g]: { rounds } }

      let testPassed = state.testPassed
      let gradeMax = state.gradeMax
      let pendingGradeUp = state.pendingGradeUp
      if (passed) {
        const prev = state.testPassed[g]
        const rate = correct / total
        testPassed = {
          ...state.testPassed,
          [g]: { rate: Math.max(prev?.rate || 0, rate), passed: true, at: Date.now(), starTrial: true }
        }
        if (g >= state.gradeMax && state.gradeMax < MAX_GRADE) {
          gradeMax = g + 1
          pendingGradeUp = g + 1
        }
      }

      // しれん中の誤答も、必ずとっくんに残す。
      let srs = state.srs
      let reviewQuestions = state.reviewQuestions || {}
      for (const result of action.results || []) {
        if (result.correct || !result.domainId || !result.itemKey) continue
        const byKey = srs[result.domainId] || {}
        const { entry } = scheduleNext(byKey[result.itemKey], false, round.day)
        srs = { ...srs, [result.domainId]: { ...byKey, [result.itemKey]: entry } }
        const snapshot = persistentReviewSnapshot(result.domainId, result.question, result.itemKey)
        if (snapshot) {
          reviewQuestions = {
            ...reviewQuestions,
            [result.domainId]: { ...reviewQuestions[result.domainId], [result.itemKey]: snapshot }
          }
        }
      }
      return { ...state, starTrials, testPassed, gradeMax, pendingGradeUp, srs, reviewQuestions }
    }

    // 授業を見た記録（何回目かで 見せる授業を変える）
    case 'LESSON_SEEN': {
      const key = `${action.grade}:${action.domainId}`
      return {
        ...state,
        lessonSeen: { ...state.lessonSeen, [key]: (state.lessonSeen[key] || 0) + 1 }
      }
    }

    // 保護者による先取り解放
    case 'FORCE_GRADE_MAX': {
      const gm = Math.max(state.gradeMax, Math.min(MAX_GRADE, action.gradeMax))
      return { ...state, gradeMax: gm }
    }

    // 保護者が解放しすぎた学年を戻す。
    // 「まぐれ・大人に聞いた」で先へ進んでしまい、実力と学年が合わなく
    // なったときに、今の力に合うところまで下げ直すための操作。
    // 進捗（XP・図鑑・そうび・とっくん）は消さない。
    case 'LOWER_GRADE_MAX': {
      return lowerGradeProgress(state, action.gradeMax)
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

function reducer(state, action) {
  if (action.type === 'IMPORT_STATE') return normalizeSaved(action.data)
  if (action.type === 'RESET_ALL') return normalizeSaved(createInitialState())
  if (action.type === 'CREATE_PROFILE') {
    const id = `child-${Date.now().toString(36)}`
    const fresh = createInitialState()
    const profiles = {
      ...saveProfileSnapshot(state.profiles, state.activeProfileId || 'child-1', state.profiles?.[state.activeProfileId]?.name || 'ぼうけんしゃ 1', state),
      [id]: { name: String(action.name || '').trim() || `ぼうけんしゃ ${Object.keys(state.profiles || {}).length + 1}`, state: profileSnapshot(fresh) }
    }
    return { ...fresh, activeProfileId: id, profiles }
  }
  if (action.type === 'SWITCH_PROFILE') {
    const target = state.profiles?.[action.profileId]
    if (!target?.state || action.profileId === state.activeProfileId) return state
    const next = normalizeProfileSaved(target.state)
    const profiles = {
      ...state.profiles,
      [state.activeProfileId]: { ...state.profiles[state.activeProfileId], state: profileSnapshot(state) },
      [action.profileId]: { ...target, state: profileSnapshot(next) }
    }
    return { ...next, activeProfileId: action.profileId, profiles }
  }
  if (action.type === 'RENAME_PROFILE') {
    const id = action.profileId || state.activeProfileId
    const old = state.profiles?.[id]
    const name = String(action.name || '').trim()
    if (!old || !name) return state
    return { ...state, profiles: { ...state.profiles, [id]: { ...old, name } } }
  }
  const next = reduceProfile(state, action)
  const activeProfileId = state.activeProfileId || 'child-1'
  const profiles = saveProfileSnapshot(state.profiles, activeProfileId, state.profiles?.[activeProfileId]?.name || 'ぼうけんしゃ 1', next)
  return { ...next, activeProfileId, profiles }
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
