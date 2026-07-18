// ============================================================
// 指でなぞる文字書きキャンバス（「かく」分野）
//
// v2: 1画ずつ、正しい書き順でなぞる方式（旧: 文字全体を1枚絵として
// 好きな順・好きな場所からなぞれば通ってしまう方式だった）。
//
// 仕組み:
//  - STROKE_ORDER（strokeOrder.js）に、その文字の正しい画の順番・
//    始点・おおまかな向きが入っている。
//  - 今の画だけをハイライト表示し、始点に光る点を出す。
//  - 判定は「指を離した瞬間」だけ行う（＝なぞっている途中で
//    勝手に終わらない。書いている途中で終わってしまう不具合の修正）。
//  - 採点は、画の線の上に等間隔で置いたサンプル点のうち、指が
//    どれだけ近くを通ったかで判定する（面を塗りつぶす方式だと、
//    許容はばを広げるほど逆に「細い指の線では埋めきれない」
//    という矛盾が起きるため、線に沿った判定に変更した）。
//  - なぞれていたら次の画へ。なぞれていなければインクを消して
//    もう一度（何度でもやり直せる。減点はしない）。
//  - 全画おわったら星評価（やり直し回数が少ないほど星が多い）。
//  - 「かけた！」でいつでも先に進める（苦手意識を持たせない）。
//    ただし全画終わる前に使った場合は「まだ練習中」として記録され、
//    後日また出題される（復習キュー）。
//
// STROKE_ORDER にデータが無い文字は、旧来の「文字全体コピー」方式に
// フォールバックする（安全策。実際には全文字にデータがある）。
// ============================================================

import React, { useEffect, useRef, useState } from 'react'
import { speak } from '../engine/tts.js'
import { sfx } from '../engine/sfx.js'
import { STROKE_ORDER } from '../data/strokeOrder.js'

const RES = 320
const GRID = 28
const PATH_TOLERANCE = RES * 0.17 // 線からこれだけ離れていても「近く」とみなす
const START_RADIUS = RES * 0.26 // 画の始点からこの範囲で描き始めれば「正しい始点」
const STROKE_THRESHOLD = 0.75 // 線に沿って、ここまで進めたら合格
const WHOLE_THRESHOLD = 0.6 // フォールバック（文字全体・面積方式）用

const FONT = (size) =>
  `bold ${size}px 'Hiragino Maru Gothic ProN','Yu Gothic','M PLUS Rounded 1c',sans-serif`

function toPx(pt) {
  return { x: (pt[0] / 100) * RES, y: (pt[1] / 100) * RES }
}

// 折れ線（1画）を px 座標に変換し、区間長・総延長を前計算しておく
function buildPolyline(points) {
  const px = points.map(toPx)
  const segLens = []
  let total = 0
  for (let i = 1; i < px.length; i++) {
    const len = Math.hypot(px[i].x - px[i - 1].x, px[i].y - px[i - 1].y)
    segLens.push(len)
    total += len
  }
  return { px, segLens, total: Math.max(1, total) }
}

// 点 p が折れ線のどのあたり（0〜1、始点からの弧長の割合）に一番近いかを求める。
// 線から PATH_TOLERANCE より離れている場合は null（「なぞっていない」扱い）。
function projectOnPolyline(poly, p, tolerance) {
  let bestDistSq = Infinity
  let bestLen = 0
  let acc = 0
  for (let i = 0; i < poly.px.length - 1; i++) {
    const a = poly.px[i]
    const b = poly.px[i + 1]
    const abx = b.x - a.x
    const aby = b.y - a.y
    const lenSq = abx * abx + aby * aby || 1e-6
    let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / lenSq
    t = Math.max(0, Math.min(1, t))
    const cx = a.x + abx * t
    const cy = a.y + aby * t
    const dSq = (p.x - cx) ** 2 + (p.y - cy) ** 2
    if (dSq < bestDistSq) {
      bestDistSq = dSq
      bestLen = acc + t * (poly.segLens[i] || 0)
    }
    acc += poly.segLens[i] || 0
  }
  if (Math.sqrt(bestDistSq) > tolerance) return null
  return bestLen / poly.total
}

// 文字全体（フォールバック用）のインクマスクを作る（面積方式）
function buildGlyphMask(target) {
  const off = document.createElement('canvas')
  off.width = RES
  off.height = RES
  const ctx = off.getContext('2d')
  ctx.font = FONT(RES * 0.72)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.fillText(target, RES / 2, RES / 2 + RES * 0.02)
  const data = ctx.getImageData(0, 0, RES, RES).data
  const cell = RES / GRID
  const mask = new Uint8Array(GRID * GRID)
  let total = 0
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      let ink = false
      const x0 = Math.floor(gx * cell)
      const y0 = Math.floor(gy * cell)
      for (let y = y0; y < y0 + cell && !ink; y += 2) {
        for (let x = x0; x < x0 + cell && !ink; x += 2) {
          if (data[(y * RES + x) * 4 + 3] > 40) ink = true
        }
      }
      if (ink) {
        mask[gy * GRID + gx] = 1
        total++
      }
    }
  }
  return { mask, total: Math.max(1, total) }
}

// 現在の画（または文字全体）を、うすい背景ガイドとして描く
function paintGuide(canvas, target, currentStroke, showFull, showCurrent) {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, RES, RES)
  if (showFull) {
    ctx.save()
    ctx.font = FONT(RES * 0.72)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'rgba(255,255,255,0.14)'
    ctx.fillText(target, RES / 2, RES / 2 + RES * 0.02)
    ctx.restore()
  }
  if (showCurrent && currentStroke) {
    ctx.save()
    ctx.strokeStyle = 'rgba(255,209,102,0.65)'
    ctx.lineWidth = RES * 0.09
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    currentStroke.forEach((p, i) => {
      const px = toPx(p)
      if (i === 0) ctx.moveTo(px.x, px.y)
      else ctx.lineTo(px.x, px.y)
    })
    ctx.stroke()
    ctx.restore()
  }
}

export default function TracingCanvas({ target, stage, onComplete }) {
  const bgRef = useRef(null)
  const fgRef = useRef(null)
  const polyRef = useRef(null) // 今の画の折れ線（px座標）
  const progressRef = useRef(0) // 線に沿ってどこまで進めたか（0〜1の最大値）
  const startOkRef = useRef(false) // この試行が正しい始点から始まったか
  const maskRef = useRef(null) // フォールバック（文字全体）の面マスク
  const coveredRef = useRef(null) // フォールバック用の塗り済みセル
  const drawingRef = useRef(false)
  const lastRef = useRef(null)
  const hasInkRef = useRef(false) // この画の試行で実際に描いたか
  const doneRef = useRef(false)

  const strokes = STROKE_ORDER[target] || null
  const useWhole = !strokes // フォールバック（実際にはまず使われない）

  const [phase, setPhase] = useState('write') // 'demo' | 'write' | 'done'
  const [strokeIndex, setStrokeIndex] = useState(0)
  const [showGuide, setShowGuide] = useState(stage === 'trace')
  const [coverage, setCoverage] = useState(0)
  const [retries, setRetries] = useState(0)
  const [stars, setStars] = useState(0)
  const [startDot, setStartDot] = useState(null)

  const totalStrokes = useWhole ? 1 : strokes.length

  const redrawGuide = (idx, guideOn) => {
    if (!bgRef.current) return
    const cur = useWhole ? null : strokes[idx]
    paintGuide(bgRef.current, target, cur, guideOn, guideOn)
    if (cur) {
      const p = toPx(cur[0])
      setStartDot({ x: (p.x / RES) * 100, y: (p.y / RES) * 100 })
    } else {
      setStartDot(null)
    }
  }

  const rebuildScoring = (idx) => {
    if (useWhole) {
      maskRef.current = buildGlyphMask(target)
      coveredRef.current = new Uint8Array(GRID * GRID)
    } else {
      polyRef.current = buildPolyline(strokes[idx])
      progressRef.current = 0
    }
    startOkRef.current = false
    setCoverage(0)
  }

  // 文字が変わるたびに初期化
  useEffect(() => {
    doneRef.current = false
    setStars(0)
    setRetries(0)
    setStrokeIndex(0)
    setShowGuide(stage === 'trace')
    hasInkRef.current = false
    const fg = fgRef.current
    if (fg) fg.getContext('2d').clearRect(0, 0, RES, RES)

    rebuildScoring(0)

    if (stage === 'trace') {
      setPhase('demo')
      if (bgRef.current) paintGuide(bgRef.current, target, null, false, false)
      const t = setTimeout(() => {
        setPhase('write')
        redrawGuide(0, true)
        speak(
          totalStrokes > 1
            ? 'よし、きみの ばん！ ひかる ところから 1かくめを なぞってね'
            : 'よし、きみの ばん！ ひかる ところから なぞってね'
        )
      }, 2100)
      return () => clearTimeout(t)
    }
    setPhase('write')
    redrawGuide(0, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, stage])

  // showGuide トグル（自由書きモードの「おてほん」ボタン）
  useEffect(() => {
    if (phase === 'write') redrawGuide(strokeIndex, showGuide)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGuide])

  const pointFromEvent = (e) => {
    const fg = fgRef.current
    const rect = fg.getBoundingClientRect()
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
    const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
    return { x: (cx / rect.width) * RES, y: (cy / rect.height) * RES }
  }

  // 面積方式（フォールバック専用）
  const markCoveredArea = (p) => {
    const m = maskRef.current
    const cov = coveredRef.current
    if (!m || !cov) return null
    const cell = RES / GRID
    const gx = Math.floor(p.x / cell)
    const gy = Math.floor(p.y / cell)
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = gx + dx
        const y = gy + dy
        if (x < 0 || y < 0 || x >= GRID || y >= GRID) continue
        const idx = y * GRID + x
        if (m.mask[idx] && !cov[idx]) cov[idx] = 1
      }
    }
    let c = 0
    for (let i = 0; i < cov.length; i++) c += cov[i]
    return c / m.total
  }

  const start = (e) => {
    if (doneRef.current || phase !== 'write') return
    e.preventDefault()
    drawingRef.current = true
    hasInkRef.current = true
    const p = pointFromEvent(e)
    lastRef.current = p
    if (!useWhole && strokes) {
      // この試行が「正しい始点」の近くから始まったかを記録
      // （書き順＝どこから書き始めるかを、ここで実際にチェックしている）
      const startPx = toPx(strokes[strokeIndex][0])
      startOkRef.current = Math.hypot(p.x - startPx.x, p.y - startPx.y) <= START_RADIUS
    }
  }

  const move = (e) => {
    if (!drawingRef.current || doneRef.current) return
    e.preventDefault()
    const p = pointFromEvent(e)
    const ctx = fgRef.current.getContext('2d')
    ctx.strokeStyle = '#7af0d0'
    ctx.lineWidth = RES * 0.07
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    const last = lastRef.current || p
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    lastRef.current = p

    // 採点は「なぞった量」を記録するだけ。ここでは絶対に完了判定しない
    // （＝描いている途中でいきなり終わる不具合の直接の原因だったため、
    //   判定は必ず指を離した瞬間 end() でのみ行う）。
    if (useWhole) {
      const cov = markCoveredArea(p)
      if (cov != null) setCoverage(cov)
    } else if (startOkRef.current) {
      // 正しい始点から始めた試行のときだけ、線に沿った進み具合を更新する
      // （始点が違う試行は、最後までなぞってもコレクション扱いにしない）
      const t = projectOnPolyline(polyRef.current, p, PATH_TOLERANCE)
      if (t != null) progressRef.current = Math.max(progressRef.current, t)
      setCoverage(progressRef.current)
    }
  }

  // 指を離した瞬間だけ、この画が合格かどうかを判定する
  const end = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    lastRef.current = null
    if (doneRef.current || phase !== 'write' || !hasInkRef.current) return
    hasInkRef.current = false

    const threshold = useWhole ? WHOLE_THRESHOLD : STROKE_THRESHOLD
    if (coverage >= threshold) {
      advanceStroke()
    } else {
      // おしい！ このインクは消してもう一度（減点はしない。回数だけ記録）
      setRetries((r) => r + 1)
      sfx.wrongSoft()
      const fg = fgRef.current
      if (fg) fg.getContext('2d').clearRect(0, 0, RES, RES)
      rebuildScoring(strokeIndex)
    }
  }

  const advanceStroke = () => {
    const fg = fgRef.current
    if (fg) fg.getContext('2d').clearRect(0, 0, RES, RES)
    const next = strokeIndex + 1
    if (next >= totalStrokes) {
      finishAll(true)
      return
    }
    sfx.pop()
    setStrokeIndex(next)
    rebuildScoring(next)
    redrawGuide(next, showGuide)
  }

  const finishAll = (completedAllStrokes) => {
    if (doneRef.current) return
    doneRef.current = true
    const n = !completedAllStrokes ? 1 : retries === 0 ? 3 : retries <= 2 ? 2 : 1
    setStars(n)
    setPhase('done')
    sfx.correct()
    const praise = n === 3 ? 'ほし みっつ！ さすが！' : n === 2 ? 'じょうずに かけたね！' : 'かけたね！ そのちょうし！'
    speak(`${target}。 ${praise}`)
    setTimeout(() => onComplete(completedAllStrokes), 1300)
  }

  const clearDrawing = () => {
    const fg = fgRef.current
    if (fg) fg.getContext('2d').clearRect(0, 0, RES, RES)
    rebuildScoring(strokeIndex)
    sfx.tap()
  }

  // まだ全画終わっていない状態で「かけた！」→ 練習中として記録し先へ進む
  const forceFinish = () => {
    finishAll(false)
  }

  const pct = Math.min(100, Math.round(coverage * 100))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      {totalStrokes > 1 && phase === 'write' && (
        <div className="muted" style={{ fontWeight: 800, fontSize: 'clamp(14px,2.4vw,18px)' }}>
          {strokeIndex + 1} かくめ ／ ぜんぶで {totalStrokes} かく
        </div>
      )}

      <div className="trace-box">
        <canvas
          ref={bgRef}
          width={RES}
          height={RES}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
        <canvas
          ref={fgRef}
          width={RES}
          height={RES}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none' }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
        />

        {phase === 'demo' && (
          <div className="trace-demo" style={{ fontSize: 'min(37vh, 60vw)' }}>
            {target}
          </div>
        )}

        {phase === 'write' && showGuide && startDot && !drawingRef.current && (
          <div className="trace-start-dot" style={{ left: `${startDot.x}%`, top: `${startDot.y}%` }} />
        )}

        {phase === 'done' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div className="trace-stars">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} style={{ opacity: i < stars ? 1 : 0.25 }}>
                  ⭐
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="hp-bar" style={{ width: 'min(52vh,84vw)' }}>
        <div className="hp-bar__fill" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
      </div>

      <div className="row wrap" style={{ justifyContent: 'center' }}>
        <button className="btn btn--ghost" onClick={clearDrawing} disabled={phase !== 'write'}>
          🧽 やりなおす
        </button>
        {stage === 'free' && (
          <button
            className="btn btn--ghost"
            onClick={() => {
              setShowGuide((v) => !v)
              sfx.tap()
            }}
            disabled={phase !== 'write'}
          >
            👀 おてほん
          </button>
        )}
        <button className="btn btn--primary" onClick={forceFinish} disabled={phase !== 'write'}>
          ✅ かけた！
        </button>
      </div>
    </div>
  )
}
