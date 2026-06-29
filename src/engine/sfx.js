// ============================================================
// 効果音（Web Audio API で合成。音声ファイル不要＝完全オフライン）
// ポジティブで気持ちのいい音だけ。失敗音も明るいトーンにする。
// ============================================================

let ctx = null
let enabled = true

function ac() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function setSfxEnabled(v) {
  enabled = v
}
export function isSfxEnabled() {
  return enabled
}

export function unlockSfx() {
  ac()
}

function tone(freq, start, dur, type = 'sine', gain = 0.18) {
  const a = ac()
  if (!a) return
  const t0 = a.currentTime + start
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g)
  g.connect(a.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

// よくある音をプリセット化
export const sfx = {
  tap() {
    if (!enabled) return
    tone(520, 0, 0.08, 'triangle', 0.12)
  },
  correct() {
    if (!enabled) return
    // 明るい上昇アルペジオ
    tone(523, 0, 0.12, 'triangle', 0.18)
    tone(659, 0.1, 0.12, 'triangle', 0.18)
    tone(784, 0.2, 0.18, 'triangle', 0.2)
  },
  wrongSoft() {
    if (!enabled) return
    // 否定的にならない、やわらかい「ぽよん」
    tone(330, 0, 0.12, 'sine', 0.14)
    tone(294, 0.1, 0.16, 'sine', 0.14)
  },
  reward() {
    if (!enabled) return
    tone(659, 0, 0.12, 'triangle', 0.18)
    tone(784, 0.1, 0.12, 'triangle', 0.18)
    tone(988, 0.2, 0.12, 'triangle', 0.18)
    tone(1319, 0.32, 0.3, 'triangle', 0.22)
  },
  levelUp() {
    if (!enabled) return
    tone(523, 0, 0.1, 'square', 0.12)
    tone(784, 0.1, 0.1, 'square', 0.12)
    tone(1047, 0.2, 0.28, 'square', 0.16)
  },
  hit() {
    if (!enabled) return
    tone(180, 0, 0.12, 'sawtooth', 0.16)
  },
  star() {
    if (!enabled) return
    tone(1047, 0, 0.08, 'triangle', 0.16)
    tone(1568, 0.07, 0.12, 'triangle', 0.16)
  }
}
