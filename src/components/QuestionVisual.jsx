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
import { speak } from '../engine/tts.js'

export function CountGrid({ emoji, n, mini = false }) {
  return (
    <div className={'countgrid' + (mini ? ' countgrid--mini' : '')}>
      {Array.from({ length: n }).map((_, i) => (
        <span key={i}>{emoji}</span>
      ))}
    </div>
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

export default function QuestionVisual({ question }) {
  const v = question.visual
  if (!v) return null

  let inner = null
  if (v.kind === 'emoji') inner = <span className="q-emoji">{v.emoji}</span>
  else if (v.kind === 'word') inner = <span className="q-word">{v.text}</span>
  else if (v.kind === 'kanji') inner = <span className="q-kanji">{v.text}</span>
  else if (v.kind === 'bigtext') inner = <span className="q-bigtext">{v.text}</span>
  else if (v.kind === 'tenframe') inner = <TenFrame filled={v.filled} />
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

  return (
    <button className="qcard" onClick={() => speak(question.speak)} aria-label="もういちどきく">
      {inner}
    </button>
  )
}
