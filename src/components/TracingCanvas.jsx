// ============================================================
// 指でなぞる文字書きキャンバス（「かく」分野）
//
// v3: 文字の表示も採点も、すべて書き順データ（strokeOrder.js =
// KanjiVG 由来の正確なデータ）から行う。
//
// v2 の不具合: フォントで描いた文字の上に、手作りの近似折れ線を
// ガイドとして重ねていたため、2つの形がズレて「て」が「7」に
// 見えるなど、なぞっても合格できない状態だった。
// → フォント描画を廃止し、見えている文字＝なぞる線＝採点の線、
//   をすべて同じデータに統一して解決。
//
// 仕組み:
//  - お手本: 1画ずつ順番に描かれるアニメ（本物の書き順が見える）
//  - なぞり: 今の画だけ黄色でハイライト、始点に光る点
//  - 書き終えた画はミント色で「定着」し、文字が少しずつ完成していく
//  - 判定は指を離した瞬間のみ（途中で勝手に終わらない）
//  - 始点チェックあり（正しい書きはじめの位置から）
//  - 「かけた！」でいつでも先へ（全画前に使うと復習キューへ）
// ============================================================

import React, { useEffect, useRef, useState } from 'react'
import { speak } from '../engine/tts.js'
import { sfx } from '../engine/sfx.js'
import { STROKE_ORDER } from '../data/strokeOrder.js'

const RES = 320
const PATH_TOLERANCE = RES * 0.17 // 線からこれだけ離れても「なぞれている」
const START_RADIUS = RES * 0.24 // 始点からこの範囲で描き始めれば OK
const STROKE_THRESHOLD = 0.72 // 線に沿ってここまで進めたら合格
const FINISH_MIN = 0.5 // 「かけた！」を押すのに最低これだけはなぞっていること

function toPx(pt) {
  return { x: (pt[0] / 100) * RES, y: (pt[1] / 100) * RES }
}

// 折れ線を px 座標に変換し、区間長・総延長を前計算しておく
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

// 点 p が折れ線のどこ（始点からの弧長割合 0〜1）に一番近いか。
// 線から tolerance より離れていれば null。
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

// 1画（折れ線）をキャンバスに描く。lengthRatio<1 なら途中まで（アニメ用）
function drawStroke(ctx, poly, { color, width, lengthRatio = 1 }) {
  if (!poly || !poly.px.length) return
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  const maxLen = poly.total * lengthRatio
  let acc = 0
  ctx.moveTo(poly.px[0].x, poly.px[0].y)
  for (let i = 1; i < poly.px.length; i++) {
    const seg = poly.segLens[i - 1] || 0
    if (acc + seg <= maxLen) {
      ctx.lineTo(poly.px[i].x, poly.px[i].y)
      acc += seg
    } else {
      const t = seg > 0 ? (maxLen - acc) / seg : 0
      ctx.lineTo(
        poly.px[i - 1].x + (poly.px[i].x - poly.px[i - 1].x) * t,
        poly.px[i - 1].y + (poly.px[i].y - poly.px[i - 1].y) * t
      )
      break
    }
  }
  ctx.stroke()
  ctx.restore()
}

export default function TracingCanvas({ target, stage, onComplete }) {
  const bgRef = useRef(null)
  const fgRef = useRef(null)
  const polysRef = useRef([]) // 全画の折れ線（px 前計算済み）
  const progressRef = useRef(0)
  const startOkRef = useRef(false)
  const drawingRef = useRef(false)
  const lastRef = useRef(null)
  const hasInkRef = useRef(false)
  const doneRef = useRef(false)
  const demoRafRef = useRef(0)

  const strokes = STROKE_ORDER[target] || null

  const [phase, setPhase] = useState('write') // 'demo' | 'write' | 'done'
  const [strokeIndex, setStrokeIndex] = useState(0)
  const [showGuide, setShowGuide] = useState(stage === 'trace')
  const [coverage, setCoverage] = useState(0)
  const [retries, setRetries] = useState(0)
  const [stars, setStars] = useState(0)
  const [startDot, setStartDot] = useState(null)
  const [enoughTraced, setEnoughTraced] = useState(false) // ちゃんとなぞったか（からのまま完了を防ぐ）

  const totalStrokes = strokes ? strokes.length : 1

  // 背景キャンバスに文字を描く:
  //  - guideOn なら全画をうすく（お手本の形）
  //  - doneCount までの画はミントで定着（書けた分だけ文字が完成していく）
  //  - currentIdx の画は黄色でハイライト（guideOn のとき）
  const paintBoard = (doneCount, currentIdx, guideOn) => {
    const canvas = bgRef.current
    if (!canvas || !strokes) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, RES, RES)
    const polys = polysRef.current
    if (guideOn) {
      for (let i = doneCount; i < polys.length; i++) {
        drawStroke(ctx, polys[i], { color: 'rgba(255,255,255,0.18)', width: RES * 0.075 })
      }
      if (currentIdx != null && currentIdx >= doneCount && polys[currentIdx]) {
        drawStroke(ctx, polys[currentIdx], { color: 'rgba(255,209,102,0.7)', width: RES * 0.085 })
      }
    }
    for (let i = 0; i < doneCount && i < polys.length; i++) {
      drawStroke(ctx, polys[i], { color: 'rgba(122,240,208,0.95)', width: RES * 0.075 })
    }
  }

  const updateStartDot = (idx) => {
    if (!strokes || !strokes[idx]) {
      setStartDot(null)
      return
    }
    const p = toPx(strokes[idx][0])
    setStartDot({ x: (p.x / RES) * 100, y: (p.y / RES) * 100 })
  }

  const resetStrokeScoring = () => {
    progressRef.current = 0
    startOkRef.current = false
    setCoverage(0)
  }

  // お手本アニメ: 1画ずつ順番に描いてみせる（本物の書き順）
  const runDemo = (onEnd) => {
    const polys = polysRef.current
    const canvas = bgRef.current
    if (!canvas || !polys.length) {
      onEnd()
      return
    }
    const perStroke = Math.max(300, Math.min(700, 2400 / polys.length))
    const gap = 130
    let startTime = null
    const tick = (now) => {
      // RAF の最初のタイムスタンプは performance.now() より過去のことがあるので、
      // 最初のフレームの時刻を基準にする（負の経過時間で idx=-1 になり
      // クラッシュ→デモが止まる不具合の修正）
      if (startTime === null) startTime = now
      const t = Math.max(0, now - startTime)
      const idx = Math.max(0, Math.min(polys.length - 1, Math.floor(t / (perStroke + gap))))
      const inStroke = Math.min(1, (t - idx * (perStroke + gap)) / perStroke)
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, RES, RES)
      // 全体をごくうすく下敷きに
      for (const poly of polys) {
        drawStroke(ctx, poly, { color: 'rgba(255,255,255,0.10)', width: RES * 0.075 })
      }
      // 描き終わった画＋今描いている画
      for (let i = 0; i < idx; i++) {
        drawStroke(ctx, polys[i], { color: 'rgba(255,255,255,0.85)', width: RES * 0.08 })
      }
      drawStroke(ctx, polys[idx], {
        color: 'rgba(255,255,255,0.85)',
        width: RES * 0.08,
        lengthRatio: inStroke
      })
      const finished = idx === polys.length - 1 && inStroke >= 1
      if (finished) {
        setTimeout(onEnd, 350)
      } else {
        demoRafRef.current = requestAnimationFrame(tick)
      }
    }
    demoRafRef.current = requestAnimationFrame(tick)
  }

  // 文字が変わるたびに初期化
  useEffect(() => {
    doneRef.current = false
    setStars(0)
    setRetries(0)
    setStrokeIndex(0)
    setEnoughTraced(false)
    setShowGuide(stage === 'trace')
    hasInkRef.current = false
    resetStrokeScoring()
    polysRef.current = strokes ? strokes.map(buildPolyline) : []
    const fg = fgRef.current
    if (fg) fg.getContext('2d').clearRect(0, 0, RES, RES)

    if (stage === 'trace' && strokes) {
      let alive = true
      setPhase('demo')
      setStartDot(null)
      runDemo(() => {
        if (!alive) return
        setPhase('write')
        paintBoard(0, 0, true)
        updateStartDot(0)
        speak(
          totalStrokes > 1
            ? 'よし、きみの ばん！ ひかる ところから 1かくめを なぞってね'
            : 'よし、きみの ばん！ ひかる ところから なぞってね'
        )
      })
      return () => {
        alive = false
        cancelAnimationFrame(demoRafRef.current)
      }
    }
    setPhase('write')
    paintBoard(0, 0, false)
    updateStartDot(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, stage])

  // 自由書きモードの「おてほん」トグル
  useEffect(() => {
    if (phase === 'write') paintBoard(strokeIndex, strokeIndex, showGuide)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGuide])

  const pointFromEvent = (e) => {
    const fg = fgRef.current
    const rect = fg.getBoundingClientRect()
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
    const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
    return { x: (cx / rect.width) * RES, y: (cy / rect.height) * RES }
  }

  const start = (e) => {
    if (doneRef.current || phase !== 'write' || !strokes) return
    e.preventDefault()
    drawingRef.current = true
    hasInkRef.current = true
    const p = pointFromEvent(e)
    lastRef.current = p
    // 正しい始点の近くから書き始めたか（＝書き順の始点チェック）
    const startPx = toPx(strokes[strokeIndex][0])
    startOkRef.current = Math.hypot(p.x - startPx.x, p.y - startPx.y) <= START_RADIUS
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

    // ここでは進み具合を記録するだけで、絶対に完了判定しない
    // （判定は指を離した瞬間 end() のみ。途中で終わる不具合の再発防止）
    if (startOkRef.current) {
      const t = projectOnPolyline(polysRef.current[strokeIndex], p, PATH_TOLERANCE)
      if (t != null) progressRef.current = Math.max(progressRef.current, t)
      setCoverage(progressRef.current)
      // ちゃんと線に沿って半分以上なぞれたら「かけた！」を解禁
      if (progressRef.current >= FINISH_MIN) setEnoughTraced(true)
    }
  }

  // 指を離した瞬間だけ、この画の合否を判定する
  const end = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    lastRef.current = null
    if (doneRef.current || phase !== 'write' || !hasInkRef.current) return
    hasInkRef.current = false

    if (coverage >= STROKE_THRESHOLD) {
      advanceStroke()
    } else {
      // おしい！ インクを消してもう一度（減点なし。回数だけ記録）
      setRetries((r) => r + 1)
      sfx.wrongSoft()
      const fg = fgRef.current
      if (fg) fg.getContext('2d').clearRect(0, 0, RES, RES)
      resetStrokeScoring()
    }
  }

  const advanceStroke = () => {
    const fg = fgRef.current
    if (fg) fg.getContext('2d').clearRect(0, 0, RES, RES)
    const next = strokeIndex + 1
    if (next >= totalStrokes) {
      paintBoard(totalStrokes, null, false) // 完成した文字をミントで表示
      finishAll(true)
      return
    }
    sfx.pop()
    setStrokeIndex(next)
    resetStrokeScoring()
    paintBoard(next, next, showGuide) // 書けた画は定着し、次の画がハイライト
    updateStartDot(next)
  }

  const finishAll = (completedAllStrokes) => {
    if (doneRef.current) return
    doneRef.current = true
    const n = !completedAllStrokes ? 1 : retries === 0 ? 3 : retries <= 2 ? 2 : 1
    setStars(n)
    setPhase('done')
    setStartDot(null)
    sfx.correct()
    const praise = n === 3 ? 'ほし みっつ！ さすが！' : n === 2 ? 'じょうずに かけたね！' : 'かけたね！ そのちょうし！'
    speak(`${target}。 ${praise}`)
    setTimeout(() => onComplete(completedAllStrokes), 1300)
  }

  // やりなおす: いま書いた分を消して、この文字を1画目からきれいにやり直す
  const clearDrawing = () => {
    const fg = fgRef.current
    if (fg) fg.getContext('2d').clearRect(0, 0, RES, RES)
    drawingRef.current = false
    hasInkRef.current = false
    lastRef.current = null
    setStrokeIndex(0)
    setRetries(0)
    setEnoughTraced(false)
    resetStrokeScoring()
    paintBoard(0, 0, showGuide) // 定着した画も消して、まっさらな状態にもどす
    updateStartDot(0)
    sfx.tap()
  }

  // 全画終わる前の「かけた！」→ 練習中として記録し先へ進む
  // ただし、なにも書いていないのに進めてしまうのを防ぐ（ちゃんとなぞった時だけ）
  const forceFinish = () => {
    if (strokeIndex === 0 && !enoughTraced) {
      sfx.wrongSoft()
      speak('まだ かいてないよ。ひかる ところから ゆびで なぞってみよう！')
      return
    }
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
      {phase === 'demo' && (
        <div className="muted" style={{ fontWeight: 800, fontSize: 'clamp(14px,2.4vw,18px)' }}>
          👀 おてほんを みててね
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

        {phase === 'write' && showGuide && startDot && (
          <div className="trace-start-dot" style={{ left: `${startDot.x}%`, top: `${startDot.y}%` }} />
        )}

        {phase === 'done' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: '8%'
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
