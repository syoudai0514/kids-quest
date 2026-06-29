// ============================================================
// 「よむ」分野のコンテンツ（ひらがな/カタカナの単語）
//
// 重要な原則（絵と言葉のマッチングなので必須）:
//   1) 絵文字は、その単語を「ぱっと見て分かる」ものだけを使う。
//      （宇宙・火星・空のような“絵で表せない/紛らわしい”語は入れない）
//   2) 同じ意味・同じ見た目の語を入れない。
//      （例: ほし と スター、つき と ムーン は同義で混乱するので片方だけ）
//   3) 1つの絵文字は1つの単語だけに使う（絵文字は重複させない）。
//
// 題材は宇宙・恐竜・いきもの中心。追加するときも上の原則を守ること。
//   text  : 読ませる単語 / emoji : 絵（その語と1対1） / kana : 'hira'|'kata'
//   tier  : 1(やさしい)〜6(むずかしい) / theme : 'space'|'dino'|'animal'|'life'
// ============================================================

export const WORDS = [
  // --- 宇宙（絵で分かるものだけ）---
  { text: 'ほし', emoji: '⭐', kana: 'hira', tier: 1, theme: 'space' },
  { text: 'つき', emoji: '🌙', kana: 'hira', tier: 1, theme: 'space' },
  { text: 'たいよう', emoji: '☀️', kana: 'hira', tier: 3, theme: 'space' },
  { text: 'ちきゅう', emoji: '🌍', kana: 'hira', tier: 4, theme: 'space' },
  { text: 'どせい', emoji: '🪐', kana: 'hira', tier: 4, theme: 'space' },
  { text: 'ロケット', emoji: '🚀', kana: 'kata', tier: 3, theme: 'space' },
  { text: 'うちゅうじん', emoji: '👽', kana: 'hira', tier: 5, theme: 'space' },
  { text: 'うちゅうひこうし', emoji: '👨‍🚀', kana: 'hira', tier: 6, theme: 'space' },
  { text: 'ぎんが', emoji: '🌌', kana: 'hira', tier: 4, theme: 'space' },
  { text: 'にじ', emoji: '🌈', kana: 'hira', tier: 2, theme: 'space' },
  { text: 'くも', emoji: '☁️', kana: 'hira', tier: 1, theme: 'space' },

  // --- 恐竜（本物に見える絵文字だけ＝🦕🦖と関連物）---
  { text: 'きょうりゅう', emoji: '🦕', kana: 'hira', tier: 5, theme: 'dino' },
  { text: 'ティラノサウルス', emoji: '🦖', kana: 'kata', tier: 6, theme: 'dino' },
  { text: 'たまご', emoji: '🥚', kana: 'hira', tier: 2, theme: 'dino' },
  { text: 'ほね', emoji: '🦴', kana: 'hira', tier: 2, theme: 'dino' },
  { text: 'あしあと', emoji: '🐾', kana: 'hira', tier: 3, theme: 'dino' },

  // --- いきもの（はっきり分かる絵。良いダミーにもなる）---
  { text: 'サイ', emoji: '🦏', kana: 'kata', tier: 2, theme: 'animal' },
  { text: 'ライオン', emoji: '🦁', kana: 'kata', tier: 4, theme: 'animal' },
  { text: 'ぞう', emoji: '🐘', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'きりん', emoji: '🦒', kana: 'hira', tier: 3, theme: 'animal' },
  { text: 'へび', emoji: '🐍', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'かめ', emoji: '🐢', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'さかな', emoji: '🐟', kana: 'hira', tier: 3, theme: 'animal' },
  { text: 'とり', emoji: '🐦', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'いぬ', emoji: '🐶', kana: 'hira', tier: 1, theme: 'animal' },
  { text: 'ねこ', emoji: '🐱', kana: 'hira', tier: 1, theme: 'animal' },
  { text: 'うさぎ', emoji: '🐰', kana: 'hira', tier: 3, theme: 'animal' },
  { text: 'くま', emoji: '🐻', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'ペンギン', emoji: '🐧', kana: 'kata', tier: 4, theme: 'animal' },
  { text: 'たこ', emoji: '🐙', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'かに', emoji: '🦀', kana: 'hira', tier: 2, theme: 'animal' },

  // --- みのまわり・しぜん ---
  { text: 'みず', emoji: '💧', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'き', emoji: '🌳', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'はな', emoji: '🌸', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'やま', emoji: '⛰️', kana: 'hira', tier: 2, theme: 'life' },
  { text: 'くるま', emoji: '🚗', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'でんしゃ', emoji: '🚃', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'りんご', emoji: '🍎', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'ばなな', emoji: '🍌', kana: 'hira', tier: 3, theme: 'life' },

  // --- からだ（みじかい語＝やさしい） ---
  { text: 'め', emoji: '👁️', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'は', emoji: '🦷', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'て', emoji: '✋', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'あし', emoji: '🦶', kana: 'hira', tier: 2, theme: 'life' }
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

// 正解と「文字も絵文字も」かぶらないダミーを選ぶ
function pickDistinct(pool, n, exclude) {
  const seenEmoji = new Set([exclude.emoji])
  const out = []
  for (const w of shuffle(pool)) {
    if (out.length >= n - 1) break
    if (w.text === exclude.text) continue
    if (seenEmoji.has(w.emoji)) continue // 同じ絵が2つ出ないように
    seenEmoji.add(w.emoji)
    out.push(w)
  }
  return out
}

/**
 * 「よむ」の問題を1問生成する。
 *   mode 'pick-word' : 絵を見て ことば をえらぶ
 *   mode 'pick-pic'  : ことばを見て え をえらぶ
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
      speak: `${answer.text}。 ${answer.text}は どれかな？`,
      instruction: 'おなじ えを えらんでね',
      answerId: answer.text,
      choices: options.map((w) => ({ id: w.text, emoji: w.emoji, label: null, speak: null })),
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
    choices: options.map((w) => ({ id: w.text, emoji: null, label: w.text, speak: w.text })),
    answerWord: answer
  }
}
