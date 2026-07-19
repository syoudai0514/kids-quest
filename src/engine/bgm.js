// ============================================================
// BGM — きらきら宇宙アドベンチャー（Web Audio 合成・ファイル不要）
//
// 明るいメジャー（長調）のコード進行に、ぴょんぴょん跳ねる
// アルペジオと やわらかいベースの軽いリズムを重ねた、
// 子供向けの わくわく・クールな冒険サウンド。
// 音は角を丸めて（ソフトなローパス）長く聴いても疲れないように。
// 音量はごく小さめ。保護者画面で ON/OFF できる。
// ============================================================

let ctx = null
let master = null
let running = false
let timers = []
let padNodes = []
let stepIdx = 0

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

// 明るいポップ進行 C→G→Am→F（子供にもなじみの「元気な」流れ）
// 各コード: bass=ベース音 / arp=アルペジオの4音 / pad=パッドの和音
const PROG = [
  { bass: 130.81, arp: [261.63, 329.63, 392.0, 523.25], pad: [261.63, 329.63, 392.0] }, // C
  { bass: 196.0, arp: [246.94, 293.66, 392.0, 493.88], pad: [246.94, 293.66, 392.0] }, // G
  { bass: 220.0, arp: [261.63, 329.63, 440.0, 523.25], pad: [220.0, 329.63, 440.0] }, // Am
  { bass: 174.61, arp: [261.63, 349.23, 440.0, 523.25], pad: [261.63, 349.23, 440.0] } // F
]
// アルペジオの跳ねパターン（上って下ってを ぴょんぴょん）
const ARP_PATTERN = [0, 1, 2, 3, 2, 3, 1, 2]
// たまに鳴る高い きらめき（Cメジャーペンタトニック）
const TWINKLE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5]

const STEP_MS = 235 // 8分音符 ≒ 128BPM の軽快なテンポ

// やわらかい単音（丸いプラック）
function pluck(freq, when, dur, { type = 'triangle', gain = 0.06, cutoff = 2200 } = {}) {
  const a = ac()
  if (!a) return
  const t0 = when
  const o = a.createOscillator()
  const g = a.createGain()
  const lp = a.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(cutoff, t0)
  lp.frequency.exponentialRampToValueAtTime(Math.max(500, cutoff * 0.4), t0 + dur)
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(lp)
  lp.connect(g)
  g.connect(master)
  o.start(t0)
  o.stop(t0 + dur + 0.03)
}

function startPad() {
  const a = ac()
  if (!a) return
  const lp = a.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 1600 // 620→1600 でこもりを解消（明るく）
  lp.Q.value = 0.3
  lp.connect(master)

  const oscs = []
  const gains = []
  const first = PROG[0].pad
  for (let i = 0; i < 3; i++) {
    const o = a.createOscillator()
    o.type = i === 0 ? 'triangle' : 'sine'
    o.frequency.value = first[i]
    o.detune.value = (i - 1) * 3 // うっすら厚みを
    const g = a.createGain()
    g.gain.value = 0.028 // ごく静かな下敷き
    o.connect(g)
    g.connect(lp)
    o.start()
    oscs.push(o)
    gains.push(g)
  }
  padNodes = [...oscs, ...gains, lp]
  return oscs
}

function twinkle(when) {
  const a = ac()
  if (!a) return
  const f = TWINKLE[Math.floor(Math.random() * TWINKLE.length)]
  pluck(f, when, 0.5, { type: 'sine', gain: 0.045, cutoff: 4000 })
  pluck(f * 2, when + 0.14, 0.4, { type: 'sine', gain: 0.02, cutoff: 5000 })
}

export function startBgm() {
  const a = ac()
  if (!a || running) return
  running = true
  if (!master) {
    master = a.createGain()
    master.gain.value = 0.5
    master.connect(a.destination)
  }
  master.gain.setTargetAtTime(0.5, a.currentTime, 0.5)
  stepIdx = 0
  const padOscs = startPad()

  // 8分音符ごとのシーケンサー（アルペジオ＋ベース＋コード切替）
  timers.push(
    setInterval(() => {
      if (!running) return
      const now = ac()
      if (!now) return
      const t = ctx.currentTime + 0.02
      const chordIdx = Math.floor(stepIdx / 8) % PROG.length
      const chord = PROG[chordIdx]
      const s = stepIdx % 8

      // アルペジオ（毎ステップ、ぴょんぴょん）
      const arpNote = chord.arp[ARP_PATTERN[s]]
      pluck(arpNote, t, 0.22, { type: 'triangle', gain: 0.055, cutoff: 2400 })

      // ベース（1・3拍目でぽん、ぽん）
      if (s === 0 || s === 4) {
        pluck(chord.bass, t, 0.34, { type: 'sine', gain: 0.09, cutoff: 900 })
      }
      // 裏拍で軽いきらめき（ときどき）
      if (s === 6 && Math.random() < 0.5) twinkle(t)

      // コードの頭でパッドをなめらかに移す
      if (s === 0 && padOscs) {
        padOscs.forEach((o, i) => {
          o.frequency.exponentialRampToValueAtTime(chord.pad[i], t + 0.4)
        })
      }
      stepIdx++
    }, STEP_MS)
  )
}

export function stopBgm() {
  running = false
  for (const t of timers) {
    clearInterval(t)
    clearTimeout(t)
  }
  timers = []
  for (const n of padNodes) {
    try {
      if (n.stop) n.stop()
      n.disconnect()
    } catch (_) {
      /* noop */
    }
  }
  padNodes = []
}

export function setBgmEnabled(v) {
  if (v) startBgm()
  else stopBgm()
}
