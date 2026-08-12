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
import { DEFAULT_TTS_RATE, narratorLengthScale } from '../config/ttsRates.js'
import { applyPronunciationOverrides } from './ttsPronunciation.js'

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
const englishVoiceListeners = new Set()
let englishVoiceEventsBound = false

function notifyEnglishVoices() {
  const ready = hasEnglishVoice()
  englishVoiceListeners.forEach((listener) => listener(ready))
}

/** 初回は空配列になり得るiOS/Safariでも、voiceschanged後の状態を画面へ伝える。 */
export function subscribeEnglishVoice(listener) {
  englishVoiceListeners.add(listener)
  if (typeof window !== 'undefined' && window.speechSynthesis && !englishVoiceEventsBound) {
    englishVoiceEventsBound = true
    window.speechSynthesis.addEventListener?.('voiceschanged', notifyEnglishVoices)
  }
  listener(hasEnglishVoice())
  return () => englishVoiceListeners.delete(listener)
}

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
    mode: 'dictionary',
    engine: 'つくよみちゃん（自然な日本語版）',
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
      // 旧PWAが保存した軽量版用のWASMを端末から外す。
      // 失敗しても自然な日本語版の起動には影響させない。
      await removeLegacyNarratorRuntimeCaches()
      // 大きな部品をPromise.allで同時展開すると、iPhone 11 Proでは一時的な
      // ピークメモリだけでPWAが終了する。小さいJS → WASM専用ORT → モデル →
      // 日本語辞書の順に一つずつ読み込む。
      const { PiperPlus, ModelManager } = await import('piper-plus')
      const ort = await import('onnxruntime-web/wasm')
      const { createJapanesePhonemizerModule } = await import('./dictionaryJapanesePhonemizer.js')
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
      const createdNarrator = await PiperPlus.initialize({
        // つきよみちゃん: 日本語の女性単一話者モデル（MIT）。
        model,
        // ModelManagerは音声本体と同じ設定JSONもIndexedDBへ保存する。
        // これをPiperへ直接渡し、「再ダウンロードなし」の起動時に
        // 小さな設定JSONだけ通信失敗する経路もなくす。
        modelConfig: cachedModel?.config,
        ort: narratorOrt,
        // 日本語辞書で漢字・助詞・説明文を自然に読み上げる。
        wasmLoader: async () => createJapanesePhonemizerModule(),
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
              ? '自然な日本語の辞書を読み込んでいます…（初回は時間がかかります）'
              : message || '準備しています…'
          narratorState = 'loading'
          narratorError = null
          notifyNarrator()
        }
      })
      narrator = createdNarrator
      // 音声モデルの保存だけでなく、選んだ実行部分の初期化まで
      // 通った時にだけ導入済みとする。起動失敗後のループを防ぐ。
      if (narratorStorage === 'cached' || narratorStorage === 'saved') markNarratorInstalled()
      narratorState = 'ready'
      narratorProgress = 100
      narratorDetail = narratorStorage === 'cached'
        ? '端末に保存した声を、自然な日本語で準備できました（モデルの再ダウンロードなし）'
        : narratorStorage === 'saved'
          ? '声を端末へ保存し、自然な日本語で準備できました'
          : '自然な日本語で準備できました'
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

export function hasEnglishVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false
  return window.speechSynthesis.getVoices().some((v) => /^en(-|_)/i.test(v.lang || ''))
}

function pickEnglishVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices().filter((v) => /^en(-|_)/i.test(v.lang || ''))
  // iPhone では日本語を優先言語にしていると、voice を指定せず lang だけを
  // en-US にしても日本語音声がローマ字を一文字ずつ読んでしまうことがある。
  // 必ず端末に登録された英語音声そのものを明示して使う。
  return voices.find((v) => /^en[-_]us$/i.test(v.lang)) || voices[0] || null
}

/** 英語のお手本。日本語ナビモデルは使わず、端末の英語音声で発音する。 */
export function speakEnglish(text, opts = {}) {
  return new Promise((resolve) => {
    if (!enabled || !text || typeof window === 'undefined' || !window.speechSynthesis) return resolve()
    const voice = pickEnglishVoice()
    // 英語音声がまだ端末に読み込まれていない時は、日本語音声へのフォールバック
    // で単語を「えむ・おー…」と読ませない。voiceschanged 後に改めて再生できる。
    if (!voice) return resolve()
    cancelSpeak()
    const id = ++requestId
    const u = new SpeechSynthesisUtterance(String(text))
    u.lang = voice.lang
    u.voice = voice
    u.rate = opts.rate ?? 0.78
    u.pitch = opts.pitch ?? 1
    u.volume = opts.volume ?? volume
    const finish = () => { if (id === requestId) resolve() }
    u.onend = finish
    u.onerror = finish
    window.speechSynthesis.speak(u)
  })
}

/** 英語の答えは英語音声、日本語の案内はナビ音声で、混ぜずに順に読む。 */
export async function speakEnglishThenJapanese(english, japanese, opts = {}) {
  if (english) await speakEnglish(english, opts)
  if (japanese) await speak(japanese, { ...opts, interrupt: false })
}

export async function speakJapaneseThenEnglish(japanese, english) {
  await speak(japanese)
  await new Promise((resolve) => setTimeout(resolve, 260))
  await speakEnglish(english, { interrupt: false })
}

// 算数の式や記号は、そのまま渡すと記号名で読まれたり読み飛ばされたりする。
// 「4ぶんの3」「2たい3」のように、子どもが授業で聞くとおりの言い方へ直す。
const SYMBOL_READING = [
  [/❓/g, 'なに'],
  // 時刻・日付は normalizeDateAndTimeForSpeech() が先に変換済み。
  // 分数は「◯ぶんの◯」。解説文（例: 4分の3にそろえる）で頻出なので
  // 記号処理のいちばん最初に置き、あとの「／→、」に食われないようにする。
  [/(\d+)\s*[/／]\s*(\d+)/g, '$2ぶんの$1'],
  // 比は「2たい3」。時刻・分数と混ざらないよう、数字どうしの場合だけ。
  [/(\d+)\s*[:：]\s*(\d+)/g, '$1たい$2'],
  [/([A-Za-z])\s*[:：]\s*([A-Za-z])/g, '$1たい$2'],
  [/[＋+]/g, ' たす '], [/[−-]/g, ' ひく '], [/×/g, ' かける '],
  [/÷/g, ' わる '], [/[＝=]/g, ' は '], [/[％%]/g, 'パーセント'],
  // 「→」は式の言いかえ。読点で一拍おくと、前後が別の値だと伝わる。
  [/[→⇒]/g, '、'],
  [/\bLv\.?\s*/gi, 'レベル'],
  [/[:：]/g, '、'],
  [/[・／]/g, '、'],
  [/～|〜/g, 'から'], [/[⭐✨🌟💫🎉🎊🚀📅🎌🔬🗾💗🕐👑⚔️❤️🎁]/g, '']
]

function normalizeDateAndTimeForSpeech(text) {
  return text
    // 日付を先に保護する。これを分数より後にすると 2026/08/11 が分数に化ける。
    .replace(/(\d{4})\s*[-/.／]\s*(\d{1,2})\s*[-/.／]\s*(\d{1,2})/g, (_all, year, month, day) => `${year}年${Number(month)}月${Number(day)}日`)
    // 分が2桁の表記は時刻として扱う。小学校の比 2:3 はこの対象にせず「2たい3」と読む。
    .replace(/\b(\d{1,2})\s*[:：]\s*(\d{2})(?!\d)/g, '$1時$2分')
}

export function normalizeForSpeech(text) {
  let s = String(text).normalize('NFKC')
  // 表示用の「こん虫」などを、辞書へ渡す前に正しい単語の読みへ直す。
  // これを記号処理や空白除去の前に行うことで、かな＋漢字の表記も拾える。
  s = applyPronunciationOverrides(s)
  s = normalizeDateAndTimeForSpeech(s)
  for (const [re, to] of SYMBOL_READING) s = s.replace(re, to)
  for (let i = 0; i < 3; i += 1) {
    s = s.replace(/([぀-ゟ゠-ヿ一-鿿0-9０-９])[ 　]+([぀-ゟ゠-ヿ一-鿿0-9０-９])/g, '$1$2')
  }
  return s
    .replace(/[「『（(]/g, '、')
    .replace(/[」』）)]/g, '、')
    .replace(/\n+/g, '、')
    // かっこを読点に置き換えると「、、」や句点の直前の読点が生まれ、
    // 不自然な間になる。重なり→前後の空白→句点前→文末、の順に整える。
    .replace(/\s*、\s*/g, '、')
    .replace(/[、,]{2,}/g, '、')
    .replace(/、(?=[。！？!?])/g, '')
    .replace(/、+\s*$/g, '')
    .replace(/[。．]{2,}/g, '。')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function splitForNarrator(text) {
  // iPhone のPWAは、大きな推論結果（Float32Array）とWAV用バッファを同時に
  // 保持するとOSに終了されることがある。長い説明を一息に作らず、小さな
  // かたまりごとに「合成→再生→解放」する。内容は省略しない。
  const maxChars = isAppleTouchDevice() ? 18 : 24
  const parts = text.match(/[^、。！？!?]+[、。！？!?]?/g) || [text]
  const result = []
  const withListeningPause = (value) => {
    const trimmed = value.trim()
    if (!trimmed) return null
    // 推論用の分割で文節の途中を切る場合も、助詞や単語を詰め込まず一拍置く。
    // これは個別の問題文に依存せず、今後の長い説明文にも効く。
    return /[、。！？!?]$/.test(trimmed) ? trimmed : `${trimmed}、`
  }
  let current = ''
  const pushChunks = (value) => {
    for (let start = 0; start < value.length; start += maxChars) {
      const chunk = withListeningPause(value.slice(start, start + maxChars))
      if (chunk) result.push(chunk)
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
function wavUrlFromSamples(samples, sampleRate, gain = 1) {
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
    const sample = Math.max(-1, Math.min(1, (samples[i] || 0) * gain))
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
  for (let i = 0; i < samples.length; i += 1) {
    const value = Math.abs(samples[i])
    if (Number.isFinite(value)) peak = Math.max(peak, value)
  }
  if (peak < 0.001) throw new Error('専用音声の波形が無音でした')

  if (id !== requestId || !enabled) return false

  return new Promise((resolve, reject) => {
    stopNarratorAudio()
    // 文によって声量が小さくなり過ぎないよう、歪まない範囲で音量をそろえる。
    // 端末の音量設定を上げなくても、子どもが聞き取れる一貫した大きさにする。
    const gain = Math.min(1.35, 0.82 / peak)
    const url = wavUrlFromSamples(samples, sampleRate, gain)
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
  // ゆっくりになる。つくよみちゃんは子どもの聞き取りを基準にした変換を使う。
  const lengthScale = narratorLengthScale(opts.rate ?? rate)
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

// speak() 全体の保険タイムアウト。専用音声の再生そのものには
// playNarratorResult 内に個別のwatchdogがあるが、それより前の段階
// （モデルの動的import・IndexedDBからの読み込み・WASM推論、あるいは
// 端末音声のonend/onerrorが実機で発火しない場合）には保護がなく、
// 一度ハングすると narratorPromise がそのセッション中ずっと解決せず、
// 以降の全ての問題が「フリーズしてホーム画面に戻るしかない」状態に
// なっていた。学習の進行を音声の完了より優先し、必ずここで打ち切る。
const SPEAK_WATCHDOG_MS = 12000

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
    let settled = false
    const settle = () => {
      if (settled) return
      settled = true
      resolve()
    }
    const start = async () => {
      pendingTimer = null
      pendingResolve = null
      if (id !== requestId || !enabled) return settle()
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
      settle()
    }
    // Safari の cancel 直後の無音を避ける短い間隔。
    pendingResolve = settle
    pendingTimer = setTimeout(start, opts.interrupt === false ? 0 : 70)
    setTimeout(settle, SPEAK_WATCHDOG_MS)
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
