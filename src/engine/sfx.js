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

function tone(freq, start, dur, type = 'sine', gain = 0.18, slideTo = null) {
  const a = ac()
  if (!a) return
  const t0 = a.currentTime + start
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g)
  g.connect(a.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

export const sfx = {
  tap() {
    if (!enabled) return
    tone(520, 0, 0.08, 'triangle', 0.12)
  },
  correct() {
    if (!enabled) return
    tone(523, 0, 0.12, 'triangle', 0.18)
    tone(659, 0.1, 0.12, 'triangle', 0.18)
    tone(784, 0.2, 0.18, 'triangle', 0.2)
  },
  wrongSoft() {
    if (!enabled) return
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
  fanfare() {
    if (!enabled) return
    tone(523, 0, 0.14, 'triangle', 0.2)
    tone(659, 0.12, 0.14, 'triangle', 0.2)
    tone(784, 0.24, 0.14, 'triangle', 0.2)
    tone(1047, 0.38, 0.22, 'triangle', 0.24)
    tone(784, 0.58, 0.1, 'triangle', 0.16)
    tone(1047, 0.68, 0.4, 'triangle', 0.24)
  },
  hit() {
    if (!enabled) return
    tone(180, 0, 0.12, 'sawtooth', 0.16)
  },
  hitBig() {
    if (!enabled) return
    tone(220, 0, 0.1, 'sawtooth', 0.2)
    tone(140, 0.06, 0.16, 'sawtooth', 0.2)
  },
  swoosh() {
    if (!enabled) return
    tone(900, 0, 0.25, 'sine', 0.12, 200)
  },
  pop() {
    if (!enabled) return
    tone(400, 0, 0.06, 'sine', 0.16, 900)
  },
  star() {
    if (!enabled) return
    tone(1047, 0, 0.08, 'triangle', 0.16)
    tone(1568, 0.07, 0.12, 'triangle', 0.16)
  },
  // モンスターごとの鳴き声（idのシードで音程が変わる）
  cry(seed = 0) {
    if (!enabled) return
    const base = 300 + (seed % 7) * 60
    const wob = 1 + ((seed >> 3) % 3) * 0.3
    tone(base, 0, 0.12, 'square', 0.1, base * 1.4)
    tone(base * 1.5, 0.12, 0.16, 'square', 0.1, base * wob)
  }
}
