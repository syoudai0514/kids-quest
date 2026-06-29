// ============================================================
// 指でなぞる文字書きキャンバス（「かく」分野）
//
//  - stage 'trace': お手本（うすい文字）を表示してなぞる
//  - stage 'free' : お手本なしで自分で書く（「おてほん」ボタンで一時表示）
//
// 採点はやさしめ:
//   お手本の「形（インク）」をどれだけ指でなぞれたか(coverage)で判定。
//   一定以上なぞれたら自動で「できた！」。
//   うまくいかなくても「かけた！」ボタンでいつでも先へ進める（苦手意識を持たせない）。
//
// 文字はシステムフォントを描いて形のマスクを作るので、
// 文字を増やしても専用データ不要（writing.js にプール追加だけでOK）。
// ============================================================

import React, { useEffect, useRef, useState } from 'react'
import { speak } from '../engine/tts.js'
import { sfx } from '../engine/sfx.js'

const RES = 320 // 内部解像度
const GRID = 28 // 採点グリッドの細かさ
const COVER_RADIUS = 1 // 何セル先まで「なぞった」とみなすか
const SUCCESS_COVERAGE = 0.55 // これだけなぞれたら自動成功

export default function TracingCanvas({ target, stage, onComplete }) {
  const bgRef = useRef(null) // お手本レイヤ
  const fgRef = useRef(null) // 指で描くレイヤ
  const maskRef = useRef(null) // 採点用インクセル
  const coveredRef = useRef(null)
  const drawingRef = useRef(false)
  const lastRef = useRef(null)
  const doneRef = useRef(false)

  const [showGuide, setShowGuide] = useState(stage === 'trace')
  const [coverage, setCoverage] = useState(0)
  const [done, setDone] = useState(false)

  // お手本（うすい文字）を描く
  const paintGuide = (visible) => {
    const bg = bgRef.current
    if (!bg) return
    const ctx = bg.getContext('2d')
    ctx.clearRect(0, 0, RES, RES)
    if (!visible) return
    ctx.save()
    ctx.font = `bold ${RES * 0.72}px 'Hiragino Maru Gothic ProN','Yu Gothic','M PLUS Rounded 1c',sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'rgba(255,255,255,0.22)'
    ctx.fillText(target, RES / 2, RES / 2 + RES * 0.02)
    ctx.restore()
  }

  // 採点用のインクセル（文字の形）を作る
  const buildMask = () => {
    const off = document.createElement('canvas')
    off.width = RES
    off.height = RES
    const ctx = off.getContext('2d')
    ctx.font = `bold ${RES * 0.72}px 'Hiragino Maru Gothic ProN','Yu Gothic','M PLUS Rounded 1c',sans-serif`
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
    maskRef.current = { mask, total: Math.max(1, total) }
    coveredRef.current = new Uint8Array(GRID * GRID)
  }

  // 初期化（target / stage が変わるたび）
  useEffect(() => {
    doneRef.current = false
    setDone(false)
    setCoverage(0)
    setShowGuide(stage === 'trace')
    buildMask()
    paintGuide(stage === 'trace')
    // 指レイヤをクリア
    const fg = fgRef.current
    if (fg) fg.getContext('2d').clearRect(0, 0, RES, RES)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, stage])

  useEffect(() => {
    paintGuide(showGuide)
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
    if (!m || !cov) return
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
    if (doneRef.current) return
    e.preventDefault()
    drawingRef.current = true
    lastRef.current = pointFromEvent(e)
  }

  const move = (e) => {
    if (!drawingRef.current || doneRef.current) return
    e.preventDefault()
    const p = pointFromEvent(e)
    const fg = fgRef.current
    const ctx = fg.getContext('2d')
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
      if (cov >= SUCCESS_COVERAGE && !doneRef.current) finish(true)
    }
  }

  const end = () => {
    drawingRef.current = false
    lastRef.current = null
  }

  const finish = (auto) => {
    if (doneRef.current) return
    doneRef.current = true
    setDone(true)
    sfx.correct()
    speak(`${target}、じょうずに かけたね！`)
    setTimeout(() => onComplete(true), auto ? 900 : 600)
  }

  const clearDrawing = () => {
    const fg = fgRef.current
    if (fg) fg.getContext('2d').clearRect(0, 0, RES, RES)
    coveredRef.current = new Uint8Array(GRID * GRID)
    setCoverage(0)
    sfx.tap()
  }

  const pct = Math.min(100, Math.round(coverage * 100))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          position: 'relative',
          width: 'min(58vh, 86vw)',
          height: 'min(58vh, 86vw)',
          borderRadius: 24,
          background: 'rgba(255,255,255,0.06)',
          border: '3px dashed rgba(255,255,255,0.25)',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.25)',
          touchAction: 'none'
        }}
      >
        {/* 四つ角のガイド */}
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
        {done && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(60px,16vw,120px)',
              animation: 'pop 0.3s ease'
            }}
          >
            🌟
          </div>
        )}
      </div>

      {/* なぞり進捗 */}
      <div className="hp-bar" style={{ width: 'min(58vh,86vw)' }}>
        <div
          className="hp-bar__fill"
          style={{ width: `${pct}%`, background: 'var(--accent)' }}
        />
      </div>

      {/* 操作ボタン */}
      <div className="row wrap" style={{ justifyContent: 'center' }}>
        <button className="btn btn--ghost" onClick={clearDrawing} disabled={done}>
          🧽 やりなおす
        </button>
        {stage === 'free' && (
          <button
            className="btn btn--ghost"
            onClick={() => {
              setShowGuide((v) => !v)
              sfx.tap()
            }}
            disabled={done}
          >
            👀 おてほん
          </button>
        )}
        <button className="btn btn--primary" onClick={() => finish(false)} disabled={done}>
          ✅ かけた！
        </button>
      </div>
    </div>
  )
}
