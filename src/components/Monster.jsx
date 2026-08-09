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

function ArtBird({ c }) {
  return (
    <g>
      {/* つばさ */}
      <path d="M18 56 q-14 -6 -16 8 q12 4 20 -2 z" fill={c.accent} />
      <path d="M82 56 q14 -6 16 8 q-12 4 -20 -2 z" fill={c.accent} />
      <ellipse cx="50" cy="56" rx="28" ry="26" fill={c.body} />
      <ellipse cx="50" cy="64" rx="15" ry="12" fill={c.belly} opacity="0.85" />
      {/* くちばし */}
      <path d="M44 58 l6 8 l6 -8 z" fill={c.accent} />
      {/* あたまの羽 */}
      <path d="M50 30 l3 -10 l4 9 z" fill={c.accent} />
      <Eyes c={c} cx1={42} cx2={58} cy={48} r={6} />
    </g>
  )
}

function ArtBug({ c }) {
  return (
    <g>
      {/* しょっかく */}
      <path d="M40 30 q-6 -12 -12 -14" stroke={c.body} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M60 30 q6 -12 12 -14" stroke={c.body} strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="27" cy="15" r="3" fill={c.accent} />
      <circle cx="73" cy="15" r="3" fill={c.accent} />
      <ellipse cx="50" cy="56" rx="30" ry="28" fill={c.body} />
      <line x1="50" y1="30" x2="50" y2="84" stroke={c.eye} strokeWidth="2" opacity="0.3" />
      {/* もよう */}
      <circle cx="36" cy="50" r="4" fill={c.accent} opacity="0.7" />
      <circle cx="64" cy="50" r="4" fill={c.accent} opacity="0.7" />
      <circle cx="38" cy="66" r="3.5" fill={c.accent} opacity="0.6" />
      <circle cx="62" cy="66" r="3.5" fill={c.accent} opacity="0.6" />
      <Eyes c={c} cx1={42} cx2={58} cy={46} r={6} />
      <Smile c={c} y={58} />
    </g>
  )
}

function ArtSlime({ c }) {
  return (
    <g>
      <path
        d="M50 24 C26 24 18 52 18 66 a32 18 0 0 0 64 0 C82 52 74 24 50 24 z"
        fill={c.body}
      />
      <ellipse cx="50" cy="70" rx="20" ry="9" fill={c.belly} opacity="0.7" />
      {/* つや */}
      <ellipse cx="40" cy="42" rx="5" ry="8" fill="#fff" opacity="0.5" />
      <Eyes c={c} cx1={42} cx2={60} cy={56} r={7} />
      <Smile c={c} y={70} />
    </g>
  )
}

// 最初に会う6体だけは、遠目でも名前を思い出せる「顔以外の目印」を持たせる。
// 既存の1000体は従来どおり art/deco で描画するため、収集データに影響しない。
function HeroMark({ kind, c }) {
  if (kind === 'hoshu') return <><path d="M23 42 q-12 8 -7 22 q8 -2 13 -10" fill={c.accent} opacity=".8" /><path d="M77 42 q12 8 7 22 q-8 -2 -13 -10" fill={c.accent} opacity=".8" /></>
  if (kind === 'pterry') return <><path d="M17 49 q-13 -13 -10 -27 q13 6 18 21" fill={c.body} /><path d="M83 49 q13 -13 10 -27 q-13 6 -18 21" fill={c.body} /><circle cx="50" cy="25" r="5" fill={c.accent} /></>
  if (kind === 'lunaco') return <><path d="M26 28 q-10 -13 2 -21 q-2 12 9 16" fill={c.accent} /><path d="M74 28 q10 -13 -2 -21 q2 12 -9 16" fill={c.accent} /><circle cx="27" cy="43" r="2" fill="#fff" /><circle cx="73" cy="43" r="2" fill="#fff" /></>
  if (kind === 'rexa') return <><path d="M24 72 q-15 2 -18 13 q13 -1 22 -8" fill={c.accent} /><path d="M70 36 l7 -12 l5 14" fill={c.accent} /><path d="M33 35 l5 -11 l5 11" fill={c.accent} /></>
  if (kind === 'cometa') return <><path d="M15 57 q-19 13 -8 28 q13 -13 27 -17" fill={c.accent} opacity=".9" /><path d="M19 62 q-12 12 -4 19" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" /></>
  if (kind === 'mognyu') return <><path d="M32 30 q4 -18 12 -7 q3 -20 13 -2 q11 -10 12 9" fill={c.accent} /><path d="M29 76 q7 8 14 0 q7 8 14 0 q7 8 14 0" stroke={c.accent} strokeWidth="3" fill="none" /></>
  return null
}

// 見た目バリエーション（1000体でも見分けがつくように）
function Deco({ kind, c }) {
  if (kind === 1) {
    // つの
    return (
      <g>
        <path d="M36 30 l-4 -12 l9 6 z" fill={c.accent} />
        <path d="M64 30 l4 -12 l-9 6 z" fill={c.accent} />
      </g>
    )
  }
  if (kind === 2) {
    // ほしアンテナ
    return (
      <g>
        <line x1="50" y1="26" x2="50" y2="14" stroke={c.body} strokeWidth="3.4" />
        <path d="M50 6 l2.4 5.6 l5.6 0.8 l-4 4 l1.2 5.6 l-5.2 -2.8 l-5.2 2.8 l1.2 -5.6 l-4 -4 l5.6 -0.8 z" fill={c.accent} />
      </g>
    )
  }
  if (kind === 3) {
    // もよう（みずたま）
    return (
      <g opacity="0.55">
        <circle cx="36" cy="66" r="3.4" fill={c.accent} />
        <circle cx="52" cy="72" r="2.8" fill={c.accent} />
        <circle cx="66" cy="64" r="3.2" fill={c.accent} />
      </g>
    )
  }
  return null
}

const ART = {
  blob: ArtBlob,
  dino: ArtDino,
  star: ArtStar,
  rock: ArtRock,
  ghost: ArtGhost,
  bird: ArtBird,
  bug: ArtBug,
  slime: ArtSlime
}

/**
 * @param {object} monster  data/monsters の1件
 * @param {object} colorsOverride  進化段階などで色を上書き
 * @param {number} size  px
 * @param {boolean} bounce  ふわふわ動かす
 */
export default function Monster({ monster, colorsOverride, size = 160, bounce = true, pose = 'idle', style }) {
  if (!monster) return null
  const colors = { ...monster.colors, ...(colorsOverride || {}) }
  const Art = ART[monster.art] || ArtBlob
  const animation = pose === 'attack' ? 'monsterAttack 0.42s ease-out' : pose === 'hurt' ? 'monsterHurt 0.42s ease' : pose === 'win' ? 'monsterWin 0.7s ease-in-out infinite' : bounce ? 'twinkle 2.4s ease-in-out infinite' : 'none'

  // 物語の最初に出会う6体は、生成した固有イラストを使用する。
  // ID は変えず、既存の図鑑・捕獲・セーブデータと完全に互換にする。
  if (monster.heroAsset) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: 'inline-block',
          overflow: 'hidden',
          borderRadius: '34%',
          animation,
          filter: 'drop-shadow(0 10px 12px rgba(0,0,0,0.35))',
          ...style
        }}
        role="img"
        aria-label={monster.name}
      >
        <img
          src={monster.heroAsset}
          alt=""
          draggable="false"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
        />
      </div>
    )
  }

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{
        overflow: 'visible',
        animation,
        filter: 'drop-shadow(0 10px 12px rgba(0,0,0,0.35))',
        ...style
      }}
      role="img"
      aria-label={monster.name}
    >
      <Art c={colors} />
      {monster.heroStyle ? <HeroMark kind={monster.heroStyle} c={colors} /> : null}
      {monster.deco ? <Deco kind={monster.deco} c={colors} /> : null}
    </svg>
  )
}
