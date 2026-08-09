// ============================================================
// ほしぞらクエスト専用・軽量日本語フォネマイザー
//
// piper-plus 標準の日本語解析WASMは、辞書を含め約60MBある。iPhone 11 Proの
// PWAでは、38MBの音声モデルとONNX Runtimeと同時に展開すると強制終了しやすい。
// このアプリの年長向け読み上げ文は、発音用にひらがな／カタカナで用意して
// あるため、かなを直接Piperの音素IDへ変換する小さな実装を使う。
//
// piper-plus の wasmLoader DI と同じ形を公開するので、声のモデル・推論処理・
// 速度設定は従来どおり。置き換わるのは「文字を発音へ変える」部分だけ。
// ============================================================

const PAUSE = Symbol('pause')

// この音声モデルの日本語用音素ID。モデルURLはコミット固定なので、IDも固定。
// 促音・撥音・拗音には、モデルが学習した日本語専用IDを使う。
const V = { a: 10, i: 11, u: 12, e: 13, o: 14 }
const C = {
  N: 29, q: 30, k: 32, ky: 33, g: 35, gy: 36, t: 38, ty: 39,
  d: 40, dy: 41, p: 42, py: 43, b: 44, by: 45, ch: 46, ts: 47,
  s: 48, sh: 49, z: 50, j: 51, f: 53, h: 54, hy: 55, v: 56,
  n: 57, ny: 58, m: 59, my: 60, r: 61, ry: 62, w: 63, y: 64
}

const row = (consonant, chars) => Object.fromEntries(
  [...chars].map((char, index) => [char, [consonant, V[['a', 'i', 'u', 'e', 'o'][index]]]])
)

const MORA = {
  あ: [V.a], い: [V.i], う: [V.u], え: [V.e], お: [V.o],
  ...row(C.k, 'かきくけこ'), ...row(C.g, 'がぎぐげご'),
  さ: [C.s, V.a], し: [C.sh, V.i], す: [C.s, V.u], せ: [C.s, V.e], そ: [C.s, V.o],
  ざ: [C.z, V.a], じ: [C.j, V.i], ず: [C.z, V.u], ぜ: [C.z, V.e], ぞ: [C.z, V.o],
  た: [C.t, V.a], ち: [C.ch, V.i], つ: [C.ts, V.u], て: [C.t, V.e], と: [C.t, V.o],
  だ: [C.d, V.a], ぢ: [C.j, V.i], づ: [C.z, V.u], で: [C.d, V.e], ど: [C.d, V.o],
  ...row(C.n, 'なにぬねの'),
  は: [C.h, V.a], ひ: [C.h, V.i], ふ: [C.f, V.u], へ: [C.h, V.e], ほ: [C.h, V.o],
  ...row(C.b, 'ばびぶべぼ'), ...row(C.p, 'ぱぴぷぺぽ'),
  ...row(C.m, 'まみむめも'),
  や: [C.y, V.a], ゆ: [C.y, V.u], よ: [C.y, V.o],
  ...row(C.r, 'らりるれろ'),
  わ: [C.w, V.a], を: [V.o], ん: [C.N], っ: [C.q], ゔ: [C.v, V.u],

  きゃ: [C.ky, V.a], きゅ: [C.ky, V.u], きょ: [C.ky, V.o],
  ぎゃ: [C.gy, V.a], ぎゅ: [C.gy, V.u], ぎょ: [C.gy, V.o],
  しゃ: [C.sh, V.a], しゅ: [C.sh, V.u], しょ: [C.sh, V.o],
  じゃ: [C.j, V.a], じゅ: [C.j, V.u], じょ: [C.j, V.o],
  ちゃ: [C.ch, V.a], ちゅ: [C.ch, V.u], ちょ: [C.ch, V.o],
  にゃ: [C.ny, V.a], にゅ: [C.ny, V.u], にょ: [C.ny, V.o],
  ひゃ: [C.hy, V.a], ひゅ: [C.hy, V.u], ひょ: [C.hy, V.o],
  びゃ: [C.by, V.a], びゅ: [C.by, V.u], びょ: [C.by, V.o],
  ぴゃ: [C.py, V.a], ぴゅ: [C.py, V.u], ぴょ: [C.py, V.o],
  みゃ: [C.my, V.a], みゅ: [C.my, V.u], みょ: [C.my, V.o],
  りゃ: [C.ry, V.a], りゅ: [C.ry, V.u], りょ: [C.ry, V.o],

  ふぁ: [C.f, V.a], ふぃ: [C.f, V.i], ふぇ: [C.f, V.e], ふぉ: [C.f, V.o],
  てぃ: [C.t, V.i], でぃ: [C.d, V.i], とぅ: [C.t, V.u], どぅ: [C.d, V.u],
  つぁ: [C.ts, V.a], つぃ: [C.ts, V.i], つぇ: [C.ts, V.e], つぉ: [C.ts, V.o],
  うぃ: [C.w, V.i], うぇ: [C.w, V.e], うぉ: [C.w, V.o],
  しぇ: [C.sh, V.e], じぇ: [C.j, V.e], ちぇ: [C.ch, V.e],
  てゅ: [C.ty, V.u], でゅ: [C.dy, V.u],
  ゔぁ: [C.v, V.a], ゔぃ: [C.v, V.i], ゔぇ: [C.v, V.e], ゔぉ: [C.v, V.o]
}

const WORD_READINGS = {
  'つくよみちゃん': 'つくよみちゃん',
  国語: 'こくご', 算数: 'さんすう', 生活: 'せいかつ', 理科: 'りか', 社会: 'しゃかい', 道徳: 'どうとく',
  正解: 'せいかい', 問題: 'もんだい', 日本: 'にほん', 今日: 'きょう', 学校: 'がっこう',
  先生: 'せんせい', 時間: 'じかん', 何本: 'なんぼん', 何度: 'なんど', 何月: 'なんがつ',
  何日: 'なんにち', 何曜日: 'なんようび', 太陽: 'たいよう', 空気: 'くうき', 電気: 'でんき',
  水: 'みず', 月: 'つき', 星: 'ほし', 音: 'おと', 花: 'はな', 葉: 'は', 木: 'き',
  上: 'うえ', 下: 'した', 中: 'なか', 右: 'みぎ', 左: 'ひだり', 大: 'おおきい', 小: 'ちいさい'
}

const DIGIT = ['ぜろ', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう']

function readUnder10000(value) {
  if (value === 0) return ''
  let n = value
  let out = ''
  const thousands = Math.floor(n / 1000)
  if (thousands) out += ['', 'せん', 'にせん', 'さんぜん', 'よんせん', 'ごせん', 'ろくせん', 'ななせん', 'はっせん', 'きゅうせん'][thousands]
  n %= 1000
  const hundreds = Math.floor(n / 100)
  if (hundreds) out += ['', 'ひゃく', 'にひゃく', 'さんびゃく', 'よんひゃく', 'ごひゃく', 'ろっぴゃく', 'ななひゃく', 'はっぴゃく', 'きゅうひゃく'][hundreds]
  n %= 100
  const tens = Math.floor(n / 10)
  if (tens) out += tens === 1 ? 'じゅう' : `${DIGIT[tens]}じゅう`
  if (n % 10) out += DIGIT[n % 10]
  return out
}

function numberReading(raw) {
  const normalized = raw.replace(/^0+(?=\d)/, '')
  const value = Number(normalized)
  if (!Number.isSafeInteger(value) || value < 0) return [...raw].map((d) => DIGIT[Number(d)]).join('')
  if (value === 0) return DIGIT[0]
  if (value < 10000) return readUnder10000(value)
  if (value < 100000000) {
    const high = Math.floor(value / 10000)
    const low = value % 10000
    return `${readUnder10000(high)}まん${readUnder10000(low)}`
  }
  return [...raw].map((d) => DIGIT[Number(d)]).join('')
}

function katakanaToHiragana(text) {
  return text.replace(/[ァ-ヶ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
}

function toReadableKana(text) {
  let value = String(text).normalize('NFKC')
  for (const [word, reading] of Object.entries(WORD_READINGS).sort((a, b) => b[0].length - a[0].length)) {
    value = value.split(word).join(reading)
  }
  value = value
    .replace(/\d+/g, numberReading)
    .replace(/N(?=\s*きょく)/gi, 'えぬ')
    .replace(/BTG/gi, 'びーてぃーじー')
    .replace(/[A-Z]/gi, (letter) => ({
      A: 'えー', B: 'びー', C: 'しー', D: 'でぃー', E: 'いー', F: 'えふ', G: 'じー', H: 'えいち',
      I: 'あい', J: 'じぇー', K: 'けー', L: 'える', M: 'えむ', N: 'えぬ', O: 'おー', P: 'ぴー',
      Q: 'きゅー', R: 'あーる', S: 'えす', T: 'てぃー', U: 'ゆー', V: 'ぶい', W: 'だぶりゅー',
      X: 'えっくす', Y: 'わい', Z: 'ぜっと'
    })[letter.toUpperCase()] || '')
  return katakanaToHiragana(value)
}

function encodeKana(text) {
  const kana = toReadableKana(text)
  const phonemes = []
  let lastVowel = null
  for (let index = 0; index < kana.length;) {
    const char = kana[index]
    if (char === 'ー') {
      if (lastVowel) phonemes.push(lastVowel)
      index += 1
      continue
    }
    if (/\s|[、。・，．！？!?：:；;（）()「」『』\[\]【】…]/.test(char)) {
      if (phonemes.at(-1) !== PAUSE) phonemes.push(PAUSE)
      index += 1
      continue
    }
    const pair = kana.slice(index, index + 2)
    const encoded = MORA[pair] || MORA[char]
    if (!encoded) {
      const error = new Error(`軽量音声で読めない文字があります: ${char}`)
      error.code = 'LITE_PHONEMIZER_UNSUPPORTED'
      throw error
    }
    phonemes.push(...encoded)
    const vowel = [...encoded].reverse().find((id) => Object.values(V).includes(id))
    if (vowel) lastVowel = vowel
    index += MORA[pair] ? 2 : 1
  }
  return phonemes
}

class LiteJapanesePhonemizer {
  constructor() {}
  getSupportedLanguages() { return ['ja'] }
  detectLanguage() { return 'ja' }
  phonemize(text) {
    const phonemeIds = [1, 0]
    for (const phoneme of encodeKana(text)) {
      if (phoneme === PAUSE) {
        if (phonemeIds.at(-1) !== 0) phonemeIds.push(0)
      } else {
        phonemeIds.push(phoneme, 0)
      }
    }
    while (phonemeIds.length > 2 && phonemeIds.at(-1) === 0 && phonemeIds.at(-2) === 0) phonemeIds.pop()
    phonemeIds.push(2)
    return {
      phonemeIds: Int32Array.from(phonemeIds),
      prosodyFeatures: Int32Array.from({ length: phonemeIds.length * 3 }, () => 0),
      free() {}
    }
  }
  free() {}
}

export function createLiteJapaneseWasmModule() {
  return { WasmPhonemizer: LiteJapanesePhonemizer }
}

export const liteJapaneseInternals = { toReadableKana, encodeKana }
