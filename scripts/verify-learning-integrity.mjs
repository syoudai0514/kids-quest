import { generateEnglishQuestion, ENGLISH_WORDS, ENGLISH_PHRASES, normalizeEnglishKey } from '../src/data/content/english.js'
import { generateDoutokuQuestion } from '../src/data/content/doutoku.js'
import { RIKA_UNIT_EXPECTATIONS } from '../src/data/content/rika.js'
import { SHAKAI_UNIT_EXPECTATIONS } from '../src/data/content/shakai.js'
import { WRITING_GROUPS_BY_GRADE } from '../src/data/content/writing.js'
import { DOMAIN_BY_ID } from '../src/engine/activities.js'
import { unitLedger, requiredUnitIds, unitReady, recordUnitResult, promotionResult, lessonForUnit, selectPracticeUnit, withLearningUnit } from '../src/engine/learningUnits.js'
import { migrateEnglishWordStats } from '../src/engine/englishMigration.js'
import { englishDueEntries } from '../src/engine/englishProgress.js'
import { generatorReviewKey, questionIds, withQuestionIds, persistentReviewSnapshot } from '../src/engine/reviewKey.js'
import { activeReviewSrs, activeStatsDomainId } from '../src/engine/reviewMode.js'
import { buildCoreMission } from '../src/engine/missions.js'
import { migrateLearningProgress, UNIT_PROGRESS_VERSION } from '../src/engine/progressMigration.js'
import { questionForUnit } from '../src/engine/unitQuestions.js'
import { makeTrialQuestions } from '../src/engine/trialQuestions.js'
import { reinforcementExtraCount, reinforcementTargetIndex } from '../src/engine/reinforcement.js'
import { BATTLE_TICKET_TTL_DAYS, grantBattleTicket, normalizeBattleTickets, spendBattleTicket } from '../src/engine/battleTickets.js'
import { lowerGradeProgress } from '../src/engine/gradeReset.js'
import { scheduleAnswer } from '../src/engine/srs.js'

const must = (value, message) => { if (!value) throw new Error(message) }
const base = (key) => String(key || '').split('#')[0]
const sameCounts = (actual, expected) => Object.keys(actual).length === Object.keys(expected).length && Object.entries(expected).every(([key, value]) => actual[key] === value)

// 三層ID: 選択肢順では変わらず、答え・数値が変われば設問インスタンスだけ変わる。
const reorderedA = withQuestionIds({ domain: 'rika', unitId: 'science:4:water-states', itemKey: 'r:水', instruction: '水は？', answerId: '液体', choices: [{ id: 'a', label: '液体' }, { id: 'b', label: '気体' }] })
const reorderedB = withQuestionIds({ domain: 'rika', unitId: 'science:4:water-states', itemKey: 'r:水', instruction: '水は？', answerId: '液体', choices: [{ id: 'b', label: '気体' }, { id: 'a', label: '液体' }] })
const changedAnswer = withQuestionIds({ ...reorderedA, answerId: '気体' })
must(reorderedA.knowledgeId === 'r:水' && reorderedA.knowledgeId === reorderedB.knowledgeId, '安定knowledgeIdを作れない')
must(reorderedA.questionInstanceId === reorderedB.questionInstanceId, '選択肢順だけでquestionInstanceIdが変わった')
must(reorderedA.knowledgeId === changedAnswer.knowledgeId && reorderedA.questionInstanceId !== changedAnswer.questionInstanceId, '答えが違う設問インスタンスを分離できない')

let mathA = withQuestionIds(questionForUnit(DOMAIN_BY_ID.suuji, { grade: 3, level: 8, choiceCount: 4 }, 'math:add3digit'))
let mathB = mathA
for (let i = 0; i < 40 && mathB.questionInstanceId === mathA.questionInstanceId; i++) mathB = withQuestionIds(questionForUnit(DOMAIN_BY_ID.suuji, { grade: 3, level: 8, choiceCount: 4 }, 'math:add3digit'))
must(mathA.knowledgeId === 'skill:math:add3digit' && mathB.knowledgeId === mathA.knowledgeId, '算数knowledgeIdがskillId単位でない')
must(mathB.questionInstanceId !== mathA.questionInstanceId, '算数の異なる数値をquestionInstanceIdで分けられない')
must(persistentReviewSnapshot('suuji', mathA, mathA.knowledgeId) === null, '算数SRSに同じ式のスナップショットを保存している')

// hard算数のSRSは通常算数と混ぜず、保存したknowledgeIdから同じhard問題を
// とっくんで再生成できる。反対モードの記録は消さず、一覧だけ切り替える。
const hardState = {
  grade: 5,
  settings: { mode: 'hard' },
  srs: {
    suuji: { 'skill:math:decimalDiv': { due: 1 } },
    'hard:suuji': { 'skill:hard:math:jrTsurukame': { due: 1 } },
    yomu: { 'j:通常こくご': { due: 1 } },
    'hard:yomu': { 'hard:yomu:yoji2:通常発展': { due: 1 } },
    rika: { 'r:通常理科': { due: 1 } },
    'hard:rika': { 'hard:r:通常理科hard': { due: 1 } },
    shakai: { 'c:通常社会': { due: 1 } },
    'hard:shakai': { 'hard:c:通常社会hard': { due: 1 } },
    // どうとくには まだhard専用教材が無いので、常に通常台帳のままになる
    // ことを確かめる対照群として使う。
    doutoku: { 'd:通常どうとく': { due: 1 } }
  }
}
must(activeStatsDomainId(hardState, 'suuji') === 'hard:suuji', '小5hard算数の習熟度を専用台帳から読めない')
must(activeStatsDomainId(hardState, 'yomu') === 'hard:yomu', '小5hardこくごの習熟度を専用台帳から読めない')
must(activeStatsDomainId(hardState, 'rika') === 'hard:rika', '小5hardりかの習熟度を専用台帳から読めない')
must(activeStatsDomainId(hardState, 'shakai') === 'hard:shakai', '小5hardしゃかいの習熟度を専用台帳から読めない')
must(activeStatsDomainId(hardState, 'doutoku') === 'doutoku', 'hard教材の無い教科(どうとく)まで難易度台帳が切り替わった')
must(generatorReviewKey('skill:hard:math:jrTsurukame') === 'hard:n:jrTsurukame', 'hard算数knowledgeIdを生成キーへ戻せない')
const hardOriginal = withQuestionIds(withLearningUnit(DOMAIN_BY_ID.suuji.generateQuestion({ grade: 5, mode: 'hard', choiceCount: 4 }, 'hard:n:jrTsurukame'), 5))
const hardAgain = withQuestionIds(withLearningUnit(DOMAIN_BY_ID.suuji.generateQuestion({ grade: 5, mode: 'hard', choiceCount: 4 }, generatorReviewKey(hardOriginal.knowledgeId)), 5))
must(hardOriginal.knowledgeId === 'skill:hard:math:jrTsurukame' && hardAgain.knowledgeId === hardOriginal.knowledgeId, 'hard算数の期限復習が同じ技能へ戻らない')
const hardReviewSrs = activeReviewSrs(hardState)
must(!hardReviewSrs.suuji && hardReviewSrs['hard:suuji'], 'hardモードのとっくん台帳(さんすう)を正しく選べない')
must(!hardReviewSrs.yomu && hardReviewSrs['hard:yomu'], 'hardモードのとっくん台帳(こくご)を正しく選べない')
must(!hardReviewSrs.rika && hardReviewSrs['hard:rika'], 'hardモードのとっくん台帳(りか)を正しく選べない')
must(!hardReviewSrs.shakai && hardReviewSrs['hard:shakai'], 'hardモードのとっくん台帳(しゃかい)を正しく選べない')
must(hardReviewSrs.doutoku && !hardReviewSrs['hard:doutoku'], 'hard教材の無い教科(どうとく)のとっくんがhardモードで消えた')
const normalReviewSrs = activeReviewSrs({ ...hardState, settings: { mode: 'normal' } })
must(normalReviewSrs.suuji && !normalReviewSrs['hard:suuji'], 'normalモードのとっくんにhard算数が混入')
must(normalReviewSrs.yomu && !normalReviewSrs['hard:yomu'], 'normalモードのとっくんにhardこくごが混入')
must(normalReviewSrs.rika && !normalReviewSrs['hard:rika'], 'normalモードのとっくんにhardりかが混入')
must(normalReviewSrs.shakai && !normalReviewSrs['hard:shakai'], 'normalモードのとっくんにhardしゃかいが混入')
must(normalReviewSrs.doutoku, 'normalモードでどうとくのとっくんが消えた')

// 英語キー・図鑑指定練習・アルファベット22項目。
for (const [raw, normalized] of [['en:ew001', 'enw:ew001'], ['enw:ew001', 'enw:ew001'], ['enp:ep001', 'enp:ep001'], ['ena:A-B', 'ena:A-B']]) must(normalizeEnglishKey(raw) === normalized, `${raw}: 英語キーの正規化に失敗`)
const alphabetOrder = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const alphabetPairs = alphabetOrder.slice(0, 22).map((letter, index) => `ena:${letter}-${alphabetOrder[index + 1]}`)
for (const pair of alphabetPairs) {
  const forms = []
  for (let stage = 0; stage < 3; stage++) {
    const id = pair.slice(4)
    const q = generateEnglishQuestion({ grade: 6, englishAudioAvailable: true, reviewKey: pair, englishAlphabetStats: { [id]: { stage } } }, pair)
    must(q.itemKey === pair, `${pair}: アルファベット期限復習を同じ項目に再生成できない`)
    forms.push(q.form)
  }
  must(new Set(forms).size === 3, `${pair}: 大文字・小文字・文字名の3形式を扱えない`)
}
const firstAlphabetGroup = new Set(['ena:A-B', 'ena:B-C', 'ena:C-D', 'ena:D-E'])
for (let i = 0; i < 80; i++) must(firstAlphabetGroup.has(generateEnglishQuestion({ grade: 0, englishAudioAvailable: true, taskForm: 'alphabet', englishAlphabetStats: {}, questionIndex: i }, null).itemKey), 'アルファベットがAからの小グループで始まらない')
const learnedFirstGroup = Object.fromEntries([...firstAlphabetGroup].map((key) => [key.slice(4), { stage: 1, nextDue: 99999 }]))
const secondAlphabetGroup = new Set(['ena:E-F', 'ena:F-G', 'ena:G-H', 'ena:H-I'])
for (let i = 0; i < 80; i++) must(secondAlphabetGroup.has(generateEnglishQuestion({ grade: 0, englishAudioAvailable: true, taskForm: 'alphabet', englishAlphabetStats: learnedFirstGroup, questionIndex: i }, null).itemKey), '次のアルファベット小グループを順に解放できない')

for (const word of ENGLISH_WORDS) {
  for (const form of ['listen-picture', 'picture-word', 'word-meaning', 'japanese-word']) {
    const q = generateEnglishQuestion({ grade: 6, englishAudioAvailable: true, taskForm: form, reviewKey: `enw:${word.id}` }, `enw:${word.id}`)
    must(base(q.itemKey) === `enw:${word.id}`, `${word.id}: 図鑑4問練習で指定語が外れた`)
  }
}
const phrase = ENGLISH_PHRASES[0]
must(base(generateEnglishQuestion({ grade: 6, englishAudioAvailable: true, reviewKey: `en:${phrase.id}` }, `en:${phrase.id}`).itemKey) === `enp:${phrase.id}`, '会話指定復習が別項目へ化けた')
const englishDue = englishDueEntries({ englishWordStats: { ew001: { correct: 1, wrong: 0, stage: 1, nextDue: 10 } }, englishPhraseStats: { eg001: { correct: 1, wrong: 0, stage: 1, nextDue: 10 } }, englishAlphabetStats: {} }, 10)
must(englishDue.length === 2 && englishDue.some((entry) => entry.key === 'enw:ew001') && englishDue.some((entry) => entry.key === 'eng:eg001'), '英単語・文法の進捗から重複なしのとっくんを作れない')

// v13/v14保存を安定IDへ移し、プロフィール・報酬・当日進捗は保持する。
const oldMathKey = 'n:add10#old-order'
const oldMathQuestion = withQuestionIds(questionForUnit(DOMAIN_BY_ID.suuji, { grade: 0, level: 4, choiceCount: 4 }, 'math:add10'))
const oldRikaQuestion = questionForUnit(DOMAIN_BY_ID.rika, { grade: 3, level: 8, choiceCount: 4 }, 'science:3:insects')
const oldRikaKey = `${oldRikaQuestion.itemKey}#old-order`
const writingTarget = WRITING_GROUPS_BY_GRADE[3][0].chars[0]
const legacyProgress = migrateLearningProgress({
  unitProgressVersion: 14, grade: 3, gradeMax: 5, xp: 77, unlockedMonsters: ['m001'], daily: { coreIndex: 1 },
  srs: { english: { duplicate: {} }, suuji: { [oldMathKey]: { box: 0, due: 1 } }, rika: { [oldRikaKey]: { box: 1, due: 2 } } },
  reviewQuestions: { suuji: { [oldMathKey]: oldMathQuestion }, rika: { [oldRikaKey]: oldRikaQuestion } },
  unitStats: { 3: { rika: { [oldRikaQuestion.unitId]: { itemKeys: [oldRikaKey], attempts: 4, firstAttemptCorrect: 3, successDays: [1, 2] } }, kaku: { 'reading:3:kana-words': { attempts: 4, itemKeys: ['broken'] } } } },
  writingStats: { [`3:${writingTarget}`]: { attempts: 2, successDays: [1, 2], guideSeen: true, freeSuccess: true } }
})
must(legacyProgress.unitProgressVersion === UNIT_PROGRESS_VERSION, '単元進捗バージョンを更新できない')
must(legacyProgress.gradeMax === 5 && legacyProgress.xp === 77 && legacyProgress.unlockedMonsters[0] === 'm001' && legacyProgress.daily.coreIndex === 1, '旧保存の学年・報酬・当日ミッションを保持できない')
must(!legacyProgress.srs.english && legacyProgress.srs.suuji['skill:math:add10'] && legacyProgress.srs.rika[oldRikaQuestion.itemKey], '旧SRSキーを安定knowledgeIdへ移行できない')
must(!legacyProgress.reviewQuestions.suuji && legacyProgress.reviewQuestions.rika[oldRikaQuestion.itemKey], '算数スナップショット廃止・固定知識保存を両立できない')
const migratedWritingUnit = `writing:3:${WRITING_GROUPS_BY_GRADE[3][0].id}`
must(legacyProgress.unitStats[3].kaku[migratedWritingUnit]?.itemKeys.includes(`char:3:${writingTarget}`), 'v14書字進捗を文字グループへ復元できない')

// 全必須単元を指定生成できる。書字を読み単元へ誤記録しない。
for (let grade = 0; grade <= 6; grade++) {
  const ledger = unitLedger(grade)
  must(ledger.length === requiredUnitIds(grade).length, `小${grade}: 必須単元と台帳が不一致`)
  must(new Set(ledger.map((unit) => unit.unitId)).size === ledger.length, `小${grade}: 単元台帳が重複`)
  for (const { domainId, unitId } of ledger) {
    const q = withQuestionIds(questionForUnit(DOMAIN_BY_ID[domainId], { grade, level: 12, choiceCount: 4 }, unitId))
    must(q?.unitId === unitId, `小${grade} ${domainId}: ${unitId} を指定生成できない (${q?.unitId})`)
    if (domainId === 'kaku') must(q.knowledgeId === `char:${grade}:${q.target}` && q.unitId.startsWith('writing:'), `${q.target}: 書字を読み単元へ誤記録した`)
  }
}

for (const [name, expectations] of [['理科', RIKA_UNIT_EXPECTATIONS], ['社会', SHAKAI_UNIT_EXPECTATIONS]]) {
  for (const [grade, mapping] of Object.entries(expectations)) {
    const counts = {}
    for (const unitId of Object.values(mapping)) counts[unitId] = (counts[unitId] || 0) + 1
    for (const [unitId, count] of Object.entries(counts)) must(count >= 2, `${name}小${grade} ${unitId}: 異なる事実問題が2問未満`)
  }
}

let mathStats = {}
for (const day of [1, 1, 2, 2]) mathStats = recordUnitResult(mathStats, 0, 'suuji', 'math:add10', true, day, 'skill:math:add10')
must(unitReady(mathStats[0].suuji['math:add10']), '算数のskillId単位の別日習得を判定できない')
let sameDay = {}
for (let i = 0; i < 4; i++) sameDay = recordUnitResult(sameDay, 0, 'suuji', 'math:add10', true, 1, 'skill:math:add10')
must(!unitReady(sameDay[0].suuji['math:add10']), '同日連打で単元を習得した')
const firstSchedule = scheduleAnswer(null, true, 20).entry
const repeatedSameDay = scheduleAnswer(firstSchedule, true, 20)
must(repeatedSameDay.advanced === false && repeatedSameDay.entry.box === firstSchedule.box, '期限前の同日連打でSRS段階が進んだ')

// 学年を戻すと、先の学年の合格資格だけを消し、学習履歴・報酬は残す。
const lowered = lowerGradeProgress({
  grade: 3, gradeMax: 3, xp: 4200, unlockedMonsters: ['m001'], weapons: ['w01'],
  englishWordStats: { ew001: { stage: 2 } }, srs: { yomu: { a: { due: 5 } } },
  testPassed: { 0: { passed: true }, 1: { passed: true }, 2: { passed: true } },
  starTrials: { 0: { rounds: [{}] }, 2: { rounds: [{}] } }, pendingGradeUp: 3,
  daily: { date: '2026-08-11', coreIndex: 3, coreTasks: [{ domainId: 'rika' }], ticketsEarnedToday: 2 }
}, 0)
must(lowered.grade === 0 && lowered.gradeMax === 0 && Object.keys(lowered.testPassed).length === 0 && Object.keys(lowered.starTrials).length === 0 && lowered.pendingGradeUp === null, '学年を戻しても先の進級資格が残る')
must(lowered.xp === 4200 && lowered.unlockedMonsters[0] === 'm001' && lowered.weapons[0] === 'w01' && lowered.englishWordStats.ew001.stage === 2 && lowered.srs.yomu.a.due === 5, '学年を戻す操作で既存の報酬・学習履歴を消した')
must(lowered.daily.coreIndex === 0 && lowered.daily.coreTasks.every((task) => ['yomu', 'suuji', 'kaku', 'seikatsu', 'english', 'doutoku'].includes(task.domainId)), '学年を戻した当日のミッションを年長向けに再構成できない')

// チケットは0時をまたいで残り、期限が過ぎたものだけ消費対象から外れる。
const ticketToday = '2026-08-11'
const earnedTicket = grantBattleTicket({ tickets: 0, ticketGrants: [] }, ticketToday)
must(earnedTicket.tickets === 1 && earnedTicket.ticketGrants[0].expiresOn === '2026-08-18' && BATTLE_TICKET_TTL_DAYS === 7, 'チケットの7日期限を設定できない')
must(normalizeBattleTickets({ tickets: 2 }, ticketToday).tickets === 2, '旧セーブの数値チケットを期限付きへ移行できない')
must(normalizeBattleTickets(earnedTicket, '2026-08-12').tickets === 1, '日付をまたぐとチケットが消える')
must(normalizeBattleTickets(earnedTicket, '2026-08-19').tickets === 0, '期限切れチケットが残る')
must(spendBattleTicket({ tickets: 2, ticketGrants: [{ expiresOn: '2026-08-12' }, { expiresOn: '2026-08-18' }] }, '2026-08-11').ticketGrants[0].expiresOn === '2026-08-18', '期限が近いチケットから使わない')

const practiceState = { unitStats: { 3: { rika: { a: { attempts: 2, nextDue: 10, lastPresentedDate: 9, firstAttemptCorrect: 2 }, b: { attempts: 2, nextDue: 30, lastPresentedDate: 1, firstAttemptCorrect: 0 } } } } }
must(selectPracticeUnit(practiceState, 3, 'rika', ['a', 'b'], 20) === 'a', '期限到来単元を混合練習で優先できない')

// しれん: 6問、主要教科を全て含み、前日単元を可能な限り避ける。
const trialBase = { skills: { 3: {} }, starTrials: {} }
const firstTrial = makeTrialQuestions(trialBase, 3)
must(firstTrial.length === 6 && new Set(firstTrial.map((q) => q.unitId)).size === 6, 'しれんを6問の異なる単元で層化できない')
const requiredDomains3 = new Set(unitLedger(3).map((unit) => unit.domainId))
must([...requiredDomains3].every((domainId) => firstTrial.some((q) => q._domainId === domainId)), 'しれんに主要教科がそろわない')
must(firstTrial.find((q) => q._domainId === 'kaku')?.stage === 'free', 'しれんの書字が自由書きでない')
const previousByDomain = Object.groupBy(firstTrial, (q) => q._domainId)
const secondTrial = makeTrialQuestions({ ...trialBase, starTrials: { 3: { rounds: [{ unitIds: firstTrial.map((q) => q.unitId) }] } } }, 3)
const secondByDomain = Object.groupBy(secondTrial, (q) => q._domainId)
for (const [domainId, questions] of Object.entries(secondByDomain)) {
  const available = unitLedger(3).filter((unit) => unit.domainId === domainId).length
  const previous = new Set((previousByDomain[domainId] || []).map((q) => q.unitId))
  const overlaps = questions.filter((q) => previous.has(q.unitId)).length
  const unavoidable = Math.max(0, questions.length - (available - previous.size))
  must(overlaps <= unavoidable, `${domainId}: 前日の単元を必要以上に再出題した`)
}

const readyByDomain = {}
for (const { domainId, unitId } of unitLedger(0)) {
  readyByDomain[domainId] ||= {}
  readyByDomain[domainId][unitId] = { attempts: 4, firstAttemptCorrect: 3, successDays: [1, 2], itemKeys: ['a', 'b'], itemRequirement: domainId === 'suuji' ? 1 : 2 }
}
const major0 = [...new Set(unitLedger(0).map((unit) => unit.domainId))]
const promotionState = { unitStats: { 0: readyByDomain }, starTrials: { 0: { rounds: [{ correct: 5, total: 6, correctDomains: major0 }] } } }
must(promotionResult(promotionState, 0, { correct: 4, total: 6, correctDomains: major0 }).passed, '共通進級判定が合格にならない')
must(!promotionResult({ ...promotionState, starTrials: { 0: { rounds: [{ correct: 5, total: 6, correctDomains: ['yomu'] }] } } }, 0, { correct: 4, total: 6, correctDomains: ['yomu'] }).passed, '主要教科ゼロ正解でも進級できた')

for (let grade = 0; grade <= 6; grade++) for (const { unitId } of unitLedger(grade)) {
  const lesson = lessonForUnit(unitId)
  must(lesson.title && lesson.points?.length === 3 && !lesson.points[0].includes('ルールを例といっしょ'), `${unitId}: 単元別の実教材がない`)
}

const expectedLowTasks = { yomu: 7, suuji: 7, kaku: 6, seikatsu: 6, english: 7, doutoku: 2 }
const expectedHighTasks = { yomu: 7, suuji: 7, kaku: 5, rika: 4, shakai: 7, english: 3, doutoku: 2 }
const expectedLowQuestions = { yomu: 35, suuji: 35, kaku: 24, seikatsu: 24, english: 28, doutoku: 4 }
const expectedHighQuestions = { yomu: 35, suuji: 35, kaku: 20, rika: 16, shakai: 28, english: 12, doutoku: 4 }
for (let grade = 0; grade <= 6; grade++) {
  const tasks = {}; const questions = {}
  for (let day = 50000; day < 50007; day++) for (const task of buildCoreMission(grade, day)) {
    tasks[task.domainId] = (tasks[task.domainId] || 0) + 1
    questions[task.domainId] = (questions[task.domainId] || 0) + task.questionCount
  }
  must(sameCounts(tasks, grade <= 2 ? expectedLowTasks : expectedHighTasks), `小${grade}: 週間タスク固定期待値が不一致 ${JSON.stringify(tasks)}`)
  must(sameCounts(questions, grade <= 2 ? expectedLowQuestions : expectedHighQuestions), `小${grade}: 週間問題数が不一致 ${JSON.stringify(questions)}`)
}

const moral = new Map()
for (let grade of [0, 6]) for (let i = 0; i < 3000 && moral.size < 22; i++) { const q = generateDoutokuQuestion({ grade, choiceCount: 3 }); moral.set(q.itemKey, q) }
must(moral.size === 22, '道徳22問を検査できない')
for (const q of moral.values()) {
  const answerLength = q.choices.find((choice) => choice.id === q.answerId).label.length
  const maxLength = Math.max(...q.choices.map((choice) => choice.label.length))
  const maxCount = q.choices.filter((choice) => choice.label.length === maxLength).length
  must(!(answerLength === maxLength && maxCount === 1), `道徳の正解だけが最長: ${q.instruction}`)
}

must(reinforcementTargetIndex(4) === 6 && reinforcementExtraCount(5, 0, 4) === 2, '最終問題の誤答を2問後まで延長できない')

const diamond = { stage: 3, correct: 4, nextDue: 400 }
const currentDiamond = migrateEnglishWordStats({ ew173: diamond }, 13)
must(currentDiamond.ew173?.stage === 3 && !currentDiamond.ew137, '現行diamond進捗が再読み込みで消えた')
const oldStar = migrateEnglishWordStats({ ew173: diamond }, 12)
must(!oldStar.ew173 && oldStar.ew137?.stage === 3, '旧star進捗が一度だけ正規IDへ移行されない')

console.log('学習整合性検証OK: 三層ID・全単元生成・書字・英語・SRS・しれん・週間配分・保存移行を確認')
