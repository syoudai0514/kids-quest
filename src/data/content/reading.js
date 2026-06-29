// ============================================================
// 「よむ」分野のコンテンツ（ひらがな/カタカナの単語）
// 題材は宇宙（ほし・ロケット・つき…）と恐竜中心。食いつき重視。
//
// 追加方法:
//   WORDS にエントリを足すだけ。
//     text   : 読ませる単語
//     emoji  : 絵（オフラインで使えるよう絵文字）
//     kana   : 'hira' | 'kata'
//     tier   : 1(やさしい) 〜 5(むずかしい) 目安
//     theme  : 'space' | 'dino' | 'life'
// ============================================================

export const WORDS = [
  // --- やさしい（短い・宇宙）---
  { text: 'ほし', emoji: '⭐', kana: 'hira', tier: 1, theme: 'space' },
  { text: 'つき', emoji: '🌙', kana: 'hira', tier: 1, theme: 'space' },
  { text: 'ひ', emoji: '☀️', kana: 'hira', tier: 1, theme: 'space' },
  { text: 'そら', emoji: '🌌', kana: 'hira', tier: 1, theme: 'space' },
  { text: 'くも', emoji: '☁️', kana: 'hira', tier: 1, theme: 'space' },

  // --- やさしい（恐竜・いきもの）---
  { text: 'たまご', emoji: '🥚', kana: 'hira', tier: 2, theme: 'dino' },
  { text: 'あし', emoji: '🦶', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'め', emoji: '👁️', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'は', emoji: '🦷', kana: 'hira', tier: 1, theme: 'dino' },

  // --- ふつう（宇宙）---
  { text: 'ロケット', emoji: '🚀', kana: 'kata', tier: 3, theme: 'space' },
  { text: 'うちゅう', emoji: '🌠', kana: 'hira', tier: 3, theme: 'space' },
  { text: 'いんせき', emoji: '☄️', kana: 'hira', tier: 3, theme: 'space' },
  { text: 'わくせい', emoji: '🪐', kana: 'hira', tier: 4, theme: 'space' },
  { text: 'ちきゅう', emoji: '🌍', kana: 'hira', tier: 4, theme: 'space' },

  // --- ふつう（恐竜）---
  { text: 'きょうりゅう', emoji: '🦕', kana: 'hira', tier: 4, theme: 'dino' },
  { text: 'トリケラ', emoji: '🦖', kana: 'kata', tier: 4, theme: 'dino' },
  { text: 'つの', emoji: '🦏', kana: 'hira', tier: 2, theme: 'dino' },
  { text: 'しっぽ', emoji: '🦎', kana: 'hira', tier: 2, theme: 'dino' },

  // --- カタカナの宇宙ことば ---
  { text: 'スター', emoji: '🌟', kana: 'kata', tier: 3, theme: 'space' },
  { text: 'ムーン', emoji: '🌕', kana: 'kata', tier: 3, theme: 'space' },
  { text: 'コメット', emoji: '☄️', kana: 'kata', tier: 5, theme: 'space' },

  // --- いきもの・みのまわり（語彙を広げる）---
  { text: 'みず', emoji: '💧', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'き', emoji: '🌳', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'はな', emoji: '🌸', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'やま', emoji: '⛰️', kana: 'hira', tier: 1, theme: 'life' },

  // --- むずかしい（長め・恐竜の名前・カタカナ多め）---
  { text: 'ステゴサウルス', emoji: '🦕', kana: 'kata', tier: 6, theme: 'dino' },
  { text: 'プテラノドン', emoji: '🦅', kana: 'kata', tier: 6, theme: 'dino' },
  { text: 'ティラノサウルス', emoji: '🦖', kana: 'kata', tier: 6, theme: 'dino' },
  { text: 'トリケラトプス', emoji: '🦏', kana: 'kata', tier: 6, theme: 'dino' },
  { text: 'ブラキオサウルス', emoji: '🦕', kana: 'kata', tier: 6, theme: 'dino' },
  { text: 'うちゅうひこうし', emoji: '👨‍🚀', kana: 'hira', tier: 6, theme: 'space' },
  { text: 'ぎんが', emoji: '🌌', kana: 'hira', tier: 5, theme: 'space' },
  { text: 'ブラックホール', emoji: '🕳️', kana: 'kata', tier: 6, theme: 'space' },
  { text: 'たいよう', emoji: '☀️', kana: 'hira', tier: 4, theme: 'space' },
  { text: 'どせいのわ', emoji: '🪐', kana: 'hira', tier: 5, theme: 'space' },
  { text: 'かせい', emoji: '🔴', kana: 'hira', tier: 4, theme: 'space' },
  { text: 'たんけん', emoji: '🔭', kana: 'hira', tier: 5, theme: 'space' },
  { text: 'かせき', emoji: '🦴', kana: 'hira', tier: 4, theme: 'dino' },
  { text: 'にくしょく', emoji: '🍖', kana: 'hira', tier: 5, theme: 'dino' },
  { text: 'そうしょく', emoji: '🌿', kana: 'hira', tier: 5, theme: 'dino' }
]

// tier を難易度レベルにゆるく対応させて候補を絞る
function poolForLevel(level, allowKatakana, allowHard) {
  return WORDS.filter((w) => {
    if (!allowKatakana && w.kana === 'kata') return false
    if (!allowHard && w.tier >= 5) return false
    // レベルに対して難しすぎる語は避ける（level+1 までを許容）
    return w.tier <= level + 1
  })
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickDistinct(pool, n, exclude) {
  const filtered = pool.filter((w) => w.text !== exclude.text)
  return shuffle(filtered).slice(0, Math.max(0, n - 1))
}

/**
 * 「よむ」の問題を1問生成する。
 * 2種類のミニ課題をランダムに混ぜる:
 *   mode 'pick-word'  : 絵を見て ことば をえらぶ（よむ力）
 *   mode 'pick-pic'   : ことばを見て え をえらぶ（よむ力＋意味）
 *
 * @param {object} params difficulty.difficultyParams の戻り値
 * @returns 問題オブジェクト
 */
export function generateReadingQuestion(params) {
  const { level, choiceCount, allowKatakana, allowHard } = params
  const pool = poolForLevel(level, allowKatakana, allowHard)
  const safePool = pool.length >= choiceCount ? pool : WORDS
  const answer = shuffle(safePool)[0]
  const distractors = pickDistinct(safePool, choiceCount, answer)
  const options = shuffle([answer, ...distractors])

  const mode = Math.random() < 0.5 ? 'pick-word' : 'pick-pic'

  if (mode === 'pick-pic') {
    // ことばを見て、絵をえらぶ
    return {
      domain: 'yomu',
      type: 'choice',
      mode,
      promptText: answer.text,
      // 音声で読む内容（指示＋ことば）
      speak: `${answer.text}。 ${answer.text}は どれかな？`,
      instruction: 'おなじ えを えらんでね',
      answerId: answer.text,
      choices: options.map((w) => ({
        id: w.text,
        emoji: w.emoji,
        label: null,
        speak: null
      })),
      answerWord: answer
    }
  }

  // pick-word: 絵を見て、ことばをえらぶ
  return {
    domain: 'yomu',
    type: 'choice',
    mode,
    promptEmoji: answer.emoji,
    speak: 'これは なにかな？ ことばを えらんでね',
    instruction: 'これは なに？',
    answerId: answer.text,
    choices: options.map((w) => ({
      id: w.text,
      emoji: null,
      label: w.text,
      speak: w.text
    })),
    answerWord: answer
  }
}
