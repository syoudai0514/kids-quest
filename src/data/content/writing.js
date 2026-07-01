// ============================================================
// 「かく」分野（指でなぞる文字書き）
//
// 依頼の「お手本 → なぞり → 自由書き」の3段階を実装:
//   1) お手本: 文字がすーっと浮かび上がるアニメ＋書きはじめの点が光る
//   2) なぞり: うすい文字の上を指でなぞる
//   3) 自由書き: お手本なし（「おてほん」ボタンでチラ見できる）
//
// 復習キュー対応: generateWritingQuestion(params, '字') で再出題。
// 文字はフォントから形を作るので、ここに足すだけで増やせる。
// ============================================================

const HIRA_EASY = ['し', 'つ', 'く', 'へ', 'の', 'こ', 'い', 'り', 'う', 'て', 'と', 'に', 'け']
const HIRA_MID = ['ち', 'さ', 'き', 'た', 'な', 'は', 'ま', 'み', 'も', 'ろ', 'ね', 'れ', 'そ', 'す', 'ひ', 'ほ', 'か', 'よ', 'ら', 'る', 'せ', 'お']
const HIRA_HARD = ['あ', 'ぬ', 'め', 'む', 'を', 'ゆ', 'ふ', 'え', 'わ', 'ん', 'や']
const KATA_EASY = ['ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク', 'ケ', 'コ', 'シ', 'ス', 'セ', 'ソ', 'ニ', 'ハ', 'ロ', 'ル', 'レ', 'ト']
const KATA_HARD = ['サ', 'ナ', 'ヌ', 'ネ', 'ホ', 'マ', 'ミ', 'ム', 'メ', 'モ', 'ヤ', 'ユ', 'ヨ', 'ラ', 'リ', 'ワ', 'ヲ', 'ン', 'ツ', 'チ', 'テ', 'ノ', 'フ', 'ヘ']
const KANJI = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '大', '小', '上', '下', '中', '山', '川', '木', '火', '水', '月', '日', '人', '口', '目', '手', '力', '王', '子', '女', '男', '田', '石', '花', '虫', '犬', '足', '耳', '空', '雨']

const ALL = [...HIRA_EASY, ...HIRA_MID, ...HIRA_HARD, ...KATA_EASY, ...KATA_HARD, ...KANJI]

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function makeQuestion(target, stage) {
  return {
    domain: 'kaku',
    type: 'trace',
    itemKey: target,
    target,
    stage, // 'trace'(お手本つき) | 'free'(自由書き)
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

  const { level } = params
  let pool
  if (level <= 1) pool = HIRA_EASY
  else if (level <= 3) pool = [...HIRA_EASY, ...HIRA_MID]
  else if (level <= 4) pool = [...HIRA_MID, ...HIRA_HARD, ...KATA_EASY]
  else if (level <= 6) pool = [...HIRA_HARD, ...KATA_EASY, ...KATA_HARD]
  else pool = Math.random() < 0.5 ? KANJI : [...KATA_HARD, ...HIRA_HARD]

  const freeChance = level <= 2 ? 0 : level <= 4 ? 0.25 : level <= 6 ? 0.5 : 0.7
  const stage = Math.random() < freeChance ? 'free' : 'trace'
  return makeQuestion(pick(pool), stage)
}
