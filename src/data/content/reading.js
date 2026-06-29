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
  { text: 'あし', emoji: '🦶', kana: 'hira', tier: 2, theme: 'life' },

  // --- いきもの（増量） ---
  { text: 'ねずみ', emoji: '🐭', kana: 'hira', tier: 3, theme: 'animal' },
  { text: 'うま', emoji: '🐴', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'ぶた', emoji: '🐷', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'ひつじ', emoji: '🐑', kana: 'hira', tier: 3, theme: 'animal' },
  { text: 'さる', emoji: '🐵', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'とら', emoji: '🐯', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'コアラ', emoji: '🐨', kana: 'kata', tier: 3, theme: 'animal' },
  { text: 'パンダ', emoji: '🐼', kana: 'kata', tier: 3, theme: 'animal' },
  { text: 'かえる', emoji: '🐸', kana: 'hira', tier: 3, theme: 'animal' },
  { text: 'はち', emoji: '🐝', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'ちょうちょ', emoji: '🦋', kana: 'hira', tier: 4, theme: 'animal' },
  { text: 'かたつむり', emoji: '🐌', kana: 'hira', tier: 5, theme: 'animal' },
  { text: 'くじら', emoji: '🐳', kana: 'hira', tier: 3, theme: 'animal' },
  { text: 'いるか', emoji: '🐬', kana: 'hira', tier: 3, theme: 'animal' },
  { text: 'さめ', emoji: '🦈', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'りゅう', emoji: '🐉', kana: 'hira', tier: 3, theme: 'dino' },
  { text: 'ユニコーン', emoji: '🦄', kana: 'kata', tier: 5, theme: 'animal' },

  // --- たべもの ---
  { text: 'いちご', emoji: '🍓', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'ぶどう', emoji: '🍇', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'すいか', emoji: '🍉', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'みかん', emoji: '🍊', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'トマト', emoji: '🍅', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'にんじん', emoji: '🥕', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'ケーキ', emoji: '🍰', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'パン', emoji: '🍞', kana: 'kata', tier: 2, theme: 'life' },
  { text: 'おにぎり', emoji: '🍙', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'アイス', emoji: '🍦', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'きのこ', emoji: '🍄', kana: 'hira', tier: 3, theme: 'life' },

  // --- のりもの ---
  { text: 'ひこうき', emoji: '✈️', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'ふね', emoji: '🚢', kana: 'hira', tier: 2, theme: 'life' },
  { text: 'じてんしゃ', emoji: '🚲', kana: 'hira', tier: 5, theme: 'life' },
  { text: 'バス', emoji: '🚌', kana: 'kata', tier: 2, theme: 'life' },
  { text: 'きゅうきゅうしゃ', emoji: '🚑', kana: 'hira', tier: 6, theme: 'life' },
  { text: 'しょうぼうしゃ', emoji: '🚒', kana: 'hira', tier: 6, theme: 'life' },

  // --- しぜん（増量） ---
  { text: 'ゆきだるま', emoji: '⛄', kana: 'hira', tier: 5, theme: 'life' },
  { text: 'かみなり', emoji: '⚡', kana: 'hira', tier: 4, theme: 'space' },
  { text: 'かざん', emoji: '🌋', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'ひまわり', emoji: '🌻', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'サボテン', emoji: '🌵', kana: 'kata', tier: 4, theme: 'life' }
]

// ------------------------------------------------------------
// 小1の漢字（読みの練習）。読みはすべて重複しないようにしてある。
// emoji があるものは「漢字→絵」のヒントにも使える。
// ------------------------------------------------------------
export const KANJI = [
  { k: '一', yomi: 'いち' }, { k: '二', yomi: 'に' }, { k: '三', yomi: 'さん' },
  { k: '四', yomi: 'よん' }, { k: '五', yomi: 'ご' }, { k: '六', yomi: 'ろく' },
  { k: '七', yomi: 'なな' }, { k: '八', yomi: 'はち' }, { k: '九', yomi: 'きゅう' },
  { k: '十', yomi: 'じゅう' },
  { k: '山', yomi: 'やま', emoji: '⛰️' }, { k: '川', yomi: 'かわ' },
  { k: '木', yomi: 'き', emoji: '🌳' }, { k: '火', yomi: 'ひ', emoji: '🔥' },
  { k: '水', yomi: 'みず', emoji: '💧' }, { k: '空', yomi: 'そら' },
  { k: '月', yomi: 'つき', emoji: '🌙' }, { k: '日', yomi: 'にち' },
  { k: '花', yomi: 'はな', emoji: '🌸' }, { k: '犬', yomi: 'いぬ', emoji: '🐶' },
  { k: '虫', yomi: 'むし', emoji: '🐛' }, { k: '目', yomi: 'め', emoji: '👁️' },
  { k: '耳', yomi: 'みみ', emoji: '👂' }, { k: '口', yomi: 'くち', emoji: '👄' },
  { k: '手', yomi: 'て', emoji: '✋' }, { k: '足', yomi: 'あし', emoji: '🦶' },
  { k: '雨', yomi: 'あめ', emoji: '🌧️' }, { k: '石', yomi: 'いし', emoji: '🪨' },
  { k: '土', yomi: 'つち' }, { k: '田', yomi: 'た', emoji: '🌾' },
  { k: '車', yomi: 'くるま', emoji: '🚗' }, { k: '人', yomi: 'ひと' },
  { k: '大', yomi: 'おおきい' }, { k: '小', yomi: 'ちいさい' },
  { k: '上', yomi: 'うえ' }, { k: '下', yomi: 'した' }, { k: '中', yomi: 'なか' },
  { k: '王', yomi: 'おう' }, { k: '子', yomi: 'こ' }, { k: '女', yomi: 'おんな' },
  { k: '男', yomi: 'おとこ' }, { k: '力', yomi: 'ちから' }, { k: '金', yomi: 'きん' },
  { k: '貝', yomi: 'かい', emoji: '🐚' }, { k: '竹', yomi: 'たけ', emoji: '🎋' },
  { k: '草', yomi: 'くさ', emoji: '🌿' }, { k: '森', yomi: 'もり', emoji: '🌲' },
  { k: '林', yomi: 'はやし' }
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

// 小1の漢字: 「この かんじ、なんて よむ？」
function generateKanjiQuestion(params) {
  const { choiceCount } = params
  const answer = shuffle(KANJI)[0]
  // 答えと読みがかぶらないダミーを集める
  const seen = new Set([answer.yomi])
  const distractors = []
  for (const k of shuffle(KANJI)) {
    if (distractors.length >= choiceCount - 1) break
    if (seen.has(k.yomi)) continue
    seen.add(k.yomi)
    distractors.push(k)
  }
  const options = shuffle([answer, ...distractors])
  return {
    domain: 'yomu',
    type: 'choice',
    mode: 'kanji-read',
    promptText: answer.k,
    promptScale: 'kanji',
    instruction: 'なんて よむ？',
    speak: 'この かんじは なんて よむかな？',
    answerId: answer.yomi,
    choices: options.map((k) => ({ id: k.yomi, emoji: null, label: k.yomi, speak: k.yomi })),
    answerWord: { text: answer.yomi }
  }
}

/**
 * 「よむ」の問題を1問生成する。
 *   mode 'pick-word'  : 絵を見て ことば をえらぶ
 *   mode 'pick-pic'   : ことばを見て え をえらぶ
 *   mode 'kanji-read' : 小1の漢字の読みをえらぶ（レベルが上がると登場）
 */
export function generateReadingQuestion(params) {
  const { level, choiceCount, allowKatakana, allowHard } = params

  // 小1レベル: レベルが上がると漢字の読みも混ぜる
  if (level >= 3 && Math.random() < 0.35) return generateKanjiQuestion(params)
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
