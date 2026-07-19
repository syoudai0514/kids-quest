// ============================================================
// BGM — 宇宙アンビエント（Web Audio 合成・ファイル不要）
//
// ゆっくり移り変わるパッド（コード）＋ときどき鳴るペンタトニックの
// きらめき音。音量はごく小さく、学習の邪魔をしない「空気」として鳴る。
// 保護者画面で ON/OFF できる。
// ============================================================

let ctx = null
let master = null
let running = false
let timers = []
let padNodes = []

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

// コード進行（Aマイナー系・浮遊感のある並び）
const CHORDS = [
  [110.0, 164.81, 220.0, 329.63], // Am
  [87.31, 130.81, 174.61, 261.63], // F
  [98.0, 146.83, 196.0, 293.66], // G
  [82.41, 123.47, 164.81, 246.94] // Em
]
// きらめき用ペンタトニック（A minor pentatonic 高め）
const SPARKLE = [440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5]

function startPad() {
  const a = ac()
  if (!a) return
  const lp = a.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 620
  lp.Q.value = 0.4
  lp.connect(master)

  let chordIdx = 0
  const oscs = []
  const gains = []
  for (let i = 0; i < 4; i++) {
    const o = a.createOscillator()
    o.type = i % 2 === 0 ? 'triangle' : 'sine'
    o.frequency.value = CHORDS[0][i]
    o.detune.value = (i - 1.5) * 4 // うっすらデチューンで厚みを
    const g = a.createGain()
    g.gain.value = 0.05
    o.connect(g)
    g.connect(lp)
    o.start()
    oscs.push(o)
    gains.push(g)
  }
  padNodes = [...oscs, ...gains, lp]

  // 8秒ごとにコードをゆっくり移す
  timers.push(
    setInterval(() => {
      if (!running) return
      chordIdx = (chordIdx + 1) % CHORDS.length
      const t = a.currentTime
      oscs.forEach((o, i) => {
        o.frequency.exponentialRampToValueAtTime(CHORDS[chordIdx][i], t + 2.5)
      })
    }, 8000)
  )

  // フィルタをゆらす（宇宙の「うねり」）
  timers.push(
    setInterval(() => {
      if (!running) return
      const t = a.currentTime
      lp.frequency.exponentialRampToValueAtTime(420 + Math.random() * 500, t + 3)
    }, 5000)
  )
}

function sparkle() {
  const a = ac()
  if (!a || !running) return
  const f = SPARKLE[Math.floor(Math.random() * SPARKLE.length)]
  const t0 = a.currentTime
  // 本体 + エコー2回
  for (let e = 0; e < 3; e++) {
    const o = a.createOscillator()
    o.type = 'sine'
    o.frequency.value = f * (e === 2 ? 2 : 1)
    const g = a.createGain()
    const start = t0 + e * 0.28
    const vol = 0.05 / (e + 1)
    g.gain.setValueAtTime(0.0001, start)
    g.gain.exponentialRampToValueAtTime(vol, start + 0.03)
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.9)
    o.connect(g)
    g.connect(master)
    o.start(start)
    o.stop(start + 1)
  }
}

export function startBgm() {
  const a = ac()
  if (!a || running) return
  running = true
  if (!master) {
    master = a.createGain()
    master.gain.value = 0.55
    master.connect(a.destination)
  }
  master.gain.setTargetAtTime(0.55, a.currentTime, 0.5)
  startPad()
  // きらめきは 2.5〜6秒 おきにランダム
  const loop = () => {
    if (!running) return
    sparkle()
    timers.push(setTimeout(loop, 2500 + Math.random() * 3500))
  }
  timers.push(setTimeout(loop, 1200))
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
