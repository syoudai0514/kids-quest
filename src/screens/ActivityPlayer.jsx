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
import { useGame, skillOf, needsReviewLesson } from '../state/GameContext.jsx'
import { DOMAIN_BY_ID, domainName } from '../engine/activities.js'
import { pickLesson, hasLesson } from '../data/lessons.js'
import { dueKeys, isDue, dayNumber } from '../engine/srs.js'
import LessonScreen from './LessonScreen.jsx'
import { difficultyParams } from '../engine/difficulty.js'
import { speak, cancelSpeak } from '../engine/tts.js'
import { reviewKeyFor, savedReviewQuestion, snapshotQuestion } from '../engine/reviewKey.js'
import { sfx } from '../engine/sfx.js'
import { AppHeader, Starfield, ProgressDots, Burst } from '../components/common.jsx'
import QuestionVisual, { CountGrid } from '../components/QuestionVisual.jsx'
import QuestionInteraction from '../components/QuestionInteraction.jsx'
import TracingCanvas from '../components/TracingCanvas.jsx'

// 「才能」ではなく、思い出す・数え直すなど再現できる行動をほめる。
const PRAISE = [
  'よく おもいだせたね！',
  'ゆっくり みて できたね！',
  'じぶんで えらべたね！',
  'かんがえて できたね！',
  'さいごまで よく みたね！'
]
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

  // 授業（勉強ターン）を出すか: コアミッションで
  //   ・その教科をはじめて やるとき → はじめての じゅぎょう
  //   ・直近の正解率が低いとき      → おさらいの じゅぎょう
  const lessonPlan = useRef(
    (() => {
      if (isReviewTask || task.kind !== 'core') return null
      const g = state.grade
      const dId = task.domainId
      if (!hasLesson(dId, g)) return null
      const seen = state.lessonSeen?.[`${g}:${dId}`] || 0
      const review = needsReviewLesson(state, dId, g)
      if (seen > 0 && !review) return null
      return { lesson: pickLesson(dId, g, review ? seen : 0), isReview: review && seen > 0, domainId: dId, grade: g }
    })()
  ).current
  const [inLesson, setInLesson] = useState(!!lessonPlan)

  const [qIndex, setQIndex] = useState(0)
  const [question, setQuestion] = useState(null)
  const [phase, setPhase] = useState('answering')
  const [chosenId, setChosenId] = useState(null)
  const [wrongIds, setWrongIds] = useState([])
  const [showAnswerHint, setShowAnswerHint] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [supportHint, setSupportHint] = useState(false)
  const [reinforcementCount, setReinforcementCount] = useState(0)
  const baseQuestionCount = isReviewTask ? task.plan.length : task.questionCount
  const questionCount = baseQuestionCount + reinforcementCount
  // 正誤演出の setTimeout は古い render の関数を持つため、直前に増やした
  // 再挑戦問題を見落とさないよう、終了判定だけは常に最新値を見る。
  const questionCountRef = useRef(questionCount)
  questionCountRef.current = questionCount

  const wrongCountRef = useRef(0)
  const firstAttemptRef = useRef(true)
  const phaseRef = useRef(phase)
  const traceHandledRef = useRef(false)
  phaseRef.current = phase
  const comboRef = useRef(0)
  // 正誤コメントを最後まで聞いてから次問へ進めるための識別子。
  // 以前は固定の 1.25 秒後に遷移しており、長いナビ音声を途中で止めていた。
  const feedbackSpeechRef = useRef(0)
  const feedbackTimerRef = useRef(null)
  const domainIdRef = useRef(task.domainId)
  const stateRef = useRef(state)
  stateRef.current = state

  // このタスクの「ちゃんと解いたか」の記録（追加問題のチケット判定に使う）
  const tallyRef = useRef({ correct: 0, total: 0, fastWrong: 0 })
  const shownAtRef = useRef(Date.now())
  const reinforcementQueueRef = useRef([])
  const reinforcementAttemptsRef = useRef({})

  const currentDomainId = () =>
    isReviewTask ? task.plan[Math.min(qIndex, task.plan.length - 1)].domainId : task.domainId
  const domain = DOMAIN_BY_ID[currentDomainId()]

  const makeQuestion = () => {
    traceHandledRef.current = false
    feedbackSpeechRef.current += 1
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    const domainId = currentDomainId()
    domainIdRef.current = domainId
    const dom = DOMAIN_BY_ID[domainId]
    const params = {
      ...difficultyParams(skillOf(stateRef.current, domainId)),
      grade: stateRef.current.grade
    }
    setSupportHint(params.hint >= 2)

    let review = null
    if (isReviewTask) {
      review = task.plan[Math.min(qIndex, task.plan.length - 1)].key
    } else {
      // このタスクで間違えた問題は、2問ほど間を空けて同じ問題をもう一度。
      // その場で答えを押し直すだけで終わらせず、思い出す練習にする。
      const reinforcementIndex = reinforcementQueueRef.current.findIndex((entry) => entry.after <= qIndex)
      if (reinforcementIndex >= 0) {
        review = reinforcementQueueRef.current.splice(reinforcementIndex, 1)[0].key
      }
      // 通常タスクでも、きょうが復習の期限になっている問題を混ぜる
      // （間隔反復: 忘れかけた ちょうどよい タイミングで もう一度 出会う）
      const due = dueKeys(stateRef.current.srs, domainId)
      if (!review && due.length && Math.random() < 0.45) {
        review = due[Math.floor(Math.random() * Math.min(due.length, 5))]
      }
    }
    const saved = savedReviewQuestion(stateRef.current, domainId, review)
    const generated = saved || dom.generateQuestion(params, review)
    // 旧セーブの「種類だけ」の復習キーも、そのまま復習として扱えるようにする。
    const q = review && !generated.reviewKey ? { ...generated, reviewKey: review } : generated
    setQuestion(q)
    setPhase('answering')
    setChosenId(null)
    setWrongIds([])
    setShowAnswerHint(false)
    setFeedback(null)
    wrongCountRef.current = 0
    firstAttemptRef.current = true
    shownAtRef.current = Date.now()
    return setTimeout(() => speak(q.speak), 300)
  }

  useEffect(() => {
    if (inLesson) return // 授業中は まだ問題を作らない
    const speechTimer = makeQuestion()
    return () => clearTimeout(speechTimer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex, inLesson])

  // 画面を離れたときに、前の問題文を次画面まで読ませない。
  useEffect(() => () => {
    feedbackSpeechRef.current += 1
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    cancelSpeak()
  }, [])

  // ---- 授業（勉強ターン）----
  if (inLesson && lessonPlan?.lesson) {
    return (
      <LessonScreen
        lesson={lessonPlan.lesson}
        domainId={lessonPlan.domainId}
        grade={lessonPlan.grade}
        isReview={lessonPlan.isReview}
        onDone={() => {
          dispatch({ type: 'LESSON_SEEN', domainId: lessonPlan.domainId, grade: lessonPlan.grade })
          setInLesson(false)
        }}
      />
    )
  }

  if (!question) return null

  const advance = () => {
    if (qIndex + 1 < questionCountRef.current) {
      setQIndex(qIndex + 1)
    } else {
      const t = tallyRef.current
      const accuracy = t.total ? t.correct / t.total : 1
      // 「読まずに連打」が半分以上なら 不正あつかい
      const suspicious = t.total >= 2 && t.fastWrong >= Math.ceil(t.total / 2)
      dispatch({ type: 'CLEAR_TASK', kind: task.kind, accuracy, suspicious })
      sfx.reward()
      // 追加問題でチケット条件を満たした場合は、この後に報酬オーバーレイが
      // チケット獲得文を読み上げる。ここでも同じ文を読むと、完了音声の途中で
      // 報酬音声へ切り替わったように聞こえるため、報酬画面へ任せる。
      const earnsBattleTicket =
        task.kind === 'extra' && accuracy >= 2 / 3 && !suspicious
      const line =
        task.kind === 'review'
          ? 'とっくん クリア！ まちがいが どんどん ちからに かわっていくよ！'
        : task.kind === 'extra'
            ? earnsBattleTicket
              ? ''
              : 'ぜんぶ とけたね！ つぎも ゆっくり かんがえて いこう！'
            : 'タスク クリア！ よくがんばったね！'
      // クリア時の言葉も、画面を切り替える前に最後まで聞かせる。
      void (line ? speak(line) : Promise.resolve()).finally(() => {
        feedbackTimerRef.current = setTimeout(onDone, 500)
      })
    }
  }

  const advanceAfterFeedback = (line, { rate: feedbackRate, minVisibleMs = 900 } = {}) => {
    const speechId = ++feedbackSpeechRef.current
    const startedAt = Date.now()
    // speak() は、専用音声なら <audio> の ended、iPhone音声なら utterance の
    // end を待って解決する。したがって次問の問題文がコメントを止めない。
    void speak(line, { rate: feedbackRate }).finally(() => {
      if (speechId !== feedbackSpeechRef.current) return
      const remain = Math.max(0, minVisibleMs - (Date.now() - startedAt))
      feedbackTimerRef.current = setTimeout(() => {
        if (speechId === feedbackSpeechRef.current) advance()
      }, remain)
    })
  }

  // この問題が復習キューにある（＝克服チャンス）か
  const isConquerTarget = () =>
    !!reviewKeyFor(question) &&
    isDue(stateRef.current.srs?.[domainIdRef.current]?.[reviewKeyFor(question)], dayNumber())

  const addReinforcement = (key) => {
    if (isReviewTask || !key) return
    const attempts = reinforcementAttemptsRef.current[key] || 0
    // 同じ問題を何度も間違えても、1タスク内で終わらなくならないよう上限は2回。
    if (attempts >= 2) return
    reinforcementAttemptsRef.current[key] = attempts + 1
    reinforcementQueueRef.current.push({ key, after: qIndex + 2 })
    setReinforcementCount((n) => n + 1)
  }

  const recordAnswer = (correct) => {
    if (!firstAttemptRef.current) return false
    // 初回の3問だけをチケット判定に使う。誤答後の類題は、
    // 思い出す練習として大切だが、報酬の合否には混ぜない。
    const elapsed = Date.now() - shownAtRef.current
    const countsForTicket = task.kind !== 'extra' || tallyRef.current.total < task.questionCount
    if (countsForTicket) {
      tallyRef.current.total += 1
      if (correct) tallyRef.current.correct += 1
      // 問題が出てすぐ（1.5秒未満）に誤答する行為が2回以上なら、
      // 実力の低さではなく「読まずに連打」と判断する。
      else if (elapsed < 1500) tallyRef.current.fastWrong += 1
    }
    const itemKey = reviewKeyFor(question)
    const conquer = correct && isConquerTarget()
    dispatch({
      type: 'ANSWER',
      domainId: domainIdRef.current,
      correct,
      itemKey,
      question: correct ? null : snapshotQuestion(question, itemKey)
    })
    if (!correct) addReinforcement(itemKey)
    firstAttemptRef.current = false
    return conquer
  }

  // 「かく」（なぞり書き）が終わったとき
  const handleTraceDone = (success) => {
    // iPhoneのタッチ終了や完了タイマーが重なっても、1問を二重採点しない。
    if (phaseRef.current === 'feedback' || traceHandledRef.current) return
    traceHandledRef.current = true
    const conquer = recordAnswer(success)
    if (conquer) {
      setFeedback({ good: true, word: 'ちからに なった！', gold: true })
      sfx.levelUp()
      phaseRef.current = 'feedback'
      setPhase('feedback')
      advanceAfterFeedback('まちがいが ちからに なった！ ボーナス ゲット！')
      return
    }
    const word = pick(PRAISE)
    setFeedback({ good: true, word })
    phaseRef.current = 'feedback'
    setPhase('feedback')
    advanceAfterFeedback(word)
  }

  const handleAnswerId = (answerId) => {
    if (phase === 'feedback') return
    const correct = answerId === question.answerId
    const conquer = recordAnswer(correct)

    if (correct) {
      setChosenId(answerId)
      setPhase('feedback')
      comboRef.current += 1
      const combo = comboRef.current
      if (conquer) {
        // まちがえたことのある問題を克服！ 金の演出＋ボーナス
        sfx.levelUp()
        setFeedback({ good: true, word: 'ちからに なった！', gold: true })
        const tail = question.answerWord ? `${question.answerWord.text}！ ` : ''
        advanceAfterFeedback(`${tail}まちがいが ちからに なった！ ボーナス ゲット！`)
      } else {
        sfx.correct()
        const word = combo >= 2 ? `${combo}れんぞく！` : pick(PRAISE)
        setFeedback({ good: true, word })
        const tail = question.answerWord ? `${question.answerWord.text}！ ` : ''
        advanceAfterFeedback(`${tail}${combo >= 2 ? `${combo}れんぞく せいかい！ すごい！` : word}`)
      }
    } else {
      comboRef.current = 0
      wrongCountRef.current += 1
      setWrongIds((w) => [...w, answerId])
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
    return correct
  }

  const handleChoose = (choice) => {
    if (wrongIds.includes(choice.id)) return false
    return handleAnswerId(choice.id)
  }

  // 「わからない」= 正直に。適当に答えるより、答えを一緒に見て覚える。
  // 記録上はミス扱い（＝とっくんキューに入って、あとで克服チャンスになる）。
  const handleDontKnow = () => {
    if (phase === 'feedback') return
    recordAnswer(false) // 初回のみ有効。ミスとして復習キューへ
    comboRef.current = 0
    setChosenId(question.answerId) // 正解を光らせて見せる
    setWrongIds([])
    setPhase('feedback')
    const ans = question.choices?.find((c) => c.id === question.answerId)
    const ansText = question.answerWord?.text || ans?.label || ''
    setFeedback({ good: false, word: 'いっしょに おぼえよう' })
    advanceAfterFeedback(
      `だいじょうぶ。こたえは 「${ansText}」。${question.explain || ''} つぎは できるよ！`,
      { rate: 0.9, minVisibleMs: 1200 }
    )
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
  const isChoice = !question.type || question.type === 'choice'
  const grid =
    question.choices && question.choices.length === 3
      ? 'choice-grid choice-grid--3'
      : 'choice-grid'

  return (
    <div className="screen screen-in">
      <Starfield count={16} />

      <AppHeader
        className="app-header--progress"
        onBack={onDone}
        title={<ProgressDots total={questionCount} index={qIndex} />}
        right={<div className="pill">{isReviewTask ? '🎯 とっくん' : `${domain.emoji} ${domainName(domain, state.grade)}`}</div>}
      />

      <div className="center-col scroll-col">
        {/* 復習キューの問題には「克服チャンス」の目印 */}
        {isConquerTarget() && phase === 'answering' && (
          <div className="conquer-tag">⭐ できたら「ちから」になる もんだい！</div>
        )}
        {supportHint && phase === 'answering' && (
          <div className="conquer-tag">💡 きょうは ヒントを つかいながら ゆっくり いこう</div>
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
            {isChoice ? (
              <div className={grid}>
                {question.choices.map((choice) => (
                  <button
                    key={choice.id}
                    className={choiceClass(choice)}
                    disabled={phase === 'feedback' && choice.id !== chosenId}
                    onClick={() => handleChoose(choice)}
                  >
                    {choice.emoji && <span className="choice__emoji">{choice.emoji}</span>}
                    {choice.grid && <CountGrid emoji={choice.grid.emoji} n={choice.grid.n} mini />}
                    {choice.label && <span className="choice__label">{choice.label}</span>}
                  </button>
                ))}
              </div>
            ) : (
              <QuestionInteraction
                question={question}
                onSubmit={handleAnswerId}
                disabled={phase === 'feedback'}
                showHint={showAnswerHint && phase === 'answering'}
              />
            )}
            {phase === 'answering' && (
              <button
                className="btn btn--ghost dontknow-btn"
                onClick={handleDontKnow}
                style={{ marginTop: 6, opacity: 0.85, fontSize: 'clamp(14px,2.4vw,17px)' }}
              >
                🤔 わからない（こたえを みる）
              </button>
            )}
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
