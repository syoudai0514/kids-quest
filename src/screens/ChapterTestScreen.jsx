// ============================================================
// 章末テスト — 合格すると 次の学年が 解放される
//
// これまでは「習熟レベルの平均」で自動解放していたが、
// 保護者の希望で「テストに合格したら解放」に変更。
//   ・その学年の 全教科から 出題（教科ごとに均等）
//   ・ヒント・とちゅうの正解表示なし（実力を見る）
//   ・合格ライン 80%（1回で終わらせず 何度でも挑戦できる）
//   ・落ちても responsable に：「どの教科が おしかったか」を見せる
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useGame, skillOf } from '../state/GameContext.jsx'
import { domainsForGrade, DOMAIN_BY_ID, domainName } from '../engine/activities.js'
import { difficultyParams } from '../engine/difficulty.js'
import { gradeOf, MAX_GRADE } from '../data/grades.js'
import QuestionVisual, { CountGrid } from '../components/QuestionVisual.jsx'
import { Starfield, Confetti, ProgressDots } from '../components/common.jsx'
import { speak } from '../engine/tts.js'
import { sfx } from '../engine/sfx.js'

export const TEST_PASS_RATE = 0.8
const PER_DOMAIN = 2 // 各教科から何問

export default function ChapterTestScreen({ onBack }) {
  const { state, dispatch } = useGame()
  const grade = state.grade
  const doms = domainsForGrade(grade)

  // テスト問題を最初に作りきる（途中で難易度が動かないように）
  const questions = useMemo(() => {
    const list = []
    for (const d of doms) {
      // 「かく」はなぞり書きなので、テストでは選択式の教科だけを使う
      if (d.id === 'kaku') continue
      for (let i = 0; i < PER_DOMAIN; i++) {
        const params = { ...difficultyParams(skillOf(state, d.id)), grade }
        let q = null
        for (let tries = 0; tries < 6 && !q; tries++) {
          const cand = d.generateQuestion(params, null)
          if (cand && cand.type === 'choice' && cand.choices?.length) q = cand
        }
        if (q) list.push({ ...q, _domainId: d.id })
      }
    }
    // 教科がまざるように軽くシャッフル
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[list[i], list[j]] = [list[j], list[i]]
    }
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade])

  const [idx, setIdx] = useState(0)
  const [chosen, setChosen] = useState(null)
  const [done, setDone] = useState(false)
  const resultsRef = useRef([]) // {domainId, correct}
  const startedRef = useRef(false)

  const q = questions[idx]
  const total = questions.length

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true
      speak(
        `${gradeOf(grade).name}の しょうまつテストを はじめます。ぜんぶで ${total}もん。おちついて いこう！`
      )
    }
  }, [grade, total])

  useEffect(() => {
    if (q && !done) setTimeout(() => speak(q.speak), 400)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  if (!total) {
    return (
      <div className="screen fade-in">
        <Starfield />
        <div className="center-col">
          <div className="card" style={{ textAlign: 'center' }}>テストを じゅんびできませんでした</div>
          <button className="btn btn--primary btn--big" onClick={onBack}>もどる</button>
        </div>
      </div>
    )
  }

  const correctCount = resultsRef.current.filter((r) => r.correct).length
  const rate = resultsRef.current.length ? correctCount / resultsRef.current.length : 0
  const passed = rate >= TEST_PASS_RATE

  const choose = (choice) => {
    if (chosen) return
    const ok = choice.id === q.answerId
    setChosen(choice.id)
    resultsRef.current.push({ domainId: q._domainId, correct: ok })
    // テスト中は 正解・不正解を いちいち言わない（テストらしさ・集中のため）
    ok ? sfx.pop() : sfx.tap()
    setTimeout(() => {
      if (idx + 1 < total) {
        setChosen(null)
        setIdx(idx + 1)
      } else {
        finish()
      }
    }, 450)
  }

  const finish = () => {
    const c = resultsRef.current.filter((r) => r.correct).length
    const r = c / resultsRef.current.length
    const ok = r >= TEST_PASS_RATE
    setDone(true)
    dispatch({ type: 'CHAPTER_TEST_RESULT', grade, passed: ok, rate: r })
    if (ok) {
      sfx.fanfare()
      speak(
        grade < MAX_GRADE
          ? `ごうかく おめでとう！ ${Math.round(r * 100)}てん！ つぎの がくねんが あいたよ！`
          : `ごうかく おめでとう！ ${Math.round(r * 100)}てん！ ぜんぶの がくねんを クリアした！`
      )
    } else {
      sfx.reward()
      speak(
        `${Math.round(r * 100)}てん。ごうかくは ${Math.round(TEST_PASS_RATE * 100)}てんから。おしかった ところを おさらいしたら、なんども ちょうせん できるよ！`
      )
    }
  }

  // ---- 結果画面 ----
  if (done) {
    const byDom = {}
    for (const r of resultsRef.current) {
      byDom[r.domainId] = byDom[r.domainId] || { c: 0, n: 0 }
      byDom[r.domainId].n++
      if (r.correct) byDom[r.domainId].c++
    }
    return (
      <div className="screen fade-in">
        <Starfield />
        {passed && <Confetti pieces={60} />}
        <div className="center-col scroll-col">
          <div style={{ fontSize: 'clamp(34px,8vw,68px)', fontWeight: 900 }}>
            {passed ? '🎓 ごうかく！' : '💪 おしい！'}
          </div>
          <div
            className="card"
            style={{ textAlign: 'center', width: 'min(560px,94vw)' }}
          >
            <div style={{ fontSize: 'clamp(30px,7vw,54px)', fontWeight: 900, color: passed ? 'var(--good)' : 'var(--accent-2)' }}>
              {Math.round(rate * 100)}てん
            </div>
            <div className="muted" style={{ fontWeight: 800 }}>
              {correctCount} / {resultsRef.current.length}もん せいかい
              （ごうかくは {Math.round(TEST_PASS_RATE * 100)}てんから）
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(byDom).map(([id, v]) => {
                const d = DOMAIN_BY_ID[id]
                const good = v.c === v.n
                return (
                  <div key={id} className="row" style={{ justifyContent: 'space-between', fontWeight: 800 }}>
                    <span>{d?.emoji} {domainName(d, grade)}</span>
                    <span style={{ color: good ? 'var(--good)' : 'var(--bad-soft)' }}>
                      {v.c}/{v.n} {good ? '◎' : ''}
                    </span>
                  </div>
                )
              })}
            </div>
            {passed && grade < MAX_GRADE && (
              <div className="pill" style={{ marginTop: 12, background: 'var(--good)', color: '#10231c', border: 'none' }}>
                🔓 {gradeOf(grade + 1).short} が あいた！
              </div>
            )}
            {!passed && (
              <div className="muted" style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6 }}>
                まちがえた もんだいは「とっくん」に はいったよ。
                おさらいして、また ちょうせん しよう！
              </div>
            )}
          </div>
          <button className="btn btn--primary btn--big" onClick={onBack}>
            🏠 ホームへ
          </button>
        </div>
      </div>
    )
  }

  // ---- 出題中 ----
  const grid = q.choices.length === 3 ? 'choice-grid choice-grid--3' : 'choice-grid'
  const dom = DOMAIN_BY_ID[q._domainId]
  return (
    <div className="screen screen-in">
      <Starfield count={12} />
      <div className="topbar">
        <div className="pill">🎓 しょうまつテスト</div>
        <ProgressDots total={total} index={idx} />
        <div className="pill">{dom?.emoji} {domainName(dom, grade)}</div>
      </div>

      <div className="center-col scroll-col">
        <div className="muted" style={{ fontSize: 'clamp(16px,3vw,24px)', fontWeight: 800, textAlign: 'center' }}>
          {q.instruction}
        </div>
        <QuestionVisual question={q} />
        <div className={grid}>
          {q.choices.map((c) => (
            <button
              key={c.id}
              className={'choice' + (chosen === c.id ? ' choice--picked' : '')}
              disabled={!!chosen}
              onClick={() => choose(c)}
            >
              {c.emoji && <span className="choice__emoji">{c.emoji}</span>}
              {c.grid && <CountGrid emoji={c.grid.emoji} n={c.grid.n} mini />}
              {c.label && <span className="choice__label">{c.label}</span>}
            </button>
          ))}
        </div>
        <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>
          テストちゅうは ヒントは 出ないよ。おちついて えらぼう
        </div>
      </div>
    </div>
  )
}
