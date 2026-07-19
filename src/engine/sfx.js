// ============================================================
// 効果音（Web Audio API で合成。音声ファイル不要＝完全オフライン）
// v3: BGM と同じ「共有 AudioContext」を使う（別々に作ると
//     スマホで効果音だけ無音になることがあったため一本化）。
// ============================================================

import { getCtx, unlockAudio } from './audioCtx.js'

let enabled = true

function ac() {
  return getCtx()
}

export function setSfxEnabled(v) {
  enabled = v
}
export function isSfxEnabled() {
  return enabled
}
export function unlockSfx() {
  unlockAudio()
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

// エコーつきトーン（キラッと響く）
function toneEcho(freq, start, dur, type = 'triangle', gain = 0.18) {
  tone(freq, start, dur, type, gain)
  tone(freq, start + 0.16, dur, type, gain * 0.4)
  tone(freq * 2, start + 0.32, dur * 0.8, 'sine', gain * 0.18)
}

// ノイズヒット（バトルの打撃感）
function noiseHit(start, dur = 0.16, gain = 0.22, freq = 700) {
  const a = ac()
  if (!a) return
  const t0 = a.currentTime + start
  const len = Math.floor(a.sampleRate * dur)
  const buf = a.createBuffer(1, len, a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = a.createBufferSource()
  src.buffer = buf
  const f = a.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = freq
  const g = a.createGain()
  g.gain.value = gain
  src.connect(f)
  f.connect(g)
  g.connect(a.destination)
  src.start(t0)
}

export const sfx = {
  tap() {
    if (!enabled) return
    tone(620, 0, 0.06, 'triangle', 0.1)
    tone(930, 0.03, 0.08, 'sine', 0.07)
  },
  correct() {
    if (!enabled) return
    // 明るいメジャー和音アルペジオ＋エコー
    tone(523, 0, 0.1, 'triangle', 0.16)
    tone(659, 0.08, 0.1, 'triangle', 0.16)
    toneEcho(784, 0.16, 0.22, 'triangle', 0.2)
  },
  wrongSoft() {
    if (!enabled) return
    // 責めない、やわらかい「ぽよん？」（少し上がって「もう1回いこう」の合図）
    tone(392, 0, 0.12, 'sine', 0.12, 523)
    tone(523, 0.11, 0.12, 'triangle', 0.07)
  },
  reward() {
    if (!enabled) return
    tone(659, 0, 0.1, 'triangle', 0.16)
    tone(784, 0.09, 0.1, 'triangle', 0.16)
    tone(988, 0.18, 0.1, 'triangle', 0.16)
    toneEcho(1319, 0.28, 0.4, 'triangle', 0.22)
  },
  levelUp() {
    if (!enabled) return
    // 克服・解放の「キュイン！」
    tone(523, 0, 0.09, 'square', 0.1)
    tone(659, 0.07, 0.09, 'square', 0.1)
    tone(784, 0.14, 0.09, 'square', 0.1)
    tone(1047, 0.22, 0.3, 'square', 0.14)
    toneEcho(1568, 0.34, 0.4, 'sine', 0.14)
    tone(400, 0, 0.5, 'sine', 0.06, 1600)
  },
  fanfare() {
    if (!enabled) return
    const seq = [
      [523, 0], [659, 0.11], [784, 0.22], [1047, 0.36]
    ]
    for (const [f, t] of seq) {
      tone(f, t, 0.16, 'triangle', 0.2)
      tone(f * 0.5, t, 0.16, 'triangle', 0.1) // オクターブ下で厚み
    }
    tone(784, 0.56, 0.1, 'triangle', 0.14)
    toneEcho(1047, 0.66, 0.5, 'triangle', 0.24)
  },
  hit() {
    if (!enabled) return
    // ポンッと当たる、まるい打撃（暗いノコギリ波はやめて明るく）
    noiseHit(0, 0.12, 0.16, 1400)
    tone(330, 0, 0.09, 'triangle', 0.14, 180)
    tone(660, 0, 0.06, 'sine', 0.06)
  },
  hitBig() {
    if (!enabled) return
    // 大ヒットは元気に「ドンッ☆」（低いうなりより、はずむ高音を効かせる）
    noiseHit(0, 0.16, 0.24, 1800)
    tone(392, 0, 0.1, 'triangle', 0.16, 196)
    tone(784, 0.02, 0.14, 'triangle', 0.1)
    tone(1319, 0.06, 0.18, 'sine', 0.08)
  },
  swoosh() {
    if (!enabled) return
    tone(1200, 0, 0.28, 'sine', 0.1, 180)
    noiseHit(0.02, 0.22, 0.06, 2000)
  },
  pop() {
    if (!enabled) return
    tone(400, 0, 0.06, 'sine', 0.16, 900)
  },
  star() {
    if (!enabled) return
    toneEcho(1047, 0, 0.1, 'triangle', 0.14)
  },
  cry(seed = 0) {
    if (!enabled) return
    const base = 300 + (seed % 7) * 60
    const wob = 1 + ((seed >> 3) % 3) * 0.3
    tone(base, 0, 0.12, 'square', 0.1, base * 1.4)
    tone(base * 1.5, 0.12, 0.16, 'square', 0.1, base * wob)
  }
}
