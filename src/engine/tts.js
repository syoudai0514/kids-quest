// ============================================================
// ほしぞらクエストの読み上げ
//
// 標準は、端末の SpeechSynthesis ではなくアプリ専用の日本語ニューラル音声。
// iPhone に日本語音声が一つしかなくても、ナビの声が同じに戻らない。
// モデルは初回だけ端末へ保存され、文章は外部の読み上げサーバーへ送られない。
// ============================================================

import { unlockAudio } from './audioCtx.js'
import {
  hasNarratorInstallMarker,
  markNarratorInstalled,
  NARRATOR_MODEL_URL,
  loadCachedNarratorModel,
  ortWithCachedModel,
  removeLegacyNarratorRuntimeCaches
} from './narratorCache.js'
import { DEFAULT_TTS_RATE } from '../config/ttsRates.js'

let enabled = true
let rate = DEFAULT_TTS_RATE
let volume = 0.9
// 旧セーブの gentle / lively も、今回から本物のナビ音声に移行する。
let voiceStyle = 'neural'
let requestId = 0
let pendingTimer = null
let pendingResolve = null
let activeResolve = null
let activeMedia = null
let activeMediaUrl = null
// iOSで pause() した <audio> は ended を発火しない。ここで待機中の
// Promise を必ず完了させないと、キャンセルした読み上げの波形が残り続ける。
let stopActiveNarratorPlayback = null
// ONNX Runtime Webのrun()は途中キャンセルできない。古い読み上げを止めて
// すぐ別のボタンを押した場合も、推論だけは重ならないよう必ず1本に直列化する。
let narratorInferenceQueue = Promise.resolve()

// --- 端末内のニューラル音声モデル ---
let narrator = null
let narratorPromise = null
let narratorState = hasNarratorInstallMarker() ? 'idle' : 'not-downloaded' // not-downloaded | idle | loading | ready | error
let narratorProgress = null
let narratorError = null
let narratorDetail = null
let narratorAudio = null
let narratorStorage = 'unknown' // unknown | checking | downloading | saved | cached | temporary
// "ready"（モデルを保存済み）と、実際にアプリの声を再生できたかは別物。
// iPhone では後者だけが失敗し、以前は端末音声へ黙って戻っていた。
let narratorPlayback = 'not-tested' // not-tested | app | device | device-fallback
const narratorListeners = new Set()

function isAppleTouchDevice() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const platform = navigator.platform || ''
  return /iPad|iPhone|iPod/.test(ua) ||
    (platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

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
    engine: 'つくよみちゃん（iPhone対応・軽量版）',
    storage: narratorStorage,
    audio: narratorAudio
  }
}

export function subscribeNarratorStatus(listener) {
  narratorListeners.add(listener)
  listener(getNarratorStatus())
  return () => narratorListeners.delete(listener)
}

// 静的 import にするとアプリ起動時のJavaScriptが重くなるため、ナビ音声を
// 使う時だけモデル管理・推論・日本語解析の各部品を読み込む。
export async function prepareNarratorVoice({ allowDownload = false } = {}) {
  if (narrator) return narrator
  if (narratorPromise) return narratorPromise

  // 普段の問題読み上げからは、この先の dynamic import すら行わない。
  // これにより、声を選択しただけでモデル本体や日本語WASMを取得しない。
  if (!allowDownload && !hasNarratorInstallMarker()) {
    narratorState = 'not-downloaded'
    narratorStorage = 'not-downloaded'
    narratorProgress = null
    narratorError = null
    narratorDetail = '「ダウンロード」を押すまで、つくよみちゃんのデータは取得しません'
    notifyNarrator()
    const error = new Error('つくよみちゃんは、まだ端末にダウンロードされていません')
    error.code = 'NARRATOR_NOT_DOWNLOADED'
    throw error
  }

  narratorState = 'loading'
  narratorProgress = 0
  narratorError = null
  narratorDetail = '準備をはじめています…'
  narratorAudio = null
  narratorPlayback = 'not-tested'
  notifyNarrator()

  narratorPromise = (async () => {
    try {
      // 旧PWAが保存した約60MBの日本語WASMを端末から外す。
      // 失敗しても軽量版の起動には影響させない。
      await removeLegacyNarratorRuntimeCaches()
      // 大きな部品をPromise.allで同時展開すると、iPhone 11 Proでは一時的な
      // ピークメモリだけでPWAが終了する。小さいJS → WASM専用ORT → モデルの
      // 順に読み込み、約60MBの多言語フォネマイザーは使わない。
      const { PiperPlus, ModelManager } = await import('piper-plus')
      const ort = await import('onnxruntime-web/wasm')
      const { createLiteJapaneseWasmModule } = await import('./liteJapanesePhonemizer.js')
      const cachedModel = await loadCachedNarratorModel(ModelManager, (status) => {
        narratorStorage = status.storage
        narratorProgress = status.progress
        narratorDetail = status.detail
        narratorError = status.error || null
        notifyNarrator()
      }, { allowDownload })
      // iPhoneではWASMワーカーを増やさない。GitHub Pagesは通常
      // crossOriginIsolatedではないが、明示して端末差による多重確保を防ぐ。
      if (isAppleTouchDevice() && ort.env?.wasm) {
        ort.env.wasm.numThreads = 1
        ort.env.wasm.proxy = false
      }
      const model = cachedModel?.modelUrl || NARRATOR_MODEL_URL
      const narratorOrt = ortWithCachedModel(ort, cachedModel)
      narrator = await PiperPlus.initialize({
        // つきよみちゃん: 日本語の女性単一話者モデル（MIT）。
        model,
        // ModelManagerは音声本体と同じ設定JSONもIndexedDBへ保存する。
        // これをPiperへ直接渡し、「再ダウンロードなし」の起動時に
        // 小さな設定JSONだけ通信失敗する経路もなくす。
        modelConfig: cachedModel?.config,
        ort: narratorOrt,
        // アプリ内の発音用かなを直接モデルの音素へ変換する。巨大な日本語辞書
        // WASMを常駐させず、つくよみちゃんのモデルと声質は維持する。
        wasmLoader: async () => createLiteJapaneseWasmModule(),
        onProgress: ({ stage, progress, message }) => {
          const percent = Number.isFinite(progress) ? Math.round(progress * 100) : null
          // 30% はPiper PlusがONNXセッション作成直前に発行する固定値。
          // 38MB前後のモデル取得・展開がここで起きるため、実進捗のように
          // 表示すると「30%で止まった」と誤解させてしまう。
          narratorProgress = stage === 'model' && percent === 30 ? null : percent
          narratorDetail = stage === 'model' && percent === 30
            ? narratorStorage === 'cached' || narratorStorage === 'saved'
              ? '端末に保存した声を起動しています…（再ダウンロードなし）'
              : '声のデータを読み込んでいます…（Wi‑Fi推奨・数分かかることがあります）'
            : stage === 'phonemizer'
              ? '日本語を話せるように仕上げています…'
              : message || '準備しています…'
          narratorState = 'loading'
          narratorError = null
          notifyNarrator()
        }
      })
      // 音声モデルの保存だけでなく、軽量実行部分の初期化まで
      // 通った時にだけv3導入済みとする。起動失敗後のループを防ぐ。
      if (narratorStorage === 'cached' || narratorStorage === 'saved') markNarratorInstalled()
      narratorState = 'ready'
      narratorProgress = 100
      narratorDetail = narratorStorage === 'cached'
        ? '端末に保存した声を、iPhone対応の軽量版で準備できました（モデルの再ダウンロードなし）'
        : narratorStorage === 'saved'
          ? '声を端末へ保存し、iPhone対応の軽量版で準備できました'
          : '軽量日本語エンジンの準備ができました'
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
  // iPhone のPWAは、大きな推論結果（Float32Array）とWAV用バッファを同時に
  // 保持するとOSに終了されることがある。長い説明を一息に作らず、小さな
  // かたまりごとに「合成→再生→解放」する。内容は省略しない。
  const maxChars = isAppleTouchDevice() ? 18 : 24
  const parts = text.match(/[^、。！？!?]+[、。！？!?]?/g) || [text]
  const result = []
  let current = ''
  const pushChunks = (value) => {
    for (let start = 0; start < value.length; start += maxChars) {
      result.push(value.slice(start, start + maxChars))
    }
  }
  parts.forEach((part) => {
    if (current && current.length + part.length > maxChars) {
      pushChunks(current)
      current = ''
    }
    current += part
    if (current.length >= maxChars) {
      pushChunks(current)
      current = ''
    }
  })
  if (current) pushChunks(current)
  return result
}

function stopNarratorAudio() {
  // cancelSpeak() で次の音声へ切り替えた際、古い synthesize() が永遠に
  // await のまま残らないよう先に解決する。これが低速音声でのメモリ累積を防ぐ。
  if (stopActiveNarratorPlayback) {
    const stop = stopActiveNarratorPlayback
    stopActiveNarratorPlayback = null
    stop()
    return
  }
  if (activeMedia) {
    try {
      activeMedia.pause()
      activeMedia.removeAttribute('src')
      activeMedia.load()
    } catch (_) { /* already stopped */ }
    activeMedia = null
  }
  if (activeMediaUrl) {
    URL.revokeObjectURL(activeMediaUrl)
    activeMediaUrl = null
  }
}

// iPhone の消音モードでは Web Audio (AudioContext) が無音になることがある。
// つくよみちゃんの波形は WAV にして通常の <audio> 経路で流すと、端末の
// 「メディア音量」として再生できる。これなら設定画面の再生状態だけが
// running なのに耳には何も聞こえない、という状態を避けられる。
function wavUrlFromSamples(samples, sampleRate) {
  const bytesPerSample = 2
  const dataSize = samples.length * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)
  const put = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i))
  }
  put(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  put(8, 'WAVE')
  put(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * bytesPerSample, true)
  view.setUint16(32, bytesPerSample, true)
  view.setUint16(34, 16, true)
  put(36, 'data')
  view.setUint32(40, dataSize, true)
  let offset = 44
  for (let i = 0; i < samples.length; i += 1, offset += 2) {
    const sample = Math.max(-1, Math.min(1, samples[i] || 0))
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
  }
  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }))
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

  if (id !== requestId || !enabled) return false

  return new Promise((resolve, reject) => {
    stopNarratorAudio()
    const url = wavUrlFromSamples(samples, sampleRate)
    activeMediaUrl = url
    const media = new Audio()
    media.preload = 'auto'
    media.playsInline = true
    media.volume = loudness
    media.src = url
    activeMedia = media
    let started = false
    let settled = false
    let watchdog = null
    const cleanup = () => {
      if (watchdog) clearTimeout(watchdog)
      watchdog = null
      media.onplaying = null
      media.onended = null
      media.onerror = null
      if (activeMedia === media) activeMedia = null
      if (activeMediaUrl === url) {
        URL.revokeObjectURL(url)
        activeMediaUrl = null
      }
    }
    const finish = (played) => {
      if (settled) return
      settled = true
      if (activeMedia === media && !media.paused) {
        try {
          media.pause()
          media.removeAttribute('src')
          media.load()
        } catch (_) { /* already stopped */ }
      }
      cleanup()
      if (stopActiveNarratorPlayback === stop) stopActiveNarratorPlayback = null
      resolve(played)
    }
    const fail = (error) => {
      if (settled) return
      settled = true
      cleanup()
      if (stopActiveNarratorPlayback === stop) stopActiveNarratorPlayback = null
      reject(error)
    }
    const stop = () => finish(false)
    stopActiveNarratorPlayback = stop
    media.onplaying = () => {
      if (id !== requestId || !enabled || started) return
      started = true
      // 「合成できた」ではなく、iPhoneの通常の音声プレーヤーが実際に
      // playing イベントを返した時だけ専用音声として表示する。
      narratorPlayback = 'app'
      narratorError = null
      narratorAudio = {
        seconds: Math.round((samples.length / sampleRate) * 10) / 10,
        peak: Math.round(peak * 100) / 100,
        context: 'media-playing'
      }
      narratorDetail = 'つくよみちゃんの音声を再生しました'
      notifyNarrator()
    }
    media.onended = () => finish(true)
    media.onerror = () => {
      fail(new Error('iPhoneの音声プレーヤーで再生できませんでした'))
    }
    media.play().catch((error) => {
      fail(error)
    })
    // iOSがバックグラウンド化などで ended を返さなくても、音声待機を
    // 永久に残さない。通常の再生を途中で止めないよう余裕を持たせる。
    watchdog = setTimeout(() => finish(false), Math.max(8000, (samples.length / sampleRate) * 1000 + 3000))
  })
}

async function speakWithNarrator(text, id, opts) {
  // 問題開始や画面移動からモデルを勝手に取得しない。保存済みの場合だけ起動する。
  const tts = await prepareNarratorVoice({ allowDownload: false })
  // rate は端末音声と共通の3段階設定。Piperは lengthScale が大きいほど
  // ゆっくりになるため反比例させる。標準を聞き取りやすく遅めに置き、
  // ゆっくり／はやめは一聴して区別できる幅を持たせる。
  const lengthScale = Math.max(0.72, Math.min(1.75, 0.98 / (opts.rate ?? rate)))
  const loudness = opts.volume ?? volume
  for (const sentence of splitForNarrator(text)) {
    if (id !== requestId || !enabled) return
    const inference = narratorInferenceQueue.then(() => tts.synthesize(sentence, {
        language: 'ja',
        lengthScale,
        // 同じモデルでも毎回ほんの少しだけ自然な抑揚が変わる。
        noiseScale: 0.54,
        noiseW: 0.62
      }))
    // キュー自身は大きなAudioResultを保持しない。成功・失敗のどちらでも
    // undefinedへ変換し、次の推論開始だけを順序づける。
    narratorInferenceQueue = inference.then(() => undefined, () => undefined)
    const result = await inference
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
  if (Number.isFinite(next.rate)) rate = Math.min(1.3, Math.max(0.55, next.rate))
  if (Number.isFinite(next.volume)) volume = Math.min(1, Math.max(0, next.volume))
  if (next.voiceStyle) voiceStyle = next.voiceStyle === 'device' ? 'device' : 'neural'
}

export function isTtsEnabled() { return enabled }

export function cancelSpeak() {
  requestId += 1
  if (pendingTimer) clearTimeout(pendingTimer)
  pendingTimer = null
  if (pendingResolve) {
    const resolve = pendingResolve
    pendingResolve = null
    resolve()
  }
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
      pendingResolve = null
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
    pendingResolve = resolve
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
