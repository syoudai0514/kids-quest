// ============================================================
// 日本語の音声読み上げ（Web Speech API）
// 指示・問題文・正誤は必ずこれを通して声でも伝える。
// 5歳が一人で操作できるよう、テキストが出るところは必ず speak する想定。
// ============================================================

let jaVoice = null
let voicesReady = false
let voiceStyle = 'gentle'

// 端末ごとに入っている日本語音声名は違う。声名を一つに固定すると iPhone /
// Android / PC のどれかで無音になるので、キャラクターごとに「近い声」の順番を
// 持ち、実際に使える声へフォールバックする。
const VOICE_STYLES = {
  gentle: [
    'kyoko', 'o-ren', 'nanami', 'ayumi', 'haruka',
    'google 日本語', 'google japanese', 'ja-jp-neural', 'ja-jp-wavenet'
  ],
  lively: [
    'sora', 'otoya', 'keita', 'hattori',
    'google 日本語', 'google japanese', 'ja-jp-neural', 'ja-jp-wavenet'
  ]
}

function pickJapaneseVoice(style = 'gentle') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  const jaAll = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('ja'))
  if (!jaAll.length) return null
  // 「やさしい おねえさん」を標準にする。端末に無ければ、同じ日本語音声の
  // なかから質のよいものを選ぶので、音が出なくなることはない。
  for (const want of VOICE_STYLES[style] || VOICE_STYLES.gentle) {
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
  if (voicesReady && jaVoice) return
  jaVoice = pickJapaneseVoice(voiceStyle)
  if (jaVoice) voicesReady = true
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  // voices は非同期で揃うことがある
  window.speechSynthesis.onvoiceschanged = () => {
    jaVoice = pickJapaneseVoice(voiceStyle)
    voicesReady = !!jaVoice
  }
  ensureVoices()
}

let enabled = true
// 読み上げの好みはセーブデータ側で保持し、ここは実行時の設定だけ持つ。
// iOS は cancel() の直後に speak() すると、次の発話まで無音になることがある。
// ほんの短い間を空け、最新の1件だけを話すようにしている。
let rate = 0.96
let volume = 0.9
let requestId = 0
let pendingTimer = null
let activeResolve = null

export function setTtsEnabled(v) {
  enabled = v
  if (!v) cancelSpeak()
}

export function setTtsPreferences(next = {}) {
  if (Number.isFinite(next.rate)) rate = Math.min(1.15, Math.max(0.75, next.rate))
  if (Number.isFinite(next.volume)) volume = Math.min(1, Math.max(0, next.volume))
  if (next.voiceStyle && VOICE_STYLES[next.voiceStyle]) {
    voiceStyle = next.voiceStyle
    jaVoice = pickJapaneseVoice(voiceStyle)
    voicesReady = !!jaVoice
  }
}

export function isTtsEnabled() {
  return enabled
}

export function cancelSpeak() {
  requestId += 1
  if (pendingTimer) {
    clearTimeout(pendingTimer)
    pendingTimer = null
  }
  if (activeResolve) {
    activeResolve()
    activeResolve = null
  }
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
    if (opts.interrupt !== false) cancelSpeak()

    const said = normalizeForSpeech(text)
    if (!said) {
      resolve()
      return
    }
    const id = ++requestId
    const start = () => {
      pendingTimer = null
      if (id !== requestId || !enabled) {
        resolve()
        return
      }
      const u = new SpeechSynthesisUtterance(said)
      u.lang = 'ja-JP'
      if (jaVoice) u.voice = jaVoice
      // 子ども向けには、少しゆっくりを標準にする。保護者画面で変更可能。
      u.rate = opts.rate ?? rate
      // デフォルトは、速すぎず少し明るい「おねえさんナビ」の雰囲気。
      // 実在人物や特定サービスの声を模倣せず、端末の合成音声だけで作る。
      u.pitch = opts.pitch ?? (voiceStyle === 'gentle' ? 1.13 : 1.03)
      u.volume = opts.volume ?? volume
      activeResolve = () => resolve()
      const finish = () => {
        if (id !== requestId) return
        activeResolve = null
        opts.onEnd && opts.onEnd()
        resolve()
      }
      u.onend = finish
      u.onerror = finish
      synth.speak(u)
    }
    // cancel → 即speak が不安定な Safari でも、発話が切れずに再開する。
    pendingTimer = setTimeout(start, opts.interrupt === false ? 0 : 70)
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
