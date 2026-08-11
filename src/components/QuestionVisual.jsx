// ============================================================
// 問題ビジュアルの共通描画
//
// question.visual の kind ごとに描き分ける:
//   emoji    : 大きな絵ひとつ（よむ: これはなに？）
//   word     : 大きなことば（よむ: おなじ絵をえらぶ）
//   kanji    : 特大の漢字（よむ: なんてよむ？）
//   bigtext  : 式や数列（すうじ）
//   groups   : 絵のグループ（5個ずつの列で並ぶ。たしざんは「＋」で連結）
//   tenframe : 10のフレーム（2×5マス）
// タップすると問題文を読み上げ直す。
// ============================================================

import React from 'react'
import { speak, speakEnglish } from '../engine/tts.js'

export function CountGrid({ emoji, n, mini = false }) {
  return (
    <div className={'countgrid' + (mini ? ' countgrid--mini' : '')}>
      {Array.from({ length: n }).map((_, i) => (
        <span key={i}>{emoji}</span>
      ))}
    </div>
  )
}

// アナログ時計。時計を「読む力」そのものを育てるので、
// 目もり・数字・長短の針を はっきり描く。
function Clock({ h, m }) {
  const R = 100
  const minAngle = (m / 60) * 360
  const hourAngle = ((h % 12) / 12) * 360 + (m / 60) * 30
  const hand = (angle, len, width, color) => {
    const rad = ((angle - 90) * Math.PI) / 180
    return (
      <line
        x1={R} y1={R}
        x2={R + Math.cos(rad) * len} y2={R + Math.sin(rad) * len}
        stroke={color} strokeWidth={width} strokeLinecap="round"
      />
    )
  }
  return (
    <svg viewBox="0 0 200 200" width="min(46vh,74vw)" height="min(46vh,74vw)" role="img" aria-label={`${h}じ${m}ふん`}>
      <circle cx={R} cy={R} r="94" fill="rgba(255,255,255,0.95)" stroke="#2b3a55" strokeWidth="6" />
      {/* 分の目もり */}
      {Array.from({ length: 60 }).map((_, i) => {
        const a = ((i * 6 - 90) * Math.PI) / 180
        const big = i % 5 === 0
        const r1 = big ? 74 : 80
        return (
          <line
            key={i}
            x1={R + Math.cos(a) * r1} y1={R + Math.sin(a) * r1}
            x2={R + Math.cos(a) * 86} y2={R + Math.sin(a) * 86}
            stroke={big ? '#2b3a55' : '#9aa8bf'} strokeWidth={big ? 4 : 2}
          />
        )
      })}
      {/* 1〜12の数字 */}
      {Array.from({ length: 12 }).map((_, i) => {
        const n = i + 1
        const a = ((n * 30 - 90) * Math.PI) / 180
        return (
          <text
            key={n}
            x={R + Math.cos(a) * 60} y={R + Math.sin(a) * 60 + 8}
            textAnchor="middle" fontSize="22" fontWeight="900" fill="#2b3a55"
          >
            {n}
          </text>
        )
      })}
      {hand(hourAngle, 44, 9, '#2b3a55')}
      {hand(minAngle, 68, 6, '#e5556e')}
      <circle cx={R} cy={R} r="7" fill="#2b3a55" />
    </svg>
  )
}

function TenFrame({ filled }) {
  return (
    <div className="tenframe" aria-label={`10のフレーム、${filled}こ`}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className={'tenframe__cell' + (i < filled ? ' tenframe__cell--filled' : '')}>
          {i < filled ? '⭐' : ''}
        </div>
      ))}
    </div>
  )
}

function Shape({ shape, color = '#7af0d0', small = false }) {
  const common = { fill: color, stroke: '#ffffff', strokeWidth: 5, strokeLinejoin: 'round' }
  const body = shape === 'circle'
    ? <circle cx="50" cy="50" r="34" {...common} />
    : shape === 'triangle'
      ? <path d="M50 12 L91 86 H9 Z" {...common} />
      : shape === 'square'
        ? <rect x="17" y="17" width="66" height="66" rx="5" {...common} />
        : shape === 'rectangle'
          ? <rect x="9" y="27" width="82" height="46" rx="5" {...common} />
          : <path d="M50 8 L60 36 L90 37 L66 55 L74 86 L50 68 L26 86 L34 55 L10 37 L40 36 Z" {...common} />
  return <svg className={small ? 'shape-icon shape-icon--small' : 'shape-icon'} viewBox="0 0 100 100" role="img" aria-label={shape}>{body}</svg>
}

export default function QuestionVisual({ question }) {
  const v = question.visual
  if (!v) return null

  let inner = null
  if (v.kind === 'emoji') inner = <span className="q-emoji">{v.emoji}</span>
  else if (v.kind === 'word') inner = <span className="q-word">{v.text}</span>
  else if (v.kind === 'kanji') inner = <span className="q-kanji">{v.text}</span>
  else if (v.kind === 'bigtext') inner = <span className="q-bigtext">{v.text}</span>
  else if (v.kind === 'tenframe') inner = <TenFrame filled={v.filled} />
  else if (v.kind === 'clock') inner = <Clock h={v.h} m={v.m} />
  else if (v.kind === 'shape') inner = <Shape shape={v.shape} color={v.color} />
  else if (v.kind === 'shapes') {
    inner = <div className="shape-row">{v.items.map((item) => <Shape key={item.id} shape={item.shape} color={item.color} small />)}</div>
  }
  else if (v.kind === 'groups') {
    inner = (
      <div className="groups-row">
        {v.groups.map((g, i) => (
          <React.Fragment key={i}>
            {i > 0 && v.op && <span className="groups-op">{v.op}</span>}
            <CountGrid emoji={g.emoji} n={g.n} />
          </React.Fragment>
        ))}
        {v.op && <span className="groups-op">＝ ❓</span>}
      </div>
    )
  }

  const replay = () => {
    if (question.autoPlayPrompt && question.promptEnglishAudio) {
      void speak('もういちど、よく きいてね').then(() => speakEnglish(question.promptEnglishAudio))
    } else speak(question.speak)
  }
  return (
    <button className="qcard" onClick={replay} aria-label="もういちどきく">
      {inner}
    </button>
  )
}

export { Shape }
