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
import { activeStatsDomainId, useGame, skillOf, needsReviewLesson } from '../state/GameContext.jsx'
import { DOMAIN_BY_ID, domainName } from '../engine/activities.js'
import { dueKeys, isDue, dayNumber } from '../engine/srs.js'
import LessonScreen from './LessonScreen.jsx'
import { difficultyParams } from '../engine/difficulty.js'
import { speak, cancelSpeak, hasEnglishVoice, subscribeEnglishVoice, speakEnglish, speakEnglishThenJapanese } from '../engine/tts.js'
import { englishTaskForms, normalizeEnglishKey } from '../data/content/english.js'
import { generatorReviewKey, reviewKeyFor, savedReviewQuestion, snapshotQuestion, withQuestionIds } from '../engine/reviewKey.js'
import { nextLearningUnit, selectPracticeUnit, unitStatsFor, withLearningUnit, lessonForUnit } from '../engine/learningUnits.js'
import { questionForUnit } from '../engine/unitQuestions.js'
import { reinforcementExtraCount, reinforcementTargetIndex } from '../engine/reinforcement.js'
import { sfx } from '../engine/sfx.js'
import { AppHeader, Starfield, ProgressDots, Burst } from '../components/common.jsx'
import QuestionVisual, { CountGrid } from '../components/QuestionVisual.jsx'
import QuestionInteraction from '../components/QuestionInteraction.jsx'
import TracingCanvas from '../components/TracingCanvas.jsx'
import EnglishSpeakingPractice from '../components/EnglishSpeakingPractice.jsx'

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
  const focusUnitRef = useRef(
    !isReviewTask && task.kind === 'core' && task.domainId !== 'english' && task.domainId !== 'doutoku'
      ? nextLearningUnit(state, state.grade, task.domainId)
      : null
  )

  // 授業（勉強ターン）を出すか: コアミッションで
  //   ・その教科をはじめて やるとき → はじめての じゅぎょう
  //   ・直近の正解率が低いとき      → おさらいの じゅぎょう
  const lessonPlan = useRef(
    (() => {
      if (isReviewTask || task.kind !== 'core') return null
      const g = state.grade
      const dId = task.domainId
      const seen = state.lessonSeen?.[`${g}:${dId}`] || 0
      const review = needsReviewLesson(state, dId, g)
      const unitSeen = unitStatsFor(state, g, dId)[focusUnitRef.current]
      if (unitSeen?.attempts > 0 && seen > 0 && !review) return null
      // 既存レッスンを seed=0 で流用すると、分数の前にわり算を教える。
      // 単元専用が無い場合も、別単元の説明ではなくこの単元の導入を表示する。
      return { lesson: lessonForUnit(focusUnitRef.current), isReview: review && seen > 0, domainId: dId, grade: g }
    })()
  ).current
  const [inLesson, setInLesson] = useState(!!lessonPlan)
  const [, setEnglishVoiceReady] = useState(() => hasEnglishVoice())

  const [qIndex, setQIndex] = useState(0)
  const [question, setQuestion] = useState(null)
  const [phase, setPhase] = useState('answering')
  const [chosenId, setChosenId] = useState(null)
  const [wrongIds, setWrongIds] = useState([])
  const [showAnswerHint, setShowAnswerHint] = useState(false)
  const [explainReveal, setExplainReveal] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [supportHint, setSupportHint] = useState(false)
  const [reinforcementCount, setReinforcementCount] = useState(0)
  // タスクを始めた時点の音声可否と4問計画を固定する。途中で音声一覧が更新されても、
  // 子どもが回答中の問題は差し替えない。
  const englishAudioForTask = useRef(Boolean(state.settings?.tts && hasEnglishVoice())).current
  const englishFormPlan = useRef(englishTaskForms(state.grade, englishAudioForTask)).current
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

  useEffect(() => subscribeEnglishVoice(setEnglishVoiceReady), [])

  // このタスクの「ちゃんと解いたか」の記録（追加問題のチケット判定に使う）
  const tallyRef = useRef({ correct: 0, total: 0, fastWrong: 0 })
  const shownAtRef = useRef(Date.now())
  const reinforcementQueueRef = useRef([])
  const reinforcementAttemptsRef = useRef({})
  // 通常の英語タスクでは正答済みの同一項目を繰り返さない。
  // 図鑑から指定した練習だけは、4問すべて同じ単語に固定する。
  const shownEnglishItemsRef = useRef([])

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
    // むずかしいモード（保護者設定）は、習熟度の管理を通常と分けるため
    // skillOf も 'hard:${domainId}' の名前空間で読む（GameContextのANSWER
    // reducerが記録時に同じ名前空間へ振り分けている。計画書§4.2(d)(f)）。
    const statsDomainId = activeStatsDomainId(stateRef.current, domainId)
    const mode = statsDomainId.startsWith('hard:') ? 'hard' : 'normal'
    const params = {
      ...difficultyParams(skillOf(stateRef.current, statsDomainId)),
      mode,
      grade: stateRef.current.grade,
      englishAudioAvailable: domainId === 'english' ? englishAudioForTask : true,
      taskForm: domainId === 'english' && !isReviewTask && !reinforcementQueueRef.current.some((entry) => entry.after <= qIndex)
        ? (task.focusWordId
            ? ['listen-picture', 'picture-word', 'word-meaning', 'japanese-word'][Math.min(qIndex, 3)]
            : englishFormPlan[Math.min(qIndex, englishFormPlan.length - 1)])
        : undefined,
      englishWordStats: stateRef.current.englishWordStats,
      englishPhraseStats: stateRef.current.englishPhraseStats,
      englishAlphabetStats: stateRef.current.englishAlphabetStats,
      today: dayNumber(),
      questionIndex: qIndex,
      seenItemKeys: domainId === 'english' ? shownEnglishItemsRef.current : undefined,
      // 固定バンク教科（りか・しゃかい・どうとく・よむの語彙/漢字）向け:
      // 一度でも出題したことがある knowledgeId の集合。srs は正誤に関わらず
      // 毎回このドメインの itemKey で記録されるため、そのまま「既出」の
      // 正になる（英語だけ別管理＝englishWordStats 等を別途渡している）。
      everSeenKnowledge: domainId === 'english' ? undefined : new Set(Object.keys(stateRef.current.srs?.[statsDomainId] || {})),
      // どうとくD視点「生命の終わり」の判定用。保護者設定がONかつ現在の
      // 学年（gradeMaxではなくgrade）が高学年のときだけ、doutoku.js側が
      // 該当項目を生成候補に入れる。
      showLifeEndTopics: stateRef.current.settings?.showLifeEndTopics === true
    }
    setSupportHint(params.hint >= 2)

    // 図鑑からの練習は4問すべて同じ語。形式だけを変えて結び付ける。
    let review = task.focusWordId ? `enw:${task.focusWordId}` : null
    let reinforcementSnapshot = null
    if (isReviewTask) {
      review = task.plan[Math.min(qIndex, task.plan.length - 1)].key
    } else if (!review && domainId === 'english') {
      const reinforcementIndex = reinforcementQueueRef.current.findIndex((entry) => entry.after <= qIndex)
      if (reinforcementIndex >= 0) {
        const reinforcement = reinforcementQueueRef.current.splice(reinforcementIndex, 1)[0]
        review = reinforcement.key
        reinforcementSnapshot = reinforcement.question
      }
    } else {
      // このタスクで間違えた問題は、2問ほど間を空けて同じ問題をもう一度。
      // その場で答えを押し直すだけで終わらせず、思い出す練習にする。
      const reinforcementIndex = reinforcementQueueRef.current.findIndex((entry) => entry.after <= qIndex)
      if (reinforcementIndex >= 0) {
        const reinforcement = reinforcementQueueRef.current.splice(reinforcementIndex, 1)[0]
        review = reinforcement.key
        reinforcementSnapshot = reinforcement.question
      }
      // 通常タスクでも、きょうが復習の期限になっている問題を混ぜる
      // （間隔反復: 忘れかけた ちょうどよい タイミングで もう一度 出会う）。
      // ただし算数など、出題タイプ自体が学年の単元になっている分野では、
      // 2学年以上前の古い単元（例: 小6での九九だけの単独出題）を除く。
      const dueAll = dueKeys(stateRef.current.srs, statsDomainId)
      const due = dom?.isReviewStale ? dueAll.filter((key) => !dom.isReviewStale(key, stateRef.current.grade)) : dueAll
      // 新単元の導入直後2問には、期限復習を割り込ませない。
      if (!review && qIndex >= 2 && due.length && Math.random() < 0.45) {
        review = due[Math.floor(Math.random() * Math.min(due.length, 5))]
      }
    }
    // 英語の旧スナップショットには「問題と選択肢が同じ絵」の形式が残り得る。
    // 進捗キーは生かし、表示だけは常に安全な新しい問題形式で再生成する。
    const saved = domainId === 'english' ? null : savedReviewQuestion(stateRef.current, domainId, review)
    const learnedUnits = Object.entries(unitStatsFor(stateRef.current, stateRef.current.grade, domainId))
      .filter(([, stat]) => (stat.attempts || 0) >= 2)
      .map(([id]) => id)
    const targetUnit = !review && !isReviewTask
      ? (qIndex < 2 ? focusUnitRef.current : selectPracticeUnit(stateRef.current, stateRef.current.grade, domainId, learnedUnits) || focusUnitRef.current)
      : null
    // review は「出したい問題」と「記録する問題」を同じキーで束ねる。
    // ここで渡さないと、moon を指定して別の単語を出し moon に記録する事故になる。
    const generated = reinforcementSnapshot || saved || (domainId === 'english'
      ? dom.generateQuestion({ ...params, reviewKey: review }, review)
      : review?.startsWith('skill:')
        ? dom.generateQuestion({ ...params, unitId: review.slice(6) }, generatorReviewKey(review))
        : review
          ? dom.generateQuestion(params, review)
        : questionForUnit(dom, { ...params, unitId: targetUnit }, targetUnit))
    // 指定復習を作れない場合は、別問題へすり替えて採点しない。次回に残す。
    const generatedWithIds = generated ? withQuestionIds(withLearningUnit(generated, params.grade)) : null
    const wrongReviewItem = review && (domainId === 'english'
      ? normalizeEnglishKey(generatedWithIds?.itemKey) !== normalizeEnglishKey(review)
      : generatedWithIds?.knowledgeId !== review)
    if (!generated || wrongReviewItem) {
      setQuestion(null)
      setFeedback({ good: false, word: 'この もんだいを じゅんび中だよ。あとで もういちど やろう。' })
      return setTimeout(advance, 900)
    }
    // 旧セーブの「種類だけ」の復習キーも、そのまま復習として扱えるようにする。
    let q = review && !generatedWithIds.reviewKey ? { ...generatedWithIds, reviewKey: review } : generatedWithIds
    // 未経験の書字は必ずお手本つき。別日に成功してから自由書きへ進む。
    if (q?.type === 'trace') {
      const stat = stateRef.current.writingStats?.[`${params.grade}:${q.target}`]
      const hasEarlierDaySuccess = (stat?.successDays || []).some((day) => day < dayNumber())
      if (!hasEarlierDaySuccess || !stat?.guideSeen) q = { ...q, stage: 'trace' }
    }
    if (domainId === 'english' && q.itemKey) {
      if (!review) shownEnglishItemsRef.current = [...new Set([...shownEnglishItemsRef.current, q.itemKey])]
    }
    setQuestion(q)
    setPhase('answering')
    setChosenId(null)
    setWrongIds([])
    setShowAnswerHint(false)
    setExplainReveal(null)
    setFeedback(null)
    wrongCountRef.current = 0
    firstAttemptRef.current = true
    shownAtRef.current = Date.now()
    return setTimeout(() => {
      if (domainId === 'english' && q.autoPlayPrompt && q.promptEnglishAudio) {
        // iPhoneでは日本語ナビの完了後に英語を開始すると、2本目だけ再生されない
        // ことがある。英語問題は英文を直接流し、聞くための追加タップをなくす。
        void speakEnglish(q.promptEnglishAudio)
      } else speak(q.speak)
    }, 300)
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

  // question より前に定義する: makeQuestion() は「指定復習を作れない」場合、
  // 初回レンダー（question=null で早期returnする前）の effect からでも
  // advance を直接呼ぶ（218行目）。question の後ろで定義すると、その
  // 初回レンダーの実行では advance の宣言に到達せず、TDZ で
  // 「Cannot access 'advance' before initialization」のまま画面が
  // 真っ白になっていた（実機のとっくんで再現・修正）。
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

  const advanceAfterFeedback = (line, { english = '', rate: feedbackRate, minVisibleMs = 900 } = {}) => {
    const speechId = ++feedbackSpeechRef.current
    const startedAt = Date.now()
    // speak() は、専用音声なら <audio> の ended、iPhone音声なら utterance の
    // end を待って解決する。したがって次問の問題文がコメントを止めない。
    // 日本語ナビに英単語を渡すと、端末によっては "monkey" をつづり読み、
    // "bus" を「バス」と読む。英語教材の答えは必ず英語音声で先に読む。
    const narration = domainIdRef.current === 'english' && english
      ? speakEnglishThenJapanese(english, line, { rate: feedbackRate })
      : speak(line, { rate: feedbackRate })
    void narration.finally(() => {
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
    // SRSは類題、タスク内の補強は「同じ設問」。算数も数値を保存して再出題する。
    reinforcementQueueRef.current.push({ key, question: snapshotQuestion(question, key), after: reinforcementTargetIndex(qIndex) })
    // 最終問でも「2問後」を置ける長さまでだけ末尾を延長する。
    setReinforcementCount((n) => reinforcementExtraCount(baseQuestionCount, n, qIndex))
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
      unitId: question.unitId,
      englishItemKey: question.itemKey,
      question: snapshotQuestion(question, itemKey)
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
    if (phase !== 'answering') return
    const correct = answerId === question.answerId
    const conquer = recordAnswer(correct)

    if (correct) {
      setChosenId(answerId)
      // 発音練習は回答前に任意で開ける補助機能。正解後の進行を止めない。
      setPhase('feedback')
      phaseRef.current = 'feedback'

      if (showAnswerHint) {
        // 2回まちがえて「答えを見せた」あと、光っている正解をタップしただけ。
        // ここで「せいかい！」の音・れんぞく表示を出すと、教えてもらっただけ
        // なのに正解扱いされたように見えて誤解を招く（実際の採点・SRSは
        // 1回目の誤答のまま記録済みで変わらない）。淡々と次へ進む。
        sfx.pop()
        setFeedback({ good: true, word: 'つぎへ いこう' })
        advanceAfterFeedback('こたえを かくにんできたね。つぎの もんだいへ いこう', {
          english: isEnglish ? question.answerWord?.text : ''
        })
        return correct
      }

      comboRef.current += 1
      const combo = comboRef.current
      // 一度でも間違えてから正解できた問題は、復習の意味で解説も添える
      // （テンポを保つため、一発正解のときは出さない）。
      const learnedExplain =
        wrongIds.length > 0 && question.explain
          ? { text: question.explain, spelling: isEnglish ? question.answerWord?.text : null }
          : null
      if (conquer) {
        // まちがえたことのある問題を克服！ 金の演出＋ボーナス
        sfx.levelUp()
        setFeedback({ good: true, word: 'ちからに なった！', gold: true, explain: learnedExplain })
        advanceAfterFeedback('まちがいが ちからに なった！ ボーナス ゲット！', {
          english: isEnglish ? question.answerWord?.text : ''
        })
      } else {
        sfx.correct()
        const word = combo >= 2 ? `${combo}れんぞく！` : pick(PRAISE)
        setFeedback({ good: true, word, explain: learnedExplain })
        advanceAfterFeedback(combo >= 2 ? `${combo}れんぞく せいかい！ すごい！` : word, {
          english: isEnglish ? question.answerWord?.text : ''
        })
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
        // 苦手支援の2ミス目: 正解を光らせるだけでなく、解説を画面にも残す
        // （音声だけだと、特に英語のスペルは聞いただけでは学べない）。
        setExplainReveal({
          text: question.explain || '',
          spelling: isEnglish ? question.answerWord?.text : null,
          column: question.explainColumn || null,
          steps: question.explainSteps || null
        })
        if (isEnglish) {
          // explain は英語と日本語が混在する教材文なので、音声（日本語ナビ）へは
          // 渡さない。答えの英語はネイティブ音声で読む。意味・解説は画面の
          // 解説カード（explainReveal）に文字で出すので、そちらで伝える。
          void speakEnglishThenJapanese(question.answerWord?.text, 'こたえを きいて、ひかってる ところを おしてみよう', { rate: 0.88 })
        } else speak(`${question.explain || ''}。 ひかってる ところを おしてみよう`, { rate: 0.88 })
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
    setExplainReveal({ text: question.explain || '', spelling: isEnglish ? ansText : null, column: question.explainColumn || null, steps: question.explainSteps || null })
    advanceAfterFeedback(
      isEnglish
        ? 'だいじょうぶ。こたえを きいて、おぼえよう。つぎは できるよ！'
        : `だいじょうぶ。こたえは 「${ansText}」。${question.explain || ''} つぎは できるよ！`,
      { english: isEnglish ? ansText : '', rate: 0.9, minVisibleMs: 1200 }
    )
  }

  // どうとくD視点「答えのない問い」（type:'reflect'）: 選んだ見方を
  // 見せるだけで、正誤の演出・効果音・SRS・習熟度・進級のいずれにも
  // 使わない（recordAnswer を呼ばない＝計画書WP6-aの必須事項）。
  const handleReflectChoice = (viewId) => {
    if (phase !== 'answering') return
    const view = question.views?.find((v) => v.id === viewId)
    if (!view) return
    setChosenId(viewId)
    setPhase('feedback')
    phaseRef.current = 'feedback'
    sfx.pop()
    setFeedback({ good: true, word: 'そう かんじたんだね', explain: { text: view.note } })
    advanceAfterFeedback(view.note, { minVisibleMs: 1400 })
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
  const isReflect = question.type === 'reflect'
  const isChoice = !question.type || question.type === 'choice'
  const isEnglish = domainIdRef.current === 'english'
  const grid =
    question.choices && question.choices.length === 3
      ? `choice-grid choice-grid--3${isEnglish ? ' choice-grid--english' : ''}`
      : `choice-grid${isEnglish ? ' choice-grid--english' : ''}`

  return (
    <div className={'screen screen-in activity-screen' + (isEnglish ? ' activity-screen--english' : '')}>
      <Starfield count={16} />

      <AppHeader
        className="app-header--progress"
        onBack={onDone}
        title={<ProgressDots total={questionCount} index={qIndex} />}
        right={<div className="pill">{isReviewTask ? '🎯 とっくん' : `${domain.emoji} ${domainName(domain, state.grade)}`}</div>}
      />

      <div className="center-col scroll-col">
        {/* むずかしいモードの問題は、ふつうの問題と必ず見分けられるようにする。
            解けなくても実力不足ではないと分かるよう、答え合わせ中も出したままにする。 */}
        {String(question.itemKey || '').startsWith('hard:') && (
          <div className="hard-tag">🎓 むずかしいモードの もんだい</div>
        )}
        {/* 復習キューの問題には「克服チャンス」の目印 */}
        {isConquerTarget() && phase === 'answering' && (
          <div className="conquer-tag">⭐ できたら「ちから」になる もんだい！</div>
        )}
        {supportHint && phase === 'answering' && (
          <div className="conquer-tag">💡 きょうは ヒントを つかいながら ゆっくり いこう</div>
        )}

        <div className="muted activity-instruction" style={{ fontSize: 'clamp(16px,3vw,24px)', fontWeight: 800 }}>
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
            {isEnglish && (
              <button
                className="btn btn--ghost english-audio-replay"
                type="button"
                onClick={() => {
                  if (englishAudioForTask && question.promptEnglishAudio) void speakEnglish(question.promptEnglishAudio)
                  else void speak(question.speak)
                }}
              >
                🔊 {englishAudioForTask && question.promptEnglishAudio ? '英語を もういちど きく' : 'もんだいを もういちど きく'}
              </button>
            )}
            {isEnglish && englishAudioForTask && phase === 'answering' && question.autoPlayPrompt && question.promptEnglishAudio && question.practiceEnglish && (
              <EnglishSpeakingPractice
                key={question.questionInstanceId || `${qIndex}:${question.itemKey}`}
                text={question.practiceEnglish}
                onDone={() => {
                  dispatch({ type: 'ENGLISH_SPEAKING_DONE', itemKey: String(question.itemKey || '').split('#')[0] })
                }}
              />
            )}
            {isReflect ? (
              <div className={grid}>
                {question.views.map((view) => (
                  <button
                    key={view.id}
                    className={'choice' + (phase === 'feedback' && view.id === chosenId ? ' choice--selected' : '')}
                    disabled={phase !== 'answering'}
                    onClick={() => handleReflectChoice(view.id)}
                  >
                    <span className="choice__label">{view.label}</span>
                  </button>
                ))}
              </div>
            ) : isChoice ? (
              <div className={grid}>
                {question.choices.map((choice) => (
                  <button
                    key={choice.id}
                    className={choiceClass(choice)}
                    disabled={phase !== 'answering' || wrongIds.includes(choice.id)}
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
                disabled={phase !== 'answering'}
                showHint={showAnswerHint && phase === 'answering'}
              />
            )}
            {explainReveal && (explainReveal.spelling || explainReveal.text || explainReveal.column || explainReveal.steps) && (
              <div className="explain-card">
                {explainReveal.spelling && (
                  <div className="explain-card__spelling">{explainReveal.spelling}</div>
                )}
                {explainReveal.column && <pre className="explain-card__column">{explainReveal.column}</pre>}
                {explainReveal.text && <div className="explain-card__text">{explainReveal.text}</div>}
                {/* むずかしいモード（特殊算など）の段階解説。答えを当てることより
                    式の組み立て方を残すのが目的（計画書§4.2(e)）。 */}
                {Array.isArray(explainReveal.steps) && explainReveal.steps.length > 0 && (
                  <ol className="explain-card__steps">
                    {explainReveal.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                )}
              </div>
            )}
            {phase === 'answering' && !isReflect && (
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
          {feedback.explain && (
            <div className="feedback__explain">
              {feedback.explain.spelling && <span className="feedback__explain-spelling">{feedback.explain.spelling}</span>}
              {feedback.explain.text}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
