// ============================================================
// 「かく」分野（指でなぞる文字書き・年長〜小6）
//
// 学年 (params.grade) ごとの文字プール:
//   年長: ひらがな中心 → カタカナ入門
//   小1: カタカナ全部 ＋ 小1漢字（80字）
//   小2〜小6: その学年の漢字（前の学年も少し混ざる）
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
const KATA_HARD = ['サ', 'ナ', 'ヌ', 'ネ', 'ホ', 'マ', 'ミ', 'ム', 'メ', 'モ', 'ヤ', 'ユ', 'ヨ', 'ラ', 'リ', 'ワ', 'ヲ', 'ン', 'ツ', 'チ', 'テ', 'ノ', 'フ', 'ヘ']

const KANJI_G1 = [...'一二三四五六七八九十大小上下中山川木火水月日人口目手力王子女男田石花虫犬足耳空雨右雨円音学気休玉見校糸字車出正生青夕赤千先早村天入年白百文本名立六町左金貝竹草森林']
const KANJI_G2 = KANJI_BY_GRADE[2].map((e) => e.k) // 小2全字
const KANJI_G3 = KANJI_BY_GRADE[3].map((e) => e.k) // 小3全字
const KANJI_G4 = [...'愛案位囲印英塩億加果覚完官願希季喜旗器求救給挙鏡']
const KANJI_G5 = [...'圧移因営応桜恩可価過快解格確刊幹慣基寄規技義逆久']
const KANJI_G6 = [...'異域宇映延沿灰拡革割株干巻看簡危机貴疑吸胸筋系敬']

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

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function makeQuestion(target, stage) {
  return {
    domain: 'kaku',
    type: 'trace',
    itemKey: target,
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
  if (reviewChar && ALL.includes(reviewChar)) {
    return makeQuestion(reviewChar, 'trace')
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
