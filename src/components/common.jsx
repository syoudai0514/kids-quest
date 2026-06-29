// ============================================================
// 小さな共通UIパーツ
// ============================================================

import React, { useEffect, useMemo, useRef } from 'react'
import { speak } from '../engine/tts.js'

// きらめく星の背景
export function Starfield({ count = 28 }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        size: 2 + Math.random() * 3
      })),
    [count]
  )
  return (
    <div className="stars" aria-hidden="true">
      {stars.map((s, i) => (
        <span
          key={i}
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`
          }}
        />
      ))}
    </div>
  )
}

// 紙吹雪（ごほうび演出）
export function Confetti({ pieces = 40 }) {
  const items = useMemo(() => {
    const colors = ['#7af0d0', '#ffd166', '#ff8fb1', '#b6a8ff', '#8bf7ff']
    return Array.from({ length: pieces }).map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      dur: 1.4 + Math.random() * 1.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360
    }))
  }, [pieces])
  return (
    <div className="stars" aria-hidden="true">
      {items.map((c, i) => (
        <span
          key={i}
          className="confetti"
          style={{
            left: `${c.left}%`,
            background: c.color,
            transform: `rotate(${c.rot}deg)`,
            animationDuration: `${c.dur}s`,
            animationDelay: `${c.delay}s`
          }}
        />
      ))}
    </div>
  )
}

// 「きいて！」ボタン: 押すと指定テキストを読み上げる
export function SpeakButton({ text, label = 'もういちど きく', className = 'btn btn--ghost' }) {
  return (
    <button
      className={className}
      onClick={() => speak(text)}
      aria-label="よみあげ"
    >
      🔊 {label}
    </button>
  )
}

// マウント時にテキストを読み上げる（指示・問題文を必ず声でも）
export function useSpeakOnMount(text, deps = []) {
  const last = useRef(null)
  useEffect(() => {
    if (!text || text === last.current) return
    last.current = text
    const id = setTimeout(() => speak(text), 250)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// 進捗ドット
export function ProgressDots({ total, index }) {
  return (
    <div className="progress-dots">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={
            'dot ' + (i < index ? 'dot--done' : i === index ? 'dot--current' : '')
          }
        />
      ))}
    </div>
  )
}
