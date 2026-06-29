// ============================================================
// 「かく」分野（指でなぞる文字書き）
//   stage 'trace' : お手本(うすい文字)をなぞる
//   stage 'free'  : お手本なしで自分で書く
// 採点は TracingCanvas が「形をどれだけなぞれたか」で判定（やさしめ）。
//
// 文字はフォントから形を作るので、ここに足すだけで増やせる。
// 小1レベル: ひらがな・カタカナ全部 ＋ 小1漢字まで。
// ============================================================

// ひらがな（書きやすい順 → むずかしい順におおまかに分類）
const HIRA_EASY = ['し', 'つ', 'く', 'へ', 'の', 'こ', 'い', 'り', 'う', 'て', 'と', 'に', 'け']
const HIRA_MID = ['ち', 'さ', 'き', 'た', 'な', 'は', 'ま', 'み', 'も', 'ろ', 'ね', 'れ', 'そ', 'す', 'ひ', 'ほ', 'か', 'よ', 'ら', 'る', 'せ', 'お']
const HIRA_HARD = ['あ', 'ぬ', 'め', 'む', 'を', 'ゆ', 'ふ', 'え', 'わ', 'ん', 'や', 'ま', 'ぽ', 'ぱ', 'び', 'ど', 'ば', 'ず', 'げ']

// カタカナ
const KATA_EASY = ['ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク', 'ケ', 'コ', 'シ', 'ス', 'セ', 'ソ', 'ニ', 'ハ', 'ロ', 'ル', 'レ', 'ト']
const KATA_HARD = ['サ', 'ナ', 'ヌ', 'ネ', 'ホ', 'マ', 'ミ', 'ム', 'メ', 'モ', 'ヤ', 'ユ', 'ヨ', 'ラ', 'リ', 'ワ', 'ヲ', 'ン', 'ツ', 'チ', 'テ', 'ノ', 'フ', 'ヘ']

// 小1の漢字（なぞって書く）
const KANJI = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '大', '小', '上', '下', '中', '山', '川', '木', '火', '水', '月', '日', '人', '口', '目', '手', '力', '王', '子', '女', '男', '田', '石', '花', '虫', '犬', '足', '耳', '空', '雨']

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateWritingQuestion(params) {
  const { level } = params

  let pool
  let kana = 'hira'
  if (level <= 1) pool = HIRA_EASY
  else if (level <= 3) pool = [...HIRA_EASY, ...HIRA_MID]
  else if (level <= 4) pool = [...HIRA_MID, ...HIRA_HARD, ...KATA_EASY]
  else if (level <= 6) {
    // ひらがな全体＋カタカナ
    pool = [...HIRA_HARD, ...KATA_EASY, ...KATA_HARD]
    kana = 'mix'
  } else {
    // 小1漢字も登場
    if (Math.random() < 0.5) { pool = KANJI; kana = 'kanji' }
    else { pool = [...KATA_HARD, ...HIRA_HARD]; kana = 'mix' }
  }

  const target = pick(pool)

  // レベルが上がるほど「自由書き」が増える
  const freeChance = level <= 2 ? 0 : level <= 4 ? 0.25 : level <= 6 ? 0.5 : 0.7
  const stage = Math.random() < freeChance ? 'free' : 'trace'

  return {
    domain: 'kaku',
    type: 'trace',
    target,
    kana,
    stage,
    instruction: stage === 'trace' ? `「${target}」を なぞろう` : `「${target}」を かいてみよう`,
    speak: stage === 'trace' ? `${target}を、ゆびで なぞってね` : `${target}を、じぶんで かいてみよう`,
    answerWord: { text: target }
  }
}
