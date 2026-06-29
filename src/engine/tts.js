// ============================================================
// 日本語の音声読み上げ（Web Speech API）
// 指示・問題文・正誤は必ずこれを通して声でも伝える。
// 5歳が一人で操作できるよう、テキストが出るところは必ず speak する想定。
// ============================================================

let jaVoice = null
let voicesReady = false

function pickJapaneseVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  // ja-JP を優先。なければ ja で始まるもの。
  const ja =
    voices.find((v) => v.lang && v.lang.toLowerCase() === 'ja-jp') ||
    voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('ja'))
  return ja || null
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

    const u = new SpeechSynthesisUtterance(String(text))
    u.lang = 'ja-JP'
    if (jaVoice) u.voice = jaVoice
    // 子ども向けに少しゆっくり・少し高め
    u.rate = opts.rate ?? 0.95
    u.pitch = opts.pitch ?? 1.15
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
