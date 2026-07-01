// ============================================================
// 指でなぞる文字書きキャンバス（「かく」分野）
//
// 3段階（依頼の「お手本→なぞり→自由書き」）:
//   demo  : お手本の文字がすーっと浮かび上がる（stage='trace' の冒頭）
//           書きはじめの位置に光る点を出す
//   write : うすい文字の上をなぞる（trace）／お手本なしで書く（free）
//   done  : 星の評価（1〜3⭐。かならず もらえる＝否定しない）
//
// 採点は「お手本の形をどれだけなぞれたか」(coverage)。
// うまくいかなくても「かけた！」でいつでも先へ進める。
// 文字はフォントから形のマスクを作るので、専用データ不要。
// ============================================================

import React, { useEffect, useRef, useState } from 'react'
import { speak } from '../engine/tts.js'
import { sfx } from '../engine/sfx.js'

const RES = 320
const GRID = 28
const COVER_RADIUS = 1
const AUTO_SUCCESS = 0.6 // ここまでなぞれたら自動で「できた！」

const FONT = (size) =>
  `bold ${size}px 'Hiragino Maru Gothic ProN','Yu Gothic','M PLUS Rounded 1c',sans-serif`

export default function TracingCanvas({ target, stage, onComplete }) {
  const bgRef = useRef(null)
  const fgRef = useRef(null)
  const maskRef = useRef(null)
  const coveredRef = useRef(null)
  const drawingRef = useRef(false)
  const lastRef = useRef(null)
  const doneRef = useRef(false)

  const [phase, setPhase] = useState('write') // 'demo' | 'write' | 'done'
  const [showGuide, setShowGuide] = useState(stage === 'trace')
  const [coverage, setCoverage] = useState(0)
  const [startDot, setStartDot] = useState(null) // {x%, y%}
  const [drawn, setDrawn] = useState(false)
  const [stars, setStars] = useState(0)

  const paintGuide = (visible) => {
    const bg = bgRef.current
    if (!bg) return
    const ctx = bg.getContext('2d')
    ctx.clearRect(0, 0, RES, RES)
    if (!visible) return
    ctx.save()
    ctx.font = FONT(RES * 0.72)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillText(target, RES / 2, RES / 2 + RES * 0.02)
    ctx.restore()
  }

  // 文字のインク位置マスク＋書きはじめの点（一番上のインク）を作る
  const buildMask = () => {
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
    let first = null
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
          if (!first) first = { gx, gy }
        }
      }
    }
    maskRef.current = { mask, total: Math.max(1, total) }
    coveredRef.current = new Uint8Array(GRID * GRID)
    if (first) {
      setStartDot({
        x: ((first.gx + 0.5) / GRID) * 100,
        y: ((first.gy + 0.5) / GRID) * 100
      })
    }
  }

  // 初期化（target / stage が変わるたび）
  useEffect(() => {
    doneRef.current = false
    setStars(0)
    setCoverage(0)
    setDrawn(false)
    setShowGuide(stage === 'trace')
    buildMask()
    const fg = fgRef.current
    if (fg) fg.getContext('2d').clearRect(0, 0, RES, RES)

    if (stage === 'trace') {
      // お手本フェーズ: 文字が浮かび上がる → 「きみのばん！」
      setPhase('demo')
      paintGuide(false)
      const t = setTimeout(() => {
        setPhase('write')
        paintGuide(true)
        speak('よし、きみの ばん！ ひかる ところから なぞってね')
      }, 2100)
      return () => clearTimeout(t)
    }
    setPhase('write')
    paintGuide(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, stage])

  useEffect(() => {
    if (phase === 'write') paintGuide(showGuide)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGuide])

  const pointFromEvent = (e) => {
    const fg = fgRef.current
    const rect = fg.getBoundingClientRect()
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
    const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
    return { x: (cx / rect.width) * RES, y: (cy / rect.height) * RES }
  }

  const markCovered = (p) => {
    const m = maskRef.current
    const cov = coveredRef.current
    if (!m || !cov) return null
    const cell = RES / GRID
    const gx = Math.floor(p.x / cell)
    const gy = Math.floor(p.y / cell)
    for (let dy = -COVER_RADIUS; dy <= COVER_RADIUS; dy++) {
      for (let dx = -COVER_RADIUS; dx <= COVER_RADIUS; dx++) {
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
    setDrawn(true)
    lastRef.current = pointFromEvent(e)
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

    const cov = markCovered(p)
    if (cov != null) {
      setCoverage(cov)
      if (cov >= AUTO_SUCCESS && !doneRef.current) finish(cov)
    }
  }

  const end = () => {
    drawingRef.current = false
    lastRef.current = null
  }

  const finish = (cov) => {
    if (doneRef.current) return
    doneRef.current = true
    const n = cov >= 0.72 ? 3 : cov >= 0.45 ? 2 : 1
    setStars(n)
    setPhase('done')
    sfx.correct()
    const praise = n === 3 ? 'ほし みっつ！ さすが！' : n === 2 ? 'じょうずに かけたね！' : 'かけたね！ そのちょうし！'
    speak(`${target}。 ${praise}`)
    setTimeout(() => onComplete(true), 1300)
  }

  const clearDrawing = () => {
    const fg = fgRef.current
    if (fg) fg.getContext('2d').clearRect(0, 0, RES, RES)
    coveredRef.current = new Uint8Array(GRID * GRID)
    setCoverage(0)
    setDrawn(false)
    sfx.tap()
  }

  const pct = Math.min(100, Math.round(coverage * 100))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
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

        {/* お手本アニメ: 文字が浮かび上がる */}
        {phase === 'demo' && (
          <div className="trace-demo" style={{ fontSize: 'min(37vh, 60vw)' }}>
            {target}
          </div>
        )}

        {/* 書きはじめの点（なぞりモードで、まだ描いていないとき） */}
        {phase === 'write' && stage === 'trace' && !drawn && startDot && (
          <div className="trace-start-dot" style={{ left: `${startDot.x}%`, top: `${startDot.y}%` }} />
        )}

        {/* 星評価 */}
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

      {/* なぞり進捗 */}
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
        <button
          className="btn btn--primary"
          onClick={() => finish(coverage)}
          disabled={phase !== 'write'}
        >
          ✅ かけた！
        </button>
      </div>
    </div>
  )
}
