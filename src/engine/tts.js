// ============================================================
// ほしぞらクエストの読み上げ
//
// 標準は、端末の SpeechSynthesis ではなくアプリ専用の日本語ニューラル音声。
// iPhone に日本語音声が一つしかなくても、ナビの声が同じに戻らない。
// モデルは初回だけ端末へ保存され、文章は外部の読み上げサーバーへ送られない。
// ============================================================

import { getCtx, unlockAudio } from './audioCtx.js'

let enabled = true
let rate = 0.96
let volume = 0.9
// 旧セーブの gentle / lively も、今回から本物のナビ音声に移行する。
let voiceStyle = 'neural'
let requestId = 0
let pendingTimer = null
let activeResolve = null
let activeSource = null

// --- 端末内のニューラル音声モデル ---
let narrator = null
let narratorPromise = null
let narratorState = 'idle' // idle | loading | ready | error
let narratorProgress = null
let narratorError = null
const narratorListeners = new Set()

function notifyNarrator() {
  const status = getNarratorStatus()
  narratorListeners.forEach((listener) => listener(status))
}

export function getNarratorStatus() {
  return { state: narratorState, progress: narratorProgress, error: narratorError }
}

export function subscribeNarratorStatus(listener) {
  narratorListeners.add(listener)
  listener(getNarratorStatus())
  return () => narratorListeners.delete(listener)
}

// Piper Plus は、初回だけモデルを IndexedDB に保存する。静的 import にすると
// アプリ起動時のJavaScriptが重くなるため、ナビ音声を使う時だけ読み込む。
export async function prepareNarratorVoice() {
  if (narrator) return narrator
  if (narratorPromise) return narratorPromise

  narratorState = 'loading'
  narratorProgress = 0
  narratorError = null
  notifyNarrator()

  narratorPromise = (async () => {
    try {
      const [{ PiperPlus }, ort, japanesePhonemizer] = await Promise.all([
        import('piper-plus'),
        import('onnxruntime-web'),
        // パッケージ内部の相対URLに任せると、Viteでハッシュ名へ変わったWASMを
        // 見つけられない。ここで明示的に読ませ、iPhoneでも確実に日本語を解析する。
        import('piper-plus/wasm/multilingual')
      ])
      narrator = await PiperPlus.initialize({
        // つきよみちゃん: 日本語の女性単一話者モデル（MIT）。
        model: 'tsukuyomi',
        ort,
        wasmLoader: async () => japanesePhonemizer,
        onProgress: ({ progress, message }) => {
          narratorProgress = Number.isFinite(progress) ? Math.round(progress * 100) : null
          narratorState = 'loading'
          if (message) narratorError = null
          notifyNarrator()
        }
      })
      narratorState = 'ready'
      narratorProgress = 100
      notifyNarrator()
      return narrator
    } catch (error) {
      narratorState = 'error'
      narratorError = error?.message || 'ナビ音声の準備に失敗しました'
      narratorPromise = null
      notifyNarrator()
      throw error
    }
  })()

  return narratorPromise
}

function pickJapaneseVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  const ja = voices.filter((v) => v.lang?.toLowerCase().startsWith('ja'))
  return ja.find((v) => v.lang.toLowerCase() === 'ja-jp') || ja[0] || null
}

const SYMBOL_READING = [
  [/❓/g, 'なに'], [/＋/g, ' たす '], [/−/g, ' ひく '], [/×/g, ' かける '],
  [/÷/g, ' わる '], [/＝/g, ' は '], [/％/g, 'パーセント'], [/：/g, ' たい '],
  [/～|〜/g, 'から'], [/[⭐✨🌟💫🎉🎊🚀📅🎌🔬🗾💗🕐👑⚔️❤️🎁]/g, '']
]

export function normalizeForSpeech(text) {
  let s = String(text)
  for (const [re, to] of SYMBOL_READING) s = s.replace(re, to)
  for (let i = 0; i < 3; i += 1) {
    s = s.replace(/([぀-ゟ゠-ヿ一-鿿0-9０-９])[ 　]+([぀-ゟ゠-ヿ一-鿿0-9０-９])/g, '$1$2')
  }
  return s.replace(/\n+/g, '、').replace(/\s{2,}/g, ' ').trim()
}

function splitForNarrator(text) {
  // 長い説明を一息に推論すると待ち時間が伸びるため、自然な区切りで分ける。
  const parts = text.match(/[^、。！？!?]+[、。！？!?]?/g) || [text]
  const result = []
  let current = ''
  parts.forEach((part) => {
    if (current && current.length + part.length > 58) {
      result.push(current)
      current = part
    } else current += part
  })
  if (current) result.push(current)
  return result
}

function stopNarratorAudio() {
  if (!activeSource) return
  try { activeSource.stop() } catch (_) { /* already stopped */ }
  activeSource.disconnect()
  activeSource = null
}

function playNarratorResult(result, id, loudness) {
  return new Promise((resolve) => {
    const ctx = getCtx()
    if (!ctx || id !== requestId || !enabled) return resolve()
    stopNarratorAudio()
    const buffer = ctx.createBuffer(1, result.samples.length, result.sampleRate)
    buffer.copyToChannel(result.samples, 0)
    const source = ctx.createBufferSource()
    const gain = ctx.createGain()
    gain.gain.value = loudness
    source.buffer = buffer
    source.connect(gain)
    gain.connect(ctx.destination)
    activeSource = source
    source.onended = () => {
      if (activeSource === source) activeSource = null
      resolve()
    }
    source.start()
  })
}

async function speakWithNarrator(text, id, opts) {
  const tts = await prepareNarratorVoice()
  const lengthScale = Math.max(0.78, Math.min(1.2, 0.98 / (opts.rate ?? rate)))
  const loudness = opts.volume ?? volume
  for (const sentence of splitForNarrator(text)) {
    if (id !== requestId || !enabled) return
    const result = await tts.synthesize(sentence, {
      language: 'ja',
      lengthScale,
      // 同じモデルでも毎回ほんの少しだけ自然な抑揚が変わる。
      noiseScale: 0.54,
      noiseW: 0.62
    })
    if (id !== requestId || !enabled) return
    await playNarratorResult(result, id, loudness)
  }
}

function speakWithDevice(text, id, opts) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return resolve()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ja-JP'
    u.voice = pickJapaneseVoice()
    u.rate = opts.rate ?? rate
    u.pitch = opts.pitch ?? 1.05
    u.volume = opts.volume ?? volume
    activeResolve = resolve
    const finish = () => {
      if (id !== requestId) return
      activeResolve = null
      resolve()
    }
    u.onend = finish
    u.onerror = finish
    window.speechSynthesis.speak(u)
  })
}

export function setTtsEnabled(value) {
  enabled = value
  if (!value) cancelSpeak()
}

export function setTtsPreferences(next = {}) {
  if (Number.isFinite(next.rate)) rate = Math.min(1.15, Math.max(0.75, next.rate))
  if (Number.isFinite(next.volume)) volume = Math.min(1, Math.max(0, next.volume))
  if (next.voiceStyle) voiceStyle = next.voiceStyle === 'device' ? 'device' : 'neural'
}

export function isTtsEnabled() { return enabled }

export function cancelSpeak() {
  requestId += 1
  if (pendingTimer) clearTimeout(pendingTimer)
  pendingTimer = null
  stopNarratorAudio()
  if (activeResolve) {
    activeResolve()
    activeResolve = null
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
}

/** 文章を、選んだナビ音声で読み上げる。 */
export function speak(text, opts = {}) {
  return new Promise((resolve) => {
    if (!enabled || !text) return resolve()
    const said = normalizeForSpeech(text)
    if (!said) return resolve()
    if (opts.interrupt !== false) cancelSpeak()
    const id = ++requestId
    const start = async () => {
      pendingTimer = null
      if (id !== requestId || !enabled) return resolve()
      try {
        if (voiceStyle === 'neural') await speakWithNarrator(said, id, opts)
        else await speakWithDevice(said, id, opts)
      } catch (error) {
        // オフラインの初回など、モデルがまだ取れない時だけ端末音声へ戻す。
        // 失敗を黙殺せず設定画面に状態を残すので、次回は再試行できる。
        if (id === requestId && enabled) await speakWithDevice(said, id, opts)
      }
      if (id === requestId) opts.onEnd?.()
      resolve()
    }
    // Safari の cancel 直後の無音を避ける短い間隔。
    pendingTimer = setTimeout(start, opts.interrupt === false ? 0 : 70)
  })
}

// アプリ最初のタップで共有 AudioContext を解錠する。これにより、モデルの
// 推論が終わった後の再生も iPhone の自動再生制限で無音にならない。
export function unlockTts() {
  unlockAudio()
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      const u = new SpeechSynthesisUtterance('')
      u.volume = 0
      window.speechSynthesis.speak(u)
    } catch (_) { /* noop */ }
  }
}
