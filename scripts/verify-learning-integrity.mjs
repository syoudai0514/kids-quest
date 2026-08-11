import { generateEnglishQuestion, ENGLISH_WORDS, ENGLISH_PHRASES } from '../src/data/content/english.js'
import { generateNumbersQuestion } from '../src/data/content/numbers.js'
import { generateSeikatsuQuestion } from '../src/data/content/seikatsu.js'
import { generateRikaQuestion } from '../src/data/content/rika.js'
import { generateShakaiQuestion } from '../src/data/content/shakai.js'
import { unitLedger, requiredUnitIds, unitReady, recordUnitResult, promotionResult, withLearningUnit, lessonForUnit } from '../src/engine/learningUnits.js'
import { migrateEnglishWordStats } from '../src/engine/englishMigration.js'
import { normalizeEnglishKey } from '../src/data/content/english.js'
import { questionIds, withQuestionIds } from '../src/engine/reviewKey.js'
import { buildCoreMission } from '../src/engine/missions.js'
import { migrateLearningProgress } from '../src/engine/progressMigration.js'

const must = (value, message) => { if (!value) throw new Error(message) }
const base = (key) => String(key || '').split('#')[0]

for (const [raw, normalized] of [['en:ew001', 'enw:ew001'], ['enw:ew001', 'enw:ew001'], ['enp:ep001', 'enp:ep001'], ['ena:A-B', 'ena:A-B']]) {
  must(normalizeEnglishKey(raw) === normalized, `${raw}: 英語キーの正規化に失敗`)
}
const alphabetOrder = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
for (const pair of alphabetOrder.slice(0, 22).map((letter, i) => `ena:${letter}-${alphabetOrder[i + 1]}`)) {
  const q = generateEnglishQuestion({ grade: 6, englishAudioAvailable: true, reviewKey: pair }, pair)
  must(q.itemKey === pair, `${pair}: アルファベット期限復習を同じ項目に再生成できない`)
}

const reorderedA = withQuestionIds({ domain: 'rika', itemKey: 'r:水', instruction: '水は？', answerId: '液体', choices: [{ id: 'a', label: '液体' }, { id: 'b', label: '気体' }] })
const reorderedB = withQuestionIds({ domain: 'rika', itemKey: 'r:水', instruction: '水は？', answerId: '液体', choices: [{ id: 'b', label: '気体' }, { id: 'a', label: '液体' }] })
must(questionIds(reorderedA).knowledgeId === questionIds(reorderedB).knowledgeId && questionIds(reorderedA).questionInstanceId === questionIds(reorderedB).questionInstanceId, '選択肢順だけで復習IDが変わった')
const legacyProgress = migrateLearningProgress({ grade: 3, gradeMax: 5, xp: 77, unlockedMonsters: ['m001'], daily: { coreIndex: 1 }, srs: { english: { old: {} }, suuji: { keep: {} } }, unitStats: { 3: { rika: { old: { itemKeys: ['old#order'], attempts: 4 } } } } })
must(legacyProgress.gradeMax === 5 && legacyProgress.xp === 77 && legacyProgress.unlockedMonsters[0] === 'm001' && legacyProgress.daily.coreIndex === 1, '旧保存の学年・報酬・当日ミッションを保持できない')
must(!legacyProgress.srs.english && legacyProgress.srs.suuji.keep && legacyProgress.unitStats[3].rika.old.itemKeys.length === 0, '旧復習IDを安全に移行できない')
for (const skill of ['add10', 'sub10', 'kuku', 'div']) {
  const q = generateNumbersQuestion({ grade: 3, level: 8, choiceCount: 4, unitId: `math:${skill}` }, `n:${skill}`)
  must(q.itemKey === `n:${skill}`, `${skill}: 算数の期限復習が別単元に化けた`)
}

// 図鑑・期限・補強が同一の英語項目を出し、保存キーもその項目へ帰ること。
for (const word of [ENGLISH_WORDS.find((w) => w.english === 'dog'), ENGLISH_WORDS.find((w) => w.english === 'Monday')]) {
  for (const form of ['picture-word', 'word-meaning', 'listen-picture']) {
    const q = generateEnglishQuestion({ grade: 6, englishAudioAvailable: true, taskForm: form, reviewKey: `en:${word.id}` }, `en:${word.id}`)
    must(base(q.itemKey) === `enw:${word.id}`, `${word.english}: 指定復習が別項目へ化けた`)
  }
}
for (const word of ENGLISH_WORDS) {
  for (const form of ['listen-picture', 'picture-word', 'word-meaning', 'japanese-word']) {
    const q = generateEnglishQuestion({ grade: 6, englishAudioAvailable: true, taskForm: form, reviewKey: `enw:${word.id}` }, `enw:${word.id}`)
    must(base(q.itemKey) === `enw:${word.id}`, `${word.id}: 図鑑4問練習で指定語が外れた`)
  }
}
const phrase = ENGLISH_PHRASES[0]
must(base(generateEnglishQuestion({ grade: 6, englishAudioAvailable: true, reviewKey: `en:${phrase.id}` }, `en:${phrase.id}`).itemKey) === `enp:${phrase.id}`, '会話指定復習が別項目へ化けた')

// 単元台帳の全単元を、実際の生成器がその単元として作れること。
for (let grade = 0; grade <= 6; grade++) {
  const ledger = unitLedger(grade)
  must(ledger.length === requiredUnitIds(grade).length, `小${grade}: 必須単元と台帳が不一致`)
  must(new Set(ledger.map((u) => u.unitId)).size === ledger.length, `小${grade}: 単元台帳が重複`)
  for (const { domainId, unitId } of ledger) {
    let q
    const params = { grade, level: 12, choiceCount: 4, unitId }
    if (domainId === 'suuji') q = generateNumbersQuestion(params, `n:${unitId.slice(5)}`)
    else if (domainId === 'seikatsu') {
      // life は複数kindをまとめるため、通常生成から unitId が一致するまで確認。
      for (let i = 0; i < 200 && !q; i++) { const candidate = withLearningUnit(generateSeikatsuQuestion(params), grade); if (candidate.unitId === unitId) q = candidate }
    } else if (domainId === 'rika') q = generateRikaQuestion(params)
    else if (domainId === 'shakai') q = generateShakaiQuestion(params)
    else if (domainId === 'yomu' || domainId === 'kaku') continue // 文字プールは UI/既存content検査が担当
    q = withLearningUnit(q, grade)
    must(q?.unitId === unitId, `小${grade} ${domainId}: ${unitId} を生成できない`)
  }
}
for (let grade = 3; grade <= 6; grade++) {
  const known = new Set(requiredUnitIds(grade))
  for (let i = 0; i < 300; i++) {
    for (const generate of [generateRikaQuestion, generateShakaiQuestion]) {
      const q = generate({ grade, level: 12, choiceCount: 4 })
      must(known.has(q.unitId), `小${grade}: 通常生成単元 ${q.unitId} が進級台帳にない`)
    }
  }
}

let stats = {}
for (const [day, key] of [[1, 'n:add10#a'], [1, 'n:add10#b'], [2, 'n:add10#a'], [3, 'n:add10#b']]) stats = recordUnitResult(stats, 0, 'suuji', 'math:add10', true, day, key)
must(unitReady(stats[0].suuji['math:add10']), '別日・別項目の単元習得を判定できない')
let same = {}
for (let i = 0; i < 4; i++) same = recordUnitResult(same, 0, 'suuji', 'math:add10', true, 1, 'n:add10#a')
must(!unitReady(same[0].suuji['math:add10']), '同日・同一問題の連打で単元を習得した')
let mathStable = {}
for (const day of [1, 1, 2, 2]) mathStable = recordUnitResult(mathStable, 0, 'suuji', 'math:add10', true, day, 'skill:math:add10')
must(unitReady(mathStable[0].suuji['math:add10']), '算数のskillId単位の別日習得を判定できない')

const ready = Object.fromEntries(unitLedger(0).map(({ domainId, unitId }) => [domainId, { ...(Object.fromEntries(unitLedger(0).filter((u) => u.domainId === domainId).map((u) => [u.unitId, { attempts: 4, firstAttemptCorrect: 3, successDays: [1, 2], itemKeys: ['a', 'b'] }])) ) }]))
const major0 = [...new Set(unitLedger(0).map((u) => u.domainId))]
const state = { unitStats: { 0: ready }, starTrials: { 0: { rounds: [{ correct: 5, total: 6, correctDomains: major0 }] } } }
must(promotionResult(state, 0, { correct: 4, total: 6 }).passed, '表示と保存で共用する進級判定が合格にならない')
const incomplete = { ...state, unitStats: { 0: { ...ready, suuji: { ...ready.suuji, 'math:add10': { attempts: 1 } } } } }
must(!promotionResult(incomplete, 0, { correct: 4, total: 6 }).passed, '単元不足でも進級できた')
must(!promotionResult({ ...state, starTrials: { 0: { rounds: [{ correct: 5, total: 6, correctDomains: ['yomu'] }] } } }, 0, { correct: 4, total: 6, correctDomains: ['yomu'] }).passed, '主要教科ゼロ正解でも進級できた')
must(lessonForUnit('math:fracCompareSame').title.includes('ぶんすう'), '授業が対象単元を表していない')

for (const word of ENGLISH_WORDS) {
  if (!word.pictureEligible) {
    const q = generateEnglishQuestion({ grade: 6, englishAudioAvailable: true, taskForm: 'picture-word', reviewKey: `en:${word.id}` }, `en:${word.id}`)
    must(q.form !== 'picture-word', `${word.english}: 非安全な絵問題へフォールバックしなかった`)
  }
}
for (const p of ENGLISH_PHRASES) {
  const q = generateEnglishQuestion({ grade: 6, englishAudioAvailable: true, taskForm: 'conversation', reviewKey: `en:${p.id}` }, `en:${p.id}`)
  must(q.choices.length === 4 && new Set(q.choices.map((c) => c.label)).size === 4, `${p.english}: 会話選択肢が一意でない`)
}

for (let grade = 0; grade <= 6; grade++) {
  const counts = {}
  for (let day = 50000; day < 50007; day++) for (const task of buildCoreMission(grade, day)) counts[task.domainId] = (counts[task.domainId] || 0) + 1
  must(counts.yomu === 7 && counts.suuji === 7, `小${grade}: 国語・算数が週最多にならない`)
  must(counts.doutoku === 2, `小${grade}: 道徳が週2タスクにならない (${counts.doutoku})`)
}

const diamond = { stage: 3, correct: 4, nextDue: 400 }
const currentDiamond = migrateEnglishWordStats({ ew173: diamond }, 13)
must(currentDiamond.ew173?.stage === 3 && !currentDiamond.ew137, '現行diamond進捗が再読み込みで消えた')
const oldStar = migrateEnglishWordStats({ ew173: diamond }, 12)
must(!oldStar.ew173 && oldStar.ew137?.stage === 3, '旧star進捗が一度だけ正規IDへ移行されない')
const reloadedDiamond = migrateEnglishWordStats(JSON.parse(JSON.stringify(currentDiamond)), 13)
must(reloadedDiamond.ew173?.stage === 3, 'diamond移行が2回目の再読み込みで変化した')

console.log('学習整合性検証OK: 指定復習・単元台帳・別日習得・進級判定・英語安全性を確認')
