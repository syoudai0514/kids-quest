// ============================================================
// じゆうべんきょう — 好きな教科を いつでも えらんで学べる
//
// 毎日のミッションは 全教科をまわす（バランス保証）ままにして、
// こちらは「いま これが やりたい！」に応える自由枠。
// 自分で えらべること自体が やる気の もとになる。
//
// チケットは出ない（ごほうび目当ての抜け道にしない）。
// ============================================================

import React from 'react'
import { activeStatsDomainId, useGame, skillOf } from '../state/GameContext.jsx'
import { domainsForGrade, domainName } from '../engine/activities.js'
import { buildFreeTask } from '../engine/missions.js'
import { dueKeys } from '../engine/srs.js'
import { gradeOf } from '../data/grades.js'
import { AppHeader, Starfield, useSpeakOnMount } from '../components/common.jsx'
import { speak } from '../engine/tts.js'
import { sfx } from '../engine/sfx.js'

export default function FreeStudyScreen({ onBack, onStartTask, onEnglishDictionary }) {
  const { state } = useGame()
  const grade = gradeOf(state.grade)
  const doms = domainsForGrade(state.grade)

  useSpeakOnMount('やりたい きょうかを えらんでね！')

  const start = (dom) => {
    sfx.swoosh()
    speak(`${domainName(dom, state.grade)}を べんきょうしよう！`)
    onStartTask(buildFreeTask(dom.id))
  }

  return (
    <div className="screen fade-in">
      <Starfield />
      <AppHeader
        onBack={onBack}
        title="📚 じゆうべんきょう"
        right={<div className="pill">{grade.emoji} {grade.short}</div>}
      />

      <div className="scroll-y" style={{ flex: 1, padding: '6px 10px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div
            className="muted"
            style={{ fontWeight: 800, textAlign: 'center', marginBottom: 12, lineHeight: 1.6 }}
          >
            やりたい きょうかを えらんで べんきょうできるよ。
            <br />
            <span style={{ fontSize: 13 }}>（バトルチケットは でないよ）</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
            {doms.map((dom) => {
              const statsDomainId = activeStatsDomainId(state, dom.id)
              const sk = skillOf(state, statsDomainId)
              const due = dueKeys(state.srs, statsDomainId).length
              return (
                <button
                  key={dom.id}
                  className="menu-tile"
                  style={{ background: dom.color, minHeight: 132 }}
                  onClick={() => start(dom)}
                >
                  <span className="menu-tile__emoji">{dom.emoji}</span>
                  <span className="menu-tile__label">{domainName(dom, state.grade)}</span>
                  <span className="menu-tile__sub">レベル {Math.floor(sk.level)}</span>
                  {due > 0 && <span className="notice-badge">{due}</span>}
                </button>
              )
            })}
          </div>
          <button className="btn btn--ghost" style={{ margin: '16px auto 0', display: 'block', minHeight: 56 }} onClick={onEnglishDictionary}>🔤 えいごずかんを みる</button>

          <div className="muted" style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
            ふきだしの すう字は「きょう ふくしゅうすると いい もんだい」の かず
          </div>
        </div>
      </div>
    </div>
  )
}
