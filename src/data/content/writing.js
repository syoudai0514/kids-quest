// ============================================================
// 「かく」分野（指でなぞる文字書き・年長〜小6）
//
// 学年 (params.grade) ごとの文字プール:
//   年長: ひらがな中心 → カタカナ入門
//   小1: カタカナ全部 ＋ 小1収録漢字
//   小2〜小6: その学年の収録漢字（前の学年も少し混ざる）
//
// 全文字に KanjiVG 由来の正確な書き順データがある（strokeOrder.js）。
// 復習: generateWritingQuestion(params, '字') で再出題。
// ============================================================

import { hasStrokeData } from '../strokeOrder.js'
import { KANJI_BY_GRADE } from '../kanjiByGrade.js'

const HIRA_EASY = ['し', 'つ', 'く', 'へ', 'の', 'こ', 'い', 'り', 'う', 'て', 'と', 'に', 'け']
const HIRA_MID = ['ち', 'さ', 'き', 'た', 'な', 'は', 'ま', 'み', 'も', 'ろ', 'ね', 'れ', 'そ', 'す', 'ひ', 'ほ', 'か', 'よ', 'ら', 'る', 'せ', 'お']
const HIRA_HARD = ['あ', 'ぬ', 'め', 'む', 'を', 'ゆ', 'ふ', 'え', 'わ', 'ん', 'や']
const KATA_EASY = ['ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク', 'ケ', 'コ', 'シ', 'ス', 'セ', 'ソ', 'ニ', 'ハ', 'ロ', 'ル', 'レ', 'ト']
const KATA_HARD = ['サ', 'タ', 'ナ', 'ヌ', 'ネ', 'ヒ', 'ホ', 'マ', 'ミ', 'ム', 'メ', 'モ', 'ヤ', 'ユ', 'ヨ', 'ラ', 'リ', 'ワ', 'ヲ', 'ン', 'ツ', 'チ', 'テ', 'ノ', 'フ', 'ヘ']

const KANJI_G1 = KANJI_BY_GRADE[1].map((e) => e.k) // 小1の収録漢字を一元参照
const KANJI_G2 = KANJI_BY_GRADE[2].map((e) => e.k) // 小2全字
const KANJI_G3 = KANJI_BY_GRADE[3].map((e) => e.k) // 小3全字
// 小2〜小6も kanjiByGrade を唯一の収録元にする。完全配当ではなく、
// このアプリに収録している漢字の練習であることを画面とREADMEで明示する。
const KANJI_G4 = KANJI_BY_GRADE[4].map((e) => e.k)
const KANJI_G5 = KANJI_BY_GRADE[5].map((e) => e.k)
const KANJI_G6 = KANJI_BY_GRADE[6].map((e) => e.k)

// 書き順データがある文字だけに絞る（安全策）
const safe = (arr) => [...new Set(arr)].filter(hasStrokeData)

const POOLS = {
  0: [
    safe(HIRA_EASY),
    safe([...HIRA_EASY, ...HIRA_MID]),
    safe([...HIRA_MID, ...HIRA_HARD]),
    safe([...HIRA_HARD, ...KATA_EASY])
  ],
  1: [
    safe([...KATA_EASY, ...HIRA_HARD]),
    safe([...KATA_EASY, ...KATA_HARD]),
    safe([...KATA_HARD, ...KANJI_G1.slice(0, 30)]),
    safe(KANJI_G1)
  ],
  2: [safe([...KANJI_G1.slice(30), ...KANJI_G2.slice(0, 15)]), safe(KANJI_G2), safe(KANJI_G2), safe(KANJI_G2)],
  3: [safe([...KANJI_G2.slice(0, 12), ...KANJI_G3.slice(0, 15)]), safe(KANJI_G3), safe(KANJI_G3), safe(KANJI_G3)],
  4: [safe([...KANJI_G3.slice(0, 10), ...KANJI_G4.slice(0, 12)]), safe(KANJI_G4), safe(KANJI_G4), safe(KANJI_G4)],
  5: [safe([...KANJI_G4.slice(0, 10), ...KANJI_G5.slice(0, 12)]), safe(KANJI_G5), safe(KANJI_G5), safe(KANJI_G5)],
  6: [safe([...KANJI_G5.slice(0, 10), ...KANJI_G6.slice(0, 12)]), safe(KANJI_G6), safe(KANJI_G6), safe(KANJI_G6)]
}

const ALL = safe([
  ...HIRA_EASY, ...HIRA_MID, ...HIRA_HARD, ...KATA_EASY, ...KATA_HARD,
  ...KANJI_G1, ...KANJI_G2, ...KANJI_G3, ...KANJI_G4, ...KANJI_G5, ...KANJI_G6
])

function groups(chars, prefix) {
  const safeChars = safe(chars)
  const out = []
  for (let i = 0; i < safeChars.length; i += 15) out.push({ id: `${prefix}-${Math.floor(i / 15) + 1}`, chars: safeChars.slice(i, i + 15) })
  return out
}

// 単元達成を2文字で通過させないため、10〜20文字の小グループで管理する。
export const WRITING_GROUPS_BY_GRADE = {
  0: [...groups([...HIRA_EASY, ...HIRA_MID, ...HIRA_HARD], 'hiragana'), ...groups([...KATA_EASY, ...KATA_HARD], 'katakana')],
  1: [...groups([...HIRA_EASY, ...HIRA_MID, ...HIRA_HARD], 'hiragana'), ...groups([...KATA_EASY, ...KATA_HARD], 'katakana'), ...groups(KANJI_G1, 'kanji')],
  2: groups(KANJI_G2, 'kanji'), 3: groups(KANJI_G3, 'kanji'), 4: groups(KANJI_G4, 'kanji'), 5: groups(KANJI_G5, 'kanji'), 6: groups(KANJI_G6, 'kanji')
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function makeQuestion(target, stage) {
  return {
    domain: 'kaku',
    type: 'trace',
    itemKey: `k:${target}`,
    target,
    stage,
    instruction: stage === 'trace' ? `「${target}」を なぞろう` : `「${target}」を かいてみよう`,
    speak:
      stage === 'trace'
        ? `${target}。 よく みててね`
        : `${target}を、じぶんの ちからで かいてみよう`,
    answerWord: { text: target }
  }
}

export function generateWritingQuestion(params, reviewChar = null) {
  // 復習: 前につまずいた文字は、お手本つきでもう一度
  const requested = String(reviewChar || '').replace(/^k:/, '')
  if (requested && ALL.includes(requested)) {
    return makeQuestion(requested, 'trace')
  }

  const grade = Math.max(0, Math.min(6, params.grade || 0))
  const { level } = params
  const tiers = POOLS[grade]
  // レベル 1-12 を 4段階のプールに割り当て
  const tierIdx = level <= 2 ? 0 : level <= 4 ? 1 : level <= 7 ? 2 : 3
  const pool = tiers[tierIdx].length ? tiers[tierIdx] : tiers.flat()

  const freeChance = level <= 2 ? 0 : level <= 4 ? 0.25 : level <= 7 ? 0.5 : 0.7
  const stage = Math.random() < freeChance ? 'free' : 'trace'
  return makeQuestion(pick(pool), stage)
}
