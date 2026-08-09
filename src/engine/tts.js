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
let narratorDetail = null
let narratorAudio = null
// "ready"（モデルを保存済み）と、実際にアプリの声を再生できたかは別物。
// iPhone では後者だけが失敗し、以前は端末音声へ黙って戻っていた。
let narratorPlayback = 'not-tested' // not-tested | app | device | device-fallback
const narratorListeners = new Set()

function notifyNarrator() {
  const status = getNarratorStatus()
  narratorListeners.forEach((listener) => listener(status))
}

export function getNarratorStatus() {
  return {
    state: narratorState,
    // Piper Plus はモデル本体をONNX Runtimeに渡す時、0.3（=30%）を
    // 出したまま長時間かかる。これはダウンロードの30%ではないため、
    // 数字を見せず「読み込み中」として扱う。
    progress: narratorProgress,
    detail: narratorDetail,
    error: narratorError,
    playback: narratorPlayback,
    engine: 'つくよみちゃん（Piper）',
    audio: narratorAudio
  }
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
  narratorDetail = '準備をはじめています…'
  narratorAudio = null
  narratorPlayback = 'not-tested'
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
        // piper-plus の DI loader は、通常の dynamic import と違って
        // WASM の default init() を自動では呼ばない。以前は未初期化の
        // module を返していたため日本語 phonemizer が内部で除外され、
        // 合成時に端末音声へフォールバックしていた。
        wasmLoader: async () => {
          await japanesePhonemizer.default()
          return japanesePhonemizer
        },
        onProgress: ({ stage, progress, message }) => {
          const percent = Number.isFinite(progress) ? Math.round(progress * 100) : null
          // 30% はPiper PlusがONNXセッション作成直前に発行する固定値。
          // 85MB前後のモデル取得・展開がここで起きるため、実進捗のように
          // 表示すると「30%で止まった」と誤解させてしまう。
          narratorProgress = stage === 'model' && percent === 30 ? null : percent
          narratorDetail = stage === 'model' && percent === 30
            ? '声のデータを読み込んでいます…（Wi‑Fi推奨・数分かかることがあります）'
            : stage === 'phonemizer'
              ? '日本語を話せるように仕上げています…'
              : message || '準備しています…'
          narratorState = 'loading'
          narratorError = null
          notifyNarrator()
        }
      })
      narratorState = 'ready'
      narratorProgress = 100
      narratorDetail = '日本語エンジンの準備ができました'
      notifyNarrator()
      return narrator
    } catch (error) {
      narratorState = 'error'
      narratorError = error?.message || 'ナビ音声の準備に失敗しました'
      narratorDetail = null
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

async function playNarratorResult(result, id, loudness) {
  const samples = result?.samples
  const sampleRate = result?.sampleRate
  if (!(samples instanceof Float32Array) || samples.length < 1000 || !Number.isFinite(sampleRate)) {
    throw new Error('専用音声の波形を作れませんでした')
  }

  let peak = 0
  for (let i = 0; i < samples.length; i += 64) {
    const value = Math.abs(samples[i])
    if (Number.isFinite(value)) peak = Math.max(peak, value)
  }
  if (peak < 0.001) throw new Error('専用音声の波形が無音でした')

  const ctx = getCtx()
  if (!ctx) throw new Error('専用音声を再生する機能がありません')
  if (ctx.state === 'suspended') await ctx.resume()
  if (ctx.state !== 'running') throw new Error(`音声再生が停止中です（${ctx.state}）`)
  if (id !== requestId || !enabled) return false

  return new Promise((resolve, reject) => {
    stopNarratorAudio()
    const buffer = ctx.createBuffer(1, samples.length, sampleRate)
    buffer.copyToChannel(samples, 0)
    const source = ctx.createBufferSource()
    const gain = ctx.createGain()
    gain.gain.value = loudness
    source.buffer = buffer
    source.connect(gain)
    gain.connect(ctx.destination)
    activeSource = source
    source.onended = () => {
      if (activeSource === source) activeSource = null
      resolve(true)
    }
    try {
      source.start()
      // 「合成できた」ではなく、iPhone の AudioContext が running の状態で
      // 有効な波形を start できた時だけ専用音声として表示する。
      narratorPlayback = 'app'
      narratorError = null
      narratorAudio = {
        seconds: Math.round((samples.length / sampleRate) * 10) / 10,
        peak: Math.round(peak * 100) / 100,
        context: ctx.state
      }
      narratorDetail = 'つくよみちゃんの音声を再生しました'
      notifyNarrator()
    } catch (error) {
      if (activeSource === source) activeSource = null
      reject(error)
    }
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
    const selectedVoice = opts.voiceStyle === 'device' || opts.voiceStyle === 'neural'
      ? opts.voiceStyle
      : voiceStyle
    const start = async () => {
      pendingTimer = null
      if (id !== requestId || !enabled) return resolve()
      try {
        if (selectedVoice === 'neural') await speakWithNarrator(said, id, opts)
        else {
          narratorPlayback = 'device'
          narratorError = null
          narratorDetail = 'iPhoneの読み上げ音声を再生しています'
          narratorAudio = null
          notifyNarrator()
          await speakWithDevice(said, id, opts)
        }
      } catch (error) {
        // 学習を止めないため端末音声へ戻すが、絶対に成功したようには見せない。
        // この表示で、専用音声が実際に使われたかをiPhone上で判定できる。
        if (selectedVoice === 'neural') {
          narratorPlayback = 'device-fallback'
          narratorError = error?.message || 'アプリのナビ音声を再生できませんでした'
          narratorDetail = '端末の読み上げに戻っています'
          narratorAudio = null
          notifyNarrator()
        }
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
