// ============================================================
// タスク（数問のまとまり）のプレイ画面 — 全分野で共通の出題エンジン。
//
// 学習効果のための仕掛け:
//  - アダプティブ: その時点の習熟度から難易度を決める
//  - 復習キュー: 前に間違えた問題を確率で混ぜて再出題（想起練習）
//  - 苦手支援: 1回目のミス→ヒント音声 / 2回目→正解を光らせ「解説」を読む
//    （責めない。難易度に効くのは最初の1回だけ＝やり直しは減点しない）
//  - 連続正解コンボ: 「2れんぞく！」で気持ちよく加速
// ============================================================

import React, { useEffect, useRef, useState } from 'react'
import { useGame } from '../state/GameContext.jsx'
import { DOMAIN_BY_ID } from '../engine/activities.js'
import { difficultyParams } from '../engine/difficulty.js'
import { speak } from '../engine/tts.js'
import { sfx } from '../engine/sfx.js'
import { Starfield, ProgressDots } from '../components/common.jsx'
import QuestionVisual, { CountGrid } from '../components/QuestionVisual.jsx'
import TracingCanvas from '../components/TracingCanvas.jsx'

const PRAISE = ['せいかい！', 'すごい！', 'やったね！', 'てんさい！', 'かんぺき！', 'いいね！', 'さすが！']
const CHEER = [
  'だいじょうぶ、もういっかい いけるよ！',
  'おしい！ もういちど みてみよう',
  'いいちょうし、つぎは できるよ！'
]

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function ActivityPlayer({ task, onDone }) {
  const { state, dispatch } = useGame()
  const domain = DOMAIN_BY_ID[task.domainId]

  const [qIndex, setQIndex] = useState(0)
  const [question, setQuestion] = useState(null)
  const [phase, setPhase] = useState('answering')
  const [chosenId, setChosenId] = useState(null)
  const [wrongIds, setWrongIds] = useState([])
  const [showAnswerHint, setShowAnswerHint] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const wrongCountRef = useRef(0)
  const firstAttemptRef = useRef(true)
  const comboRef = useRef(0)
  const skillRef = useRef(state.skills[task.domainId])
  skillRef.current = state.skills[task.domainId]
  const missedRef = useRef(state.missed[task.domainId] || [])
  missedRef.current = state.missed[task.domainId] || []

  const makeQuestion = () => {
    const params = difficultyParams(skillRef.current)
    // 復習キューから35%の確率で再出題
    let review = null
    const missed = missedRef.current
    if (missed.length && Math.random() < 0.35) {
      review = missed[Math.floor(Math.random() * missed.length)]
    }
    const q = domain.generateQuestion(params, review)
    setQuestion(q)
    setPhase('answering')
    setChosenId(null)
    setWrongIds([])
    setShowAnswerHint(false)
    setFeedback(null)
    wrongCountRef.current = 0
    firstAttemptRef.current = true
    setTimeout(() => speak(q.speak), 300)
  }

  useEffect(() => {
    makeQuestion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex])

  if (!question) return null

  const advance = () => {
    if (qIndex + 1 < task.questionCount) {
      setQIndex(qIndex + 1)
    } else {
      dispatch({ type: 'CLEAR_TASK', kind: task.kind })
      sfx.reward()
      const line =
        task.kind === 'extra'
          ? 'ぜんぶ できた！ バトルチケットを ゲット！'
          : 'タスク クリア！ よくがんばったね！'
      speak(line)
      setTimeout(onDone, 1100)
    }
  }

  const recordAnswer = (correct) => {
    if (!firstAttemptRef.current) return
    dispatch({ type: 'ANSWER', domainId: task.domainId, correct, itemKey: question.itemKey })
    firstAttemptRef.current = false
  }

  // 「かく」（なぞり書き）が終わったとき
  const handleTraceDone = () => {
    if (phase === 'feedback') return
    recordAnswer(true)
    setPhase('feedback')
    setTimeout(advance, 300)
  }

  const handleChoose = (choice) => {
    if (phase === 'feedback') return
    if (wrongIds.includes(choice.id)) return
    const correct = choice.id === question.answerId
    recordAnswer(correct)

    if (correct) {
      setChosenId(choice.id)
      setPhase('feedback')
      sfx.correct()
      comboRef.current += 1
      const combo = comboRef.current
      const word = combo >= 2 ? `${combo}れんぞく！` : pick(PRAISE)
      setFeedback({ good: true, word })
      const tail = question.answerWord ? `${question.answerWord.text}！ ` : ''
      speak(`${tail}${combo >= 2 ? `${combo}れんぞく せいかい！ すごい！` : pick(PRAISE)}`)
      setTimeout(advance, 1250)
    } else {
      comboRef.current = 0
      wrongCountRef.current += 1
      setWrongIds((w) => [...w, choice.id])
      sfx.wrongSoft()
      setFeedback({ good: false, word: 'もういっかい！' })
      setTimeout(() => setFeedback(null), 900)

      if (wrongCountRef.current >= 2) {
        // 2回つまずいたら: 正解を光らせて、解説を読む（できるまで支える）
        setShowAnswerHint(true)
        speak(`${question.explain || ''}。 ひかってる ところを おしてみよう`, { rate: 0.88 })
      } else {
        // 1回目: やさしいヒント
        const ans = question.answerWord
        const hint =
          ans && question.visual?.kind === 'emoji'
            ? `${pick(CHEER)} さいしょの じは 「${ans.text[0]}」だよ`
            : pick(CHEER)
        speak(hint)
      }
    }
  }

  const choiceClass = (choice) => {
    let c = 'choice'
    if (phase === 'feedback' && choice.id === chosenId) c += ' choice--correct'
    if (wrongIds.includes(choice.id)) c += ' choice--wrong'
    if (showAnswerHint && choice.id === question.answerId && phase === 'answering')
      c += ' choice--hint'
    return c
  }

  const isTrace = question.type === 'trace'
  const grid =
    question.choices && question.choices.length === 3
      ? 'choice-grid choice-grid--3'
      : 'choice-grid'

  return (
    <div className="screen fade-in">
      <Starfield count={16} />

      <div className="topbar">
        <button
          className="btn btn--ghost"
          style={{ minHeight: 60, padding: '10px 18px' }}
          onClick={onDone}
          aria-label="ホームへ"
        >
          🏠
        </button>
        <ProgressDots total={task.questionCount} index={qIndex} />
        <div className="pill">
          {domain.emoji} {domain.name}
        </div>
      </div>

      <div className="center-col scroll-col">
        <div className="muted" style={{ fontSize: 'clamp(16px,3vw,24px)', fontWeight: 800 }}>
          {question.instruction}
        </div>

        {isTrace ? (
          <TracingCanvas
            key={`${qIndex}-${question.target}-${question.stage}`}
            target={question.target}
            stage={question.stage}
            onComplete={handleTraceDone}
          />
        ) : (
          <>
            <QuestionVisual question={question} />
            <div className={grid}>
              {question.choices.map((choice) => (
                <button
                  key={choice.id}
                  className={choiceClass(choice)}
                  disabled={phase === 'feedback' && choice.id !== chosenId}
                  onClick={() => {
                    if (choice.speak) speak(choice.speak)
                    handleChoose(choice)
                  }}
                >
                  {choice.emoji && <span className="choice__emoji">{choice.emoji}</span>}
                  {choice.grid && <CountGrid emoji={choice.grid.emoji} n={choice.grid.n} mini />}
                  {choice.label && <span className="choice__label">{choice.label}</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {feedback && (
        <div className="feedback">
          <div className="feedback__big">{feedback.good ? '🌟' : '💪'}</div>
          <div
            className="feedback__word"
            style={{ color: feedback.good ? 'var(--accent)' : 'var(--bad-soft)' }}
          >
            {feedback.word}
          </div>
        </div>
      )}
    </div>
  )
}
