// ============================================================
// 日本語の音声読み上げ（Web Speech API）
// 指示・問題文・正誤は必ずこれを通して声でも伝える。
// 5歳が一人で操作できるよう、テキストが出るところは必ず speak する想定。
// ============================================================

let jaVoice = null
let voicesReady = false

// 自然に聞こえる日本語音声を優先して選ぶ。
// 端末の既定音声は機械的なことが多いので、質の良いものから順に探す。
const PREFERRED_VOICES = [
  'google 日本語', 'google japanese',
  'microsoft nanami', 'microsoft ayumi', 'microsoft haruka', 'microsoft keita',
  'o-ren', 'kyoko', 'otoya', 'hattori', 'sora',
  'ja-jp-neural', 'ja-jp-wavenet', 'ja-jp-standard'
]

function pickJapaneseVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  const jaAll = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('ja'))
  if (!jaAll.length) return null
  // 名前が好みリストに近いものを優先
  for (const want of PREFERRED_VOICES) {
    const hit = jaAll.find((v) => (v.name || '').toLowerCase().includes(want))
    if (hit) return hit
  }
  // ローカル合成より、質の高いことが多いネットワーク音声を優先
  const remote = jaAll.find((v) => v.localService === false)
  return remote || jaAll.find((v) => v.lang.toLowerCase() === 'ja-jp') || jaAll[0]
}

// 画面用の「わかち書き」をそのまま読ませると、空白ごとに不自然な間が入り
// ロボットのように聞こえる。読み上げ用に自然な文へ整える。
const SYMBOL_READING = [
  [/❓/g, 'なに'],
  [/＋/g, ' たす '],
  [/−/g, ' ひく '],
  [/×/g, ' かける '],
  [/÷/g, ' わる '],
  [/＝/g, ' は '],
  [/％/g, 'パーセント'],
  [/：/g, ' たい '],
  [/～|〜/g, 'から'],
  [/[⭐✨🌟💫🎉🎊🚀📅🎌🔬🗾💗🕐👑⚔️❤️🎁]/g, ''] // 絵文字は読み上げない
]

export function normalizeForSpeech(text) {
  let s = String(text)
  for (const [re, to] of SYMBOL_READING) s = s.replace(re, to)
  // 日本語どうしの間の空白は「わかち書き」なので取り除く（間延び防止）
  s = s.replace(
    /([぀-ゟ゠-ヿ一-鿿0-9０-９])[ 　]+([぀-ゟ゠-ヿ一-鿿0-9０-９])/g,
    '$1$2'
  )
  // 上の置換は重なりを1回しか処理できないので もう一度かける
  s = s.replace(
    /([぀-ゟ゠-ヿ一-鿿0-9０-９])[ 　]+([぀-ゟ゠-ヿ一-鿿0-9０-９])/g,
    '$1$2'
  )
  // 改行は軽い区切りに
  s = s.replace(/\n+/g, '、')
  return s.replace(/\s{2,}/g, ' ').trim()
}

function ensureVoices() {
  if (voicesReady) return
  jaVoice = pickJapaneseVoice()
  if (jaVoice) voicesReady = true
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  // voices は非同期で揃うことがある
  window.speechSynthesis.onvoiceschanged = () => {
    jaVoice = pickJapaneseVoice()
    voicesReady = !!jaVoice
  }
  ensureVoices()
}

let enabled = true

export function setTtsEnabled(v) {
  enabled = v
  if (!v) cancelSpeak()
}

export function isTtsEnabled() {
  return enabled
}

export function cancelSpeak() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
}

/**
 * 日本語テキストを読み上げる。
 * @param {string} text
 * @param {object} opts { rate, pitch, interrupt, onEnd }
 * @returns {Promise<void>}
 */
export function speak(text, opts = {}) {
  return new Promise((resolve) => {
    if (!enabled || typeof window === 'undefined' || !window.speechSynthesis || !text) {
      resolve()
      return
    }
    ensureVoices()
    const synth = window.speechSynthesis
    if (opts.interrupt !== false) synth.cancel()

    const said = normalizeForSpeech(text)
    if (!said) {
      resolve()
      return
    }
    const u = new SpeechSynthesisUtterance(said)
    u.lang = 'ja-JP'
    if (jaVoice) u.voice = jaVoice
    // 自然に聞こえる範囲で、子ども向けに ほんの少しだけ ゆっくり。
    // ピッチを上げすぎると 機械的・かん高く 聞こえるので ほぼ標準にする。
    u.rate = opts.rate ?? 1.0
    u.pitch = opts.pitch ?? 1.02
    u.volume = opts.volume ?? 1
    u.onend = () => {
      opts.onEnd && opts.onEnd()
      resolve()
    }
    u.onerror = () => resolve()
    synth.speak(u)
  })
}

// 多くのブラウザは「ユーザー操作」がないと音声が出ない。
// 最初のタップで一度だけ無音発話して解錠する。
let unlocked = false
export function unlockTts() {
  if (unlocked || typeof window === 'undefined' || !window.speechSynthesis) return
  try {
    const u = new SpeechSynthesisUtterance('')
    u.volume = 0
    window.speechSynthesis.speak(u)
    unlocked = true
  } catch (_) {
    /* noop */
  }
}
