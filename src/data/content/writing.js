// ============================================================
// 「かく」分野のコンテンツ（指でなぞる文字書き）
//
// ペンが無いので、指でのトレース方式。
//   stage 'trace' : お手本(うすい文字)をなぞる
//   stage 'free'  : お手本なしで自分で書く（自由書き）
// 採点は TracingCanvas が「お手本の形をどれだけなぞれたか」で判定（やさしめ）。
//
// 難易度 params.level で、文字の難しさと stage を変える。
// 追加方法: 各プールに文字を足すだけ。
// ============================================================

// 画数が少なく書きやすい順 → だんだん難しく
const HIRA_EASY = ['し', 'つ', 'く', 'へ', 'の', 'こ', 'い', 'り', 'う', 'て']
const HIRA_MID = ['ち', 'さ', 'き', 'た', 'な', 'は', 'ま', 'み', 'も', 'ろ', 'ね', 'れ']
const HIRA_HARD = ['あ', 'お', 'ぬ', 'め', 'む', 'を', 'ゆ', 'ふ', 'え', 'わ']
const KATA = ['ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク', 'ケ', 'コ', 'サ', 'シ', 'ス', 'セ', 'ソ', 'ロ', 'ル', 'ナ', 'ホ']

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateWritingQuestion(params) {
  const { level } = params

  // 文字プールをレベルで選ぶ
  let pool
  let kana = 'hira'
  if (level <= 2) pool = HIRA_EASY
  else if (level <= 4) pool = [...HIRA_EASY, ...HIRA_MID]
  else if (level <= 6) pool = [...HIRA_MID, ...HIRA_HARD]
  else {
    // 高レベルはカタカナも
    if (Math.random() < 0.5) {
      pool = KATA
      kana = 'kata'
    } else {
      pool = [...HIRA_MID, ...HIRA_HARD]
    }
  }

  const target = pick(pool)

  // お手本ありでなぞる→慣れたら自由書き。レベルが上がるほど自由書きが増える。
  const freeChance = level <= 2 ? 0 : level <= 4 ? 0.25 : level <= 6 ? 0.5 : 0.75
  const stage = Math.random() < freeChance ? 'free' : 'trace'

  return {
    domain: 'kaku',
    type: 'trace',
    target,
    kana,
    stage,
    instruction: stage === 'trace' ? `「${target}」を なぞろう` : `「${target}」を かいてみよう`,
    speak:
      stage === 'trace'
        ? `${target}を、ゆびで なぞってね`
        : `${target}を、じぶんで かいてみよう`,
    answerWord: { text: target }
  }
}
