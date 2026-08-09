// ============================================================
// ほしのしれん — 6問ずつ、別日に2回。
// 直近12問中9問できたら次の学年を解放する。
// 「一発の不合格」ではなく、思い出す練習を挟んだ確認にする。
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useGame, STAR_TRIAL_PASS_CORRECT, STAR_TRIAL_QUESTIONS, starTrialInfo } from '../state/GameContext.jsx'
import { domainsForGrade, DOMAIN_BY_ID, domainName } from '../engine/activities.js'
import { difficultyParams } from '../engine/difficulty.js'
import { gradeOf, MAX_GRADE } from '../data/grades.js'
import QuestionVisual, { CountGrid } from '../components/QuestionVisual.jsx'
import TracingCanvas from '../components/TracingCanvas.jsx'
import { Starfield, Confetti, ProgressDots } from '../components/common.jsx'
import { speak, cancelSpeak } from '../engine/tts.js'
import { sfx } from '../engine/sfx.js'
import { reviewKeyFor, snapshotQuestion } from '../engine/reviewKey.js'

function shuffle(items) {
  const list = [...items]
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}

// その学年の教科を偏らせず、選択式5問＋書く1問を作る。
function makeTrialQuestions(state, grade) {
  const domains = domainsForGrade(grade)
  const choiceDomains = domains.filter((d) => d.id !== 'kaku')
  const list = []
  const order = shuffle(choiceDomains)

  // 年長は選択できる教科が4つなので、1つだけ2問にして5問にする。
  for (let i = 0; i < STAR_TRIAL_QUESTIONS - 1; i++) {
    const d = order[i % order.length]
    const params = { ...difficultyParams(state.skills?.[grade]?.[d.id] || {}), grade }
    let question = null
    for (let tries = 0; tries < 8 && !question; tries++) {
      const candidate = d.generateQuestion(params, null)
      if (candidate?.type === 'choice' && candidate.choices?.length) question = candidate
    }
    if (question) list.push({ ...question, _domainId: d.id })
  }

  const writing = domains.find((d) => d.id === 'kaku')
  if (writing) {
    const params = { ...difficultyParams(state.skills?.[grade]?.[writing.id] || {}), grade }
    const question = writing.generateQuestion(params, null)
    if (question?.type === 'trace') list.push({ ...question, _domainId: writing.id })
  }

  // 書く問題を作れないコンテンツでも、必ず6問になるよう選択式で補完する。
  while (list.length < STAR_TRIAL_QUESTIONS && choiceDomains.length) {
    const d = choiceDomains[list.length % choiceDomains.length]
    const params = { ...difficultyParams(state.skills?.[grade]?.[d.id] || {}), grade }
    const question = d.generateQuestion(params, null)
    if (question?.type === 'choice' && question.choices?.length) list.push({ ...question, _domainId: d.id })
  }
  return shuffle(list).slice(0, STAR_TRIAL_QUESTIONS)
}

export default function ChapterTestScreen({ onBack }) {
  const { state, dispatch } = useGame()
  const grade = state.grade
  const trialInfo = starTrialInfo(state, grade)
  const questions = useMemo(() => makeTrialQuestions(state, grade), [grade])
  const [idx, setIdx] = useState(0)
  const [chosen, setChosen] = useState(null)
  const [done, setDone] = useState(false)
  const resultsRef = useRef([])
  const startedRef = useRef(false)

  const q = questions[idx]
  const total = questions.length
  const trialNumber = Math.min(2, trialInfo.rounds.length + 1)

  useEffect(() => {
    if (!startedRef.current && !trialInfo.todayDone) {
      startedRef.current = true
      speak(`${gradeOf(grade).name}の ほしのしれん、${trialNumber}かいめ。きょうは ${total}もんだよ。ゆっくり いこう！`)
    }
  }, [grade, total, trialInfo.todayDone, trialNumber])

  useEffect(() => {
    if (!q || done || trialInfo.todayDone || q.type === 'trace') return undefined
    const id = setTimeout(() => speak(q.speak), 400)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  useEffect(() => () => cancelSpeak(), [])

  const finish = () => {
    const correct = resultsRef.current.filter((r) => r.correct).length
    const old = trialInfo.rounds.slice(-1)
    const combined = [...old, { correct, total }]
    const combinedCorrect = combined.reduce((sum, r) => sum + r.correct, 0)
    const combinedTotal = combined.reduce((sum, r) => sum + r.total, 0)
    const passed = combinedTotal === STAR_TRIAL_QUESTIONS * 2 && combinedCorrect >= STAR_TRIAL_PASS_CORRECT
    setDone(true)
    dispatch({ type: 'STAR_TRIAL_RESULT', grade, correct, total, results: resultsRef.current })

    if (passed) {
      sfx.fanfare()
      speak(grade < MAX_GRADE ? `ほしのしれん クリア！ ${combinedCorrect}こ できたよ。つぎの がくねんが あいた！` : `ほしのしれん クリア！ ${combinedCorrect}こ できたよ。ぜんぶの がくねんを クリアした！`)
    } else if (trialInfo.rounds.length === 0) {
      sfx.reward()
      speak(`きょうは ${correct}こ できたよ。まちがえた もんだいは とっくんに いれたから、あした もう6もん やってみよう！`)
    } else {
      sfx.reward()
      speak(`${combinedCorrect}こ できたよ。クリアまで あと ${Math.max(0, STAR_TRIAL_PASS_CORRECT - combinedCorrect)}こ。とっくんをして、また あした ちょうせんしよう！`)
    }
  }

  const record = (correct) => {
    const itemKey = reviewKeyFor(q)
    resultsRef.current.push({
      domainId: q._domainId,
      correct,
      itemKey,
      question: correct ? null : snapshotQuestion(q, itemKey)
    })
    correct ? sfx.pop() : sfx.tap()
    setTimeout(() => {
      if (idx + 1 < total) {
        setChosen(null)
        setIdx(idx + 1)
      } else {
        finish()
      }
    }, q.type === 'trace' ? 300 : 450)
  }

  if (!total) {
    return <div className="screen fade-in"><Starfield /><div className="center-col"><div className="card">しれんを じゅんびできませんでした</div><button className="btn btn--primary btn--big" onClick={onBack}>もどる</button></div></div>
  }

  // 1日に2回連続で採点せず、翌日の想起練習を残す。
  if (trialInfo.todayDone && !done) {
    return (
      <div className="screen fade-in">
        <Starfield />
        <div className="center-col">
          <div style={{ fontSize: 58 }}>🌟</div>
          <div className="card" style={{ textAlign: 'center', maxWidth: 560 }}>
            <div style={{ fontSize: 'clamp(25px,5vw,38px)', fontWeight: 900 }}>きょうの しれんは おしまい！</div>
            <div className="muted" style={{ marginTop: 12, fontWeight: 800, lineHeight: 1.65 }}>まちがえた もんだいは「とっくん」で みなおせるよ。<br />つづきの しれんは あした やろう！</div>
          </div>
          <button className="btn btn--primary btn--big" onClick={onBack}>🏠 ホームへ</button>
        </div>
      </div>
    )
  }

  if (done) {
    const correct = resultsRef.current.filter((r) => r.correct).length
    const combined = [...trialInfo.rounds.slice(-1), { correct, total }]
    const combinedCorrect = combined.reduce((sum, r) => sum + r.correct, 0)
    const combinedTotal = combined.reduce((sum, r) => sum + r.total, 0)
    const passed = combinedTotal === STAR_TRIAL_QUESTIONS * 2 && combinedCorrect >= STAR_TRIAL_PASS_CORRECT
    const missing = Math.max(0, STAR_TRIAL_PASS_CORRECT - combinedCorrect)
    return (
      <div className="screen fade-in">
        <Starfield />
        {passed && <Confetti pieces={60} />}
        <div className="center-col scroll-col">
          <div style={{ fontSize: 'clamp(34px,8vw,68px)', fontWeight: 900 }}>{passed ? '🌟 しれん クリア！' : '🌱 きょうの しれん かんりょう！'}</div>
          <div className="card" style={{ textAlign: 'center', width: 'min(560px,94vw)' }}>
            <div style={{ fontSize: 'clamp(30px,7vw,54px)', fontWeight: 900, color: passed ? 'var(--good)' : 'var(--accent-2)' }}>{correct} / {total}こ</div>
            {passed ? (
              <div className="muted" style={{ fontWeight: 800, marginTop: 10 }}>2かいで {combinedCorrect} / {combinedTotal}こ できたよ！</div>
            ) : trialInfo.rounds.length === 0 ? (
              <div className="muted" style={{ fontWeight: 800, marginTop: 10 }}>あした もう6もん。2かいで 9こ できたら クリア！</div>
            ) : (
              <div className="muted" style={{ fontWeight: 800, marginTop: 10 }}>2かいで {combinedCorrect} / {combinedTotal}こ。クリアまで あと {missing}こ！</div>
            )}
            {!passed && <div className="muted" style={{ marginTop: 12, fontSize: 13, lineHeight: 1.6 }}>まちがえた もんだいは「とっくん」に はいったよ。<br />おぼえてから、また ちょうせんしよう！</div>}
            {passed && grade < MAX_GRADE && <div className="pill" style={{ marginTop: 12, background: 'var(--good)', color: '#10231c', border: 'none' }}>🔓 {gradeOf(grade + 1).short} が あいた！</div>}
          </div>
          <button className="btn btn--primary btn--big" onClick={onBack}>🏠 ホームへ</button>
        </div>
      </div>
    )
  }

  const grid = q.choices?.length === 3 ? 'choice-grid choice-grid--3' : 'choice-grid'
  const dom = DOMAIN_BY_ID[q._domainId]
  return (
    <div className="screen screen-in">
      <Starfield count={12} />
      <div className="topbar">
        <div className="pill">🌟 ほしのしれん {trialNumber}かいめ</div>
        <ProgressDots total={total} index={idx} />
        <div className="pill">{dom?.emoji} {domainName(dom, grade)}</div>
      </div>
      <div className="center-col scroll-col">
        <div className="muted" style={{ fontSize: 'clamp(16px,3vw,24px)', fontWeight: 800, textAlign: 'center' }}>{q.instruction}</div>
        {q.type === 'trace' ? (
          <TracingCanvas key={`${idx}-${q.target}-${q.stage}`} target={q.target} stage={q.stage} onComplete={record} />
        ) : (
          <>
            <QuestionVisual question={q} />
            <div className={grid}>
              {q.choices.map((c) => <button key={c.id} className={'choice' + (chosen === c.id ? ' choice--picked' : '')} disabled={!!chosen} onClick={() => { setChosen(c.id); record(c.id === q.answerId) }}>
                {c.emoji && <span className="choice__emoji">{c.emoji}</span>}
                {c.grid && <CountGrid emoji={c.grid.emoji} n={c.grid.n} mini />}
                {c.label && <span className="choice__label">{c.label}</span>}
              </button>)}
            </div>
          </>
        )}
        <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>ヒントなしで、いま おもいだせることを やってみよう</div>
      </div>
    </div>
  )
}
