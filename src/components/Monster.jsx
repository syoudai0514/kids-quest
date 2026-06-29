// ============================================================
// オリジナルモンスターの SVG 描画（画像ファイル不要＝オフライン対応）
// art 種別ごとに形を変える。色は monster.colors から受け取る。
// 既存IPに頼らない独自デザイン。
// ============================================================

import React from 'react'

function Eyes({ c, cx1 = 38, cx2 = 62, cy = 46, r = 7 }) {
  return (
    <>
      <circle cx={cx1} cy={cy} r={r} fill="#fff" />
      <circle cx={cx2} cy={cy} r={r} fill="#fff" />
      <circle cx={cx1 + 1} cy={cy + 1} r={r * 0.55} fill={c.eye} />
      <circle cx={cx2 + 1} cy={cy + 1} r={r * 0.55} fill={c.eye} />
      <circle cx={cx1 - 1.5} cy={cy - 1.5} r={1.6} fill="#fff" />
      <circle cx={cx2 - 1.5} cy={cy - 1.5} r={1.6} fill="#fff" />
    </>
  )
}

function Smile({ c, y = 60 }) {
  return (
    <path
      d={`M40 ${y} q10 9 20 0`}
      stroke={c.eye}
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
  )
}

function ArtBlob({ c }) {
  // 星のかけらモンスター（相棒ホッシュ）
  return (
    <g>
      <ellipse cx="50" cy="55" rx="34" ry="32" fill={c.body} />
      <ellipse cx="50" cy="63" rx="20" ry="16" fill={c.belly} opacity="0.8" />
      {/* 頭のアンテナ星 */}
      <line x1="50" y1="24" x2="50" y2="14" stroke={c.body} strokeWidth="4" />
      <path
        d="M50 4 l3 7 l7 1 l-5 5 l1.5 7 l-6.5 -3.5 l-6.5 3.5 l1.5 -7 l-5 -5 l7 -1 z"
        fill={c.accent}
      />
      {/* ほっぺ */}
      <circle cx="30" cy="58" r="5" fill={c.accent} opacity="0.5" />
      <circle cx="70" cy="58" r="5" fill={c.accent} opacity="0.5" />
      <Eyes c={c} />
      <Smile c={c} />
    </g>
  )
}

function ArtDino({ c }) {
  return (
    <g>
      {/* しっぽ */}
      <path d="M20 70 q-12 2 -14 12 q10 -2 16 -6 z" fill={c.body} />
      {/* からだ */}
      <ellipse cx="52" cy="58" rx="32" ry="28" fill={c.body} />
      <ellipse cx="52" cy="66" rx="18" ry="13" fill={c.belly} opacity="0.85" />
      {/* せなかのトゲ */}
      <path d="M30 36 l5 -10 l5 10 z" fill={c.accent} />
      <path d="M42 32 l5 -11 l5 11 z" fill={c.accent} />
      <path d="M54 33 l5 -10 l5 10 z" fill={c.accent} />
      {/* あし */}
      <rect x="38" y="80" width="9" height="12" rx="4" fill={c.body} />
      <rect x="56" y="80" width="9" height="12" rx="4" fill={c.body} />
      <Eyes c={c} cx1={44} cx2={64} cy={50} r={6} />
      <Smile c={c} y={62} />
    </g>
  )
}

function ArtStar({ c }) {
  return (
    <g>
      <path
        d="M50 8 l11 24 l26 3 l-19 18 l5 26 l-23 -13 l-23 13 l5 -26 l-19 -18 l26 -3 z"
        fill={c.body}
      />
      <Eyes c={c} cx1={42} cx2={58} cy={48} r={6} />
      <Smile c={c} y={60} />
      <circle cx="33" cy="55" r="4" fill={c.accent} opacity="0.6" />
      <circle cx="67" cy="55" r="4" fill={c.accent} opacity="0.6" />
    </g>
  )
}

function ArtRock({ c }) {
  return (
    <g>
      <path
        d="M24 44 l12 -16 l28 0 l12 16 l-6 36 l-52 0 z"
        fill={c.body}
        stroke={c.belly}
        strokeWidth="3"
      />
      <circle cx="38" cy="40" r="3" fill={c.accent} />
      <circle cx="64" cy="38" r="2.5" fill={c.accent} />
      <Eyes c={c} cx1={40} cx2={62} cy={56} r={7} />
      <path d="M40 72 q11 7 22 0" stroke={c.eye} strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  )
}

function ArtGhost({ c }) {
  return (
    <g>
      <path
        d="M22 56 a28 28 0 0 1 56 0 l0 30 q-7 -6 -14 0 q-7 6 -14 0 q-7 -6 -14 0 q-7 6 -14 0 z"
        fill={c.body}
        opacity="0.95"
      />
      <Eyes c={c} cx1={40} cx2={60} cy={50} r={7} />
      <ellipse cx="50" cy="64" rx="6" ry="8" fill={c.eye} opacity="0.85" />
      <circle cx="30" cy="58" r="4" fill={c.accent} opacity="0.5" />
      <circle cx="70" cy="58" r="4" fill={c.accent} opacity="0.5" />
    </g>
  )
}

const ART = {
  blob: ArtBlob,
  dino: ArtDino,
  star: ArtStar,
  rock: ArtRock,
  ghost: ArtGhost
}

/**
 * @param {object} monster  data/monsters の1件
 * @param {object} colorsOverride  進化段階などで色を上書き
 * @param {number} size  px
 * @param {boolean} bounce  ふわふわ動かす
 */
export default function Monster({ monster, colorsOverride, size = 160, bounce = true, style }) {
  if (!monster) return null
  const colors = { ...monster.colors, ...(colorsOverride || {}) }
  const Art = ART[monster.art] || ArtBlob
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{
        overflow: 'visible',
        animation: bounce ? 'twinkle 2.4s ease-in-out infinite' : 'none',
        filter: 'drop-shadow(0 10px 12px rgba(0,0,0,0.35))',
        ...style
      }}
      role="img"
      aria-label={monster.name}
    >
      <Art c={colors} />
    </svg>
  )
}
