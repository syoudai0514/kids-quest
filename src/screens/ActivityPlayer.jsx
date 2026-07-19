// ============================================================
// タスク（数問のまとまり）のプレイ画面 — 全分野で共通の出題エンジン。
//
// 学習効果のための仕掛け:
//  - アダプティブ: いまの学年×習熟度から難易度を決める
//  - 復習キュー: 前に間違えた問題を確率で混ぜて再出題（想起練習）
//  - 「まちがいが ちからに なった！」: 復習キューの問題に正解すると
//    金の演出＋ボーナス✨。失敗→知識が増える、を体感させる中心の仕掛け
//  - とっくんタスク (task.plan): 復習キューの項目だけを分野横断で出題
//  - 苦手支援: 1ミス→ヒント音声 / 2ミス→正解を光らせ解説（責めない）
// ============================================================

import React, { useEffect, useRef, useState } from 'react'
import { useGame, skillOf } from '../state/GameContext.jsx'
import { DOMAIN_BY_ID } from '../engine/activities.js'
import { difficultyParams } from '../engine/difficulty.js'
import { speak } from '../engine/tts.js'
import { sfx } from '../engine/sfx.js'
import { Starfield, ProgressDots, Burst } from '../components/common.jsx'
import QuestionVisual, { CountGrid } from '../components/QuestionVisual.jsx'
import TracingCanvas from '../components/TracingCanvas.jsx'

const PRAISE = ['せいかい！', 'すごい！', 'やったね！', 'てんさい！', 'かんぺき！', 'いいね！', 'さすが！']
const CHEER = [
  'だいじょうぶ、もういっかい いけるよ！',
  'おしい！ もういちど みてみよう',
  'まちがえたら おぼえられる。チャンスだよ！'
]

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function ActivityPlayer({ task, onDone }) {
  const { state, dispatch } = useGame()
  // とっくんタスクは1問ごとに分野が変わる
  const isReviewTask = task.kind === 'review' && Array.isArray(task.plan)

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
  const domainIdRef = useRef(task.domainId)
  const stateRef = useRef(state)
  stateRef.current = state

  const currentDomainId = () =>
    isReviewTask ? task.plan[Math.min(qIndex, task.plan.length - 1)].domainId : task.domainId
  const domain = DOMAIN_BY_ID[currentDomainId()]

  const makeQuestion = () => {
    const domainId = currentDomainId()
    domainIdRef.current = domainId
    const dom = DOMAIN_BY_ID[domainId]
    const params = {
      ...difficultyParams(skillOf(stateRef.current, domainId)),
      grade: stateRef.current.grade
    }

    let review = null
    if (isReviewTask) {
      review = task.plan[Math.min(qIndex, task.plan.length - 1)].key
    } else {
      // 通常タスクでも、復習キューから35%の確率で再出題
      const missed = stateRef.current.missed[domainId] || []
      if (missed.length && Math.random() < 0.35) {
        review = missed[Math.floor(Math.random() * missed.length)]
      }
    }
    const q = dom.generateQuestion(params, review)
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

  const questionCount = isReviewTask ? task.plan.length : task.questionCount

  const advance = () => {
    if (qIndex + 1 < questionCount) {
      setQIndex(qIndex + 1)
    } else {
      dispatch({ type: 'CLEAR_TASK', kind: task.kind })
      sfx.reward()
      const line =
        task.kind === 'review'
          ? 'とっくん クリア！ まちがいが どんどん ちからに かわっていくよ！'
          : task.kind === 'extra'
            ? 'ぜんぶ できた！ バトルチケットを ゲット！'
            : 'タスク クリア！ よくがんばったね！'
      speak(line)
      setTimeout(onDone, 1100)
    }
  }

  // この問題が復習キューにある（＝克服チャンス）か
  const isConquerTarget = () =>
    question.itemKey &&
    (stateRef.current.missed[domainIdRef.current] || []).includes(question.itemKey)

  const recordAnswer = (correct) => {
    if (!firstAttemptRef.current) return false
    const conquer = correct && isConquerTarget()
    dispatch({
      type: 'ANSWER',
      domainId: domainIdRef.current,
      correct,
      itemKey: question.itemKey
    })
    firstAttemptRef.current = false
    return conquer
  }

  // 「かく」（なぞり書き）が終わったとき
  const handleTraceDone = (success) => {
    if (phase === 'feedback') return
    const conquer = recordAnswer(success)
    if (conquer) {
      setFeedback({ good: true, word: 'ちからに なった！', gold: true })
      sfx.levelUp()
      speak('まちがいが ちからに なった！ ✨')
      setPhase('feedback')
      setTimeout(advance, 1400)
      return
    }
    setPhase('feedback')
    setTimeout(advance, 300)
  }

  const handleChoose = (choice) => {
    if (phase === 'feedback') return
    if (wrongIds.includes(choice.id)) return
    const correct = choice.id === question.answerId
    const conquer = recordAnswer(correct)

    if (correct) {
      setChosenId(choice.id)
      setPhase('feedback')
      comboRef.current += 1
      const combo = comboRef.current
      if (conquer) {
        // まちがえたことのある問題を克服！ 金の演出＋ボーナス
        sfx.levelUp()
        setFeedback({ good: true, word: 'ちからに なった！', gold: true })
        const tail = question.answerWord ? `${question.answerWord.text}！ ` : ''
        speak(`${tail}まちがいが ちからに なった！ ボーナス ゲット！`)
        setTimeout(advance, 1500)
      } else {
        sfx.correct()
        const word = combo >= 2 ? `${combo}れんぞく！` : pick(PRAISE)
        setFeedback({ good: true, word })
        const tail = question.answerWord ? `${question.answerWord.text}！ ` : ''
        speak(`${tail}${combo >= 2 ? `${combo}れんぞく せいかい！ すごい！` : pick(PRAISE)}`)
        setTimeout(advance, 1250)
      }
    } else {
      comboRef.current = 0
      wrongCountRef.current += 1
      setWrongIds((w) => [...w, choice.id])
      sfx.wrongSoft()
      setFeedback({ good: false, word: 'もういっかい！' })
      setTimeout(() => setFeedback(null), 900)

      if (wrongCountRef.current >= 2) {
        setShowAnswerHint(true)
        speak(`${question.explain || ''}。 ひかってる ところを おしてみよう`, { rate: 0.88 })
      } else {
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
    <div className="screen screen-in">
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
        <ProgressDots total={questionCount} index={qIndex} />
        <div className="pill">
          {isReviewTask ? '🎯 とっくん' : `${domain.emoji} ${domain.name}`}
        </div>
      </div>

      <div className="center-col scroll-col">
        {/* 復習キューの問題には「克服チャンス」の目印 */}
        {isConquerTarget() && phase === 'answering' && (
          <div className="conquer-tag">⭐ できたら「ちから」になる もんだい！</div>
        )}

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
          {feedback.good && <Burst gold={feedback.gold} />}
          <div className="feedback__big">{feedback.gold ? '⚡' : feedback.good ? '🌟' : '💪'}</div>
          <div
            className="feedback__word"
            style={{
              color: feedback.gold ? 'var(--accent-2)' : feedback.good ? 'var(--accent)' : 'var(--bad-soft)'
            }}
          >
            {feedback.word}
          </div>
        </div>
      )}
    </div>
  )
}
