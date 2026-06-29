// ============================================================
// タスク（数問のまとまり）のプレイ画面 — 全分野で共通の出題エンジン。
//
// 設計の肝（依頼の最重要ポイントを実装）:
//  - 正解が続くと難易度が上がる（generateQuestion に渡す params が上がる）。
//  - 間違えても責めない。やわらかい音・声で「もういっかい いけるよ！」。
//  - 同じ問題で2回つまずいたら、正解をそっと光らせて必ずできるようにする
//    （＝苦手意識を持たせない / できるまで段階を細かく）。
//  - 難易度に効くのは「最初の1回の結果」だけ。やり直しは支援なので減点しない。
// ============================================================

import React, { useEffect, useRef, useState } from 'react'
import { useGame } from '../state/GameContext.jsx'
import { DOMAIN_BY_ID } from '../engine/activities.js'
import { difficultyParams } from '../engine/difficulty.js'
import { speak } from '../engine/tts.js'
import { sfx } from '../engine/sfx.js'
import { Starfield, ProgressDots } from '../components/common.jsx'

const PRAISE = ['せいかい！', 'すごい！', 'やったね！', 'てんさい！', 'かんぺき！', 'いいね！']
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
  const [phase, setPhase] = useState('answering') // 'answering' | 'feedback'
  const [chosenId, setChosenId] = useState(null)
  const [wrongIds, setWrongIds] = useState([])
  const [showAnswerHint, setShowAnswerHint] = useState(false)
  const [feedback, setFeedback] = useState(null) // {good:boolean, word:string}

  const wrongCountRef = useRef(0)
  const firstAttemptRef = useRef(true)
  const skillRef = useRef(state.skills[task.domainId])
  skillRef.current = state.skills[task.domainId]

  // 問題を生成（その時点の習熟度から難易度を決める＝アダプティブ）
  const makeQuestion = () => {
    const params = difficultyParams(skillRef.current)
    const q = domain.generateQuestion(params)
    setQuestion(q)
    setPhase('answering')
    setChosenId(null)
    setWrongIds([])
    setShowAnswerHint(false)
    setFeedback(null)
    wrongCountRef.current = 0
    firstAttemptRef.current = true
    // 指示・問題文は必ず声でも伝える
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
      // タスク完了 → ごほうび進行
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

  const handleChoose = (choice) => {
    if (phase === 'feedback') return
    if (wrongIds.includes(choice.id)) return
    const correct = choice.id === question.answerId

    // 難易度に効くのは最初の1回だけ
    if (firstAttemptRef.current) {
      dispatch({ type: 'ANSWER', domainId: task.domainId, correct })
      firstAttemptRef.current = false
    }

    if (correct) {
      setChosenId(choice.id)
      setPhase('feedback')
      sfx.correct()
      const word = pick(PRAISE)
      setFeedback({ good: true, word })
      // 何の言葉だったかを添えて読み上げ（よむ力の定着）
      const tail = question.answerWord ? `${question.answerWord.text}！ ` : ''
      speak(`${tail}${word}`)
      setTimeout(advance, 1250)
    } else {
      // 責めない。やわらかく支える。
      wrongCountRef.current += 1
      setWrongIds((w) => [...w, choice.id])
      sfx.wrongSoft()
      const cheer = pick(CHEER)
      setFeedback({ good: false, word: 'もういっかい！' })
      setTimeout(() => setFeedback(null), 900)

      // 2回つまずいたら正解をそっと光らせて、必ずできるように段階を細かく
      if (wrongCountRef.current >= 2) {
        setShowAnswerHint(true)
        const ans = question.answerWord
        const hint = ans ? `こたえは「${ans.text}」だよ。ひかってる ところを おしてみよう！` : cheer
        speak(hint)
      } else {
        const ans = question.answerWord
        const hint =
          ans && question.mode === 'pick-word'
            ? `${cheer} さいしょは「${ans.text[0]}」だよ`
            : cheer
        speak(hint)
      }
    }
  }

  const choiceClass = (choice) => {
    let c = 'choice'
    if (phase === 'feedback' && choice.id === chosenId) c += ' choice--correct'
    if (wrongIds.includes(choice.id)) c += ' choice--wrong'
    if (showAnswerHint && choice.id === question.answerId) {
      // やさしく光らせる
      return c
    }
    return c
  }

  const grid =
    question.choices.length >= 3 ? 'choice-grid choice-grid--3' : 'choice-grid'

  return (
    <div className="screen fade-in">
      <Starfield count={18} />

      {/* 上部: やめる + 進捗 */}
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
        <div className="pill">{domain.emoji} {domain.name}</div>
      </div>

      <div className="center-col">
        {/* 指示 */}
        <div
          className="muted"
          style={{ fontSize: 'clamp(16px,3vw,24px)', fontWeight: 800 }}
        >
          {question.instruction}
        </div>

        {/* 問題（絵 or ことば） */}
        <button
          className="card"
          onClick={() => speak(question.speak)}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 'min(420px,80vw)',
            background: 'rgba(255,255,255,0.06)'
          }}
          aria-label="もういちどきく"
        >
          {question.promptEmoji && (
            <span style={{ fontSize: 'clamp(70px,18vw,150px)', lineHeight: 1 }}>
              {question.promptEmoji}
            </span>
          )}
          {question.promptText && <span className="prompt-text">{question.promptText}</span>}
        </button>

        {/* 選択肢 */}
        <div className={grid}>
          {question.choices.map((choice) => {
            const glow =
              showAnswerHint && choice.id === question.answerId
                ? {
                    boxShadow: '0 0 0 4px #fff, 0 0 26px 6px var(--accent-2)',
                    animation: 'twinkle 1s ease-in-out infinite'
                  }
                : null
            return (
              <button
                key={choice.id}
                className={choiceClass(choice)}
                style={glow}
                disabled={phase === 'feedback' && choice.id !== chosenId}
                onClick={() => {
                  if (choice.speak) speak(choice.speak)
                  handleChoose(choice)
                }}
              >
                {choice.emoji && <span className="choice__emoji">{choice.emoji}</span>}
                {choice.label && <span className="choice__label">{choice.label}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* フィードバック演出 */}
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
