// ============================================================
// 難易度の自動調整エンジン（分野ごと）
//
// 設計方針（依頼の最重要ポイント）:
//  - 得意分野: 正解が続いたら難易度を上げ、どんどん先へ進める。
//  - 苦手分野: 間違えても責めず、ヒントを増やし段階を細かくする。
//             レベルは下げすぎず、足場（scaffold）を厚くして支える。
//
// 各分野の習熟度は skill オブジェクトで表現する:
//   { level, streak, miss, recent[], correct, attempts }
//   level    : 1.0 以上の連続値。コンテンツの難しさに対応。
//   streak   : 連続正解数。
//   miss     : 直近の連続ミス数（ヒントの厚さに使う）。
//   recent   : 直近の正誤(true/false)。傾向表示に使う。
// ============================================================

export const MIN_LEVEL = 1
export const MAX_LEVEL = 12

// 難易度を上げるには、直近4問のうち3問を「最初の答え」で正解する。
// 2回だけ偶然当たって急に難しくなるのを防ぎ、ほどよい成功率を保つ。
const PROMOTION_WINDOW = 4
const PROMOTION_CORRECT = 3
const DEMOTION_WINDOW = 5
const DEMOTION_MISSES = 3

// 最初から少し歯ごたえのあるレベルで開始する
const START_LEVEL = 2

export function makeSkill() {
  return {
    level: START_LEVEL,
    streak: 0,
    miss: 0,
    recent: [],
    lastLevelUpAt: 0,
    lastLevelDownAt: 0,
    correct: 0,
    attempts: 0
  }
}

/**
 * 1問の結果を skill に反映して新しい skill を返す（イミュータブル）。
 * @param {object} skill
 * @param {boolean} wasCorrect
 * @returns {{skill: object, leveledUp: boolean}}
 */
export function applyResult(skill, wasCorrect) {
  const s = {
    ...skill,
    recent: [...(skill.recent || [])].slice(-(DEMOTION_WINDOW - 1)),
    lastLevelUpAt: skill.lastLevelUpAt || 0,
    lastLevelDownAt: skill.lastLevelDownAt || 0
  }
  s.attempts += 1
  s.recent.push(wasCorrect)
  if (s.recent.length > 10) s.recent.shift()

  let leveledUp = false
  let leveledDown = false
  if (wasCorrect) {
    s.correct += 1
    s.streak += 1
    s.miss = 0
  } else {
    s.streak = 0
    s.miss += 1
    // 1回のミスでは難易度を下げない。直近5問で3回以上つまずいたときだけ、
    // 半段ぶん支えを厚くする（後退感を小さくする）。
  }

  // 直近の窓がそろった時点で判定する。最後の1問が正解／不正解のどちらでも、
  // 「4問中3問」「5問中3回つまずき」を正しく反映する。
  const recent4 = s.recent.slice(-PROMOTION_WINDOW)
  const correct4 = recent4.filter(Boolean).length
  if (
    recent4.length === PROMOTION_WINDOW &&
    correct4 >= PROMOTION_CORRECT &&
    s.attempts - s.lastLevelUpAt >= PROMOTION_WINDOW &&
    s.level < MAX_LEVEL
  ) {
    s.level = Math.min(MAX_LEVEL, s.level + 1)
    s.lastLevelUpAt = s.attempts
    leveledUp = true
  }
  const recent5 = s.recent.slice(-DEMOTION_WINDOW)
  const misses5 = recent5.filter((v) => !v).length
  if (
    recent5.length === DEMOTION_WINDOW &&
    misses5 >= DEMOTION_MISSES &&
    s.attempts - s.lastLevelDownAt >= DEMOTION_WINDOW &&
    s.level > MIN_LEVEL
  ) {
    s.level = Math.max(MIN_LEVEL, Math.round((s.level - 0.5) * 2) / 2)
    s.lastLevelDownAt = s.attempts
    leveledDown = true
  }
  return { skill: s, leveledUp, leveledDown }
}

/**
 * いまヒントをどれくらい手厚くするか。
 * 連続ミスが増えるほど段階を細かくし、足場を厚くする。
 *  0: ヒント無し / 1: 軽いヒント / 2: 強いヒント（最初の文字や色などを強調）
 */
export function hintLevel(skill = {}) {
  const recent5 = (skill.recent || []).slice(-DEMOTION_WINDOW)
  if (recent5.filter((v) => !v).length >= DEMOTION_MISSES) return 2
  if (skill.miss >= 1) return 1
  return 0
}

/**
 * コンテンツ生成に渡す難易度パラメータをレベルから導出する。
 * 分野ごとのジェネレータが参照する共通の「つまみ」。
 */
export function difficultyParams(skill = {}) {
  const lvl = Math.floor(Number.isFinite(skill.level) ? skill.level : START_LEVEL)
  return {
    level: lvl,
    rawLevel: skill.level,
    // 選択肢の数: 最低でも3択。上がると4択でしっかり難しく。
    choiceCount: lvl <= 2 ? 3 : 4,
    // カタカナを早めに混ぜる
    allowKatakana: lvl >= 2,
    // 長め・むずかしめの語を許可するレベル
    allowHard: lvl >= 4,
    hint: hintLevel(skill)
  }
}

// 傾向ラベル（保護者ビュー用）: 得意/ふつう/応援中
export function trendLabel(skill) {
  if (skill.attempts < 4) return 'はじめたばかり'
  const rate = skill.correct / skill.attempts
  if (rate >= 0.85 || skill.level >= 4) return 'とくい！'
  if (rate >= 0.6) return 'いいちょうし'
  return 'おうえん中'
}
