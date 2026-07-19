// ============================================================
// 「よむ」分野のコンテンツ（ひらがな/カタカナの単語 ＋ 小1漢字）
//
// 原則（絵と言葉のマッチングなので必須）:
//   1) 絵文字は、その単語を「ぱっと見て分かる」ものだけ。
//   2) 同じ意味・同じ見た目の語は入れない（ほし/スター等の同義語禁止）。
//   3) 1つの絵文字は1つの単語だけに使う（重複禁止）。
//
// 復習キュー対応:
//   generateReadingQuestion(params, reviewKey) に 'w:ほし' / 'k:木' を
//   渡すと、その項目を答えにした問題を作る（間違えた問題の再出題）。
//   各問題は itemKey を持ち、正誤に応じてキューへ出し入れされる。
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
  { text: 'かみなり', emoji: '⚡', kana: 'hira', tier: 4, theme: 'space' },

  // --- 恐竜（本物に見える絵文字だけ）---
  { text: 'きょうりゅう', emoji: '🦕', kana: 'hira', tier: 5, theme: 'dino' },
  { text: 'ティラノサウルス', emoji: '🦖', kana: 'kata', tier: 6, theme: 'dino' },
  { text: 'たまご', emoji: '🥚', kana: 'hira', tier: 2, theme: 'dino' },
  { text: 'ほね', emoji: '🦴', kana: 'hira', tier: 2, theme: 'dino' },
  { text: 'あしあと', emoji: '🐾', kana: 'hira', tier: 3, theme: 'dino' },
  { text: 'りゅう', emoji: '🐉', kana: 'hira', tier: 3, theme: 'dino' },

  // --- いきもの ---
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
  { text: 'ユニコーン', emoji: '🦄', kana: 'kata', tier: 5, theme: 'animal' },

  // --- たべもの ---
  { text: 'いちご', emoji: '🍓', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'ぶどう', emoji: '🍇', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'すいか', emoji: '🍉', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'みかん', emoji: '🍊', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'りんご', emoji: '🍎', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'ばなな', emoji: '🍌', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'トマト', emoji: '🍅', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'にんじん', emoji: '🥕', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'ケーキ', emoji: '🍰', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'パン', emoji: '🍞', kana: 'kata', tier: 2, theme: 'life' },
  { text: 'おにぎり', emoji: '🍙', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'アイス', emoji: '🍦', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'きのこ', emoji: '🍄', kana: 'hira', tier: 3, theme: 'life' },

  // --- のりもの ---
  { text: 'くるま', emoji: '🚗', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'でんしゃ', emoji: '🚃', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'ひこうき', emoji: '✈️', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'ふね', emoji: '🚢', kana: 'hira', tier: 2, theme: 'life' },
  { text: 'じてんしゃ', emoji: '🚲', kana: 'hira', tier: 5, theme: 'life' },
  { text: 'バス', emoji: '🚌', kana: 'kata', tier: 2, theme: 'life' },
  { text: 'きゅうきゅうしゃ', emoji: '🚑', kana: 'hira', tier: 6, theme: 'life' },
  { text: 'しょうぼうしゃ', emoji: '🚒', kana: 'hira', tier: 6, theme: 'life' },

  // --- しぜん・みのまわり ---
  { text: 'みず', emoji: '💧', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'き', emoji: '🌳', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'はな', emoji: '🌸', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'やま', emoji: '⛰️', kana: 'hira', tier: 2, theme: 'life' },
  { text: 'ゆきだるま', emoji: '⛄', kana: 'hira', tier: 5, theme: 'life' },
  { text: 'かざん', emoji: '🌋', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'ひまわり', emoji: '🌻', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'サボテン', emoji: '🌵', kana: 'kata', tier: 4, theme: 'life' },

  // --- からだ ---
  { text: 'め', emoji: '👁️', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'は', emoji: '🦷', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'て', emoji: '✋', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'あし', emoji: '🦶', kana: 'hira', tier: 2, theme: 'life' }
]

import { kanjiPoolForGrade, KANJI_BY_CHAR } from '../kanjiByGrade.js'

const WORD_BY_TEXT = Object.fromEntries(WORDS.map((w) => [w.text, w]))

function poolForLevel(level, allowKatakana, allowHard) {
  return WORDS.filter((w) => {
    if (!allowKatakana && w.kana === 'kata') return false
    if (!allowHard && w.tier >= 5) return false
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
    if (seenEmoji.has(w.emoji)) continue
    seenEmoji.add(w.emoji)
    out.push(w)
  }
  return out
}

function wordQuestion(answer, params) {
  const { level, choiceCount, allowKatakana, allowHard } = params
  const pool = poolForLevel(level, allowKatakana, allowHard)
  const safePool = pool.length >= choiceCount ? pool : WORDS
  const distractors = pickDistinct(safePool, choiceCount, answer)
  const options = shuffle([answer, ...distractors])
  const mode = Math.random() < 0.5 ? 'pick-word' : 'pick-pic'

  if (mode === 'pick-pic') {
    return {
      domain: 'yomu',
      type: 'choice',
      itemKey: `w:${answer.text}`,
      visual: { kind: 'word', text: answer.text },
      speak: `${answer.text}。 ${answer.text}は どれかな？`,
      instruction: 'おなじ えを えらんでね',
      answerId: answer.text,
      choices: options.map((w) => ({ id: w.text, emoji: w.emoji })),
      answerWord: answer,
      explain: `こたえは これ。${answer.text}だよ`
    }
  }
  return {
    domain: 'yomu',
    type: 'choice',
    itemKey: `w:${answer.text}`,
    visual: { kind: 'emoji', emoji: answer.emoji },
    speak: 'これは なにかな？ ことばを えらんでね',
    instruction: 'これは なに？',
    answerId: answer.text,
    choices: options.map((w) => ({ id: w.text, label: w.text, speak: w.text })),
    answerWord: answer,
    explain: `これは 「${answer.text}」。 ${answer.text}だよ`
  }
}

function kanjiQuestion(answer, params) {
  const { choiceCount } = params
  const pool = kanjiPoolForGrade(params.grade || 0)
  const seen = new Set([answer.yomi])
  const distractors = []
  for (const k of shuffle(pool)) {
    if (distractors.length >= choiceCount - 1) break
    if (seen.has(k.yomi)) continue
    seen.add(k.yomi)
    distractors.push(k)
  }
  const options = shuffle([answer, ...distractors])
  return {
    domain: 'yomu',
    type: 'choice',
    itemKey: `k:${answer.k}`,
    visual: { kind: 'kanji', text: answer.k },
    speak: 'この かんじは なんて よむかな？',
    instruction: 'なんて よむ？',
    answerId: answer.yomi,
    choices: options.map((k) => ({ id: k.yomi, label: k.yomi, speak: k.yomi })),
    answerWord: { text: answer.yomi },
    explain: `この かんじは 「${answer.yomi}」と よむよ`
  }
}

/**
 * 「よむ」の問題を1問生成する。
 * @param {object} params 難易度パラメータ
 * @param {string|null} reviewKey 'w:ことば' | 'k:字'（復習したい項目）
 */
export function generateReadingQuestion(params, reviewKey = null) {
  // 復習キューからの再出題
  if (reviewKey) {
    if (reviewKey.startsWith('k:')) {
      const k = KANJI_BY_CHAR[reviewKey.slice(2)]
      if (k) return kanjiQuestion(k, params)
    } else if (reviewKey.startsWith('w:')) {
      const w = WORD_BY_TEXT[reviewKey.slice(2)]
      if (w) return wordQuestion(w, params)
    }
  }

  // 漢字の出題率は学年が上がるほど高くなる
  const grade = params.grade || 0
  const kanjiProb = grade >= 2 ? 0.65 : grade === 1 ? 0.45 : params.level >= 3 ? 0.35 : 0
  if (Math.random() < kanjiProb) {
    return kanjiQuestion(shuffle(kanjiPoolForGrade(grade))[0], params)
  }
  const pool = poolForLevel(params.level, params.allowKatakana, params.allowHard)
  const safePool = pool.length >= params.choiceCount ? pool : WORDS
  return wordQuestion(shuffle(safePool)[0], params)
}
