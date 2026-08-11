// コンテンツ追加時に、全学年・全教科が実際に問題を作れるかを確認する。
// Luna のような軽量エージェントがデータだけを増やしても、壊れた設問を
// 公開へ持ち込まないための最小ゲート。外部サービスや乱数シードは不要。
import { domainsForGrade } from '../src/engine/activities.js'
import { generateNumbersQuestion, NUMBERS_KINDS } from '../src/data/content/numbers.js'
import { generateSeikatsuQuestion, SEIKATSU_KINDS } from '../src/data/content/seikatsu.js'
import { generateRikaQuestion, RIKA_QUESTIONS, RIKA_UNIT_EXPECTATIONS } from '../src/data/content/rika.js'
import { generateShakaiQuestion, SHAKAI_QUESTIONS, SHAKAI_UNIT_EXPECTATIONS } from '../src/data/content/shakai.js'

const errors = []
const SAMPLE_COUNT = 24

function requireValue(condition, message) {
  if (!condition) errors.push(message)
}

function verifyQuestion(question, grade, domain, choiceCount) {
  const label = `小${grade} ${domain.id} ${question?.itemKey ?? '(itemKeyなし)'}`
  requireValue(question?.domain === domain.id, `${label}: domain が不正`)
  requireValue(typeof question?.type === 'string' && question.type, `${label}: type がない`)
  requireValue(typeof question?.itemKey === 'string' && question.itemKey, `${label}: itemKey がない`)
  requireValue(typeof question?.instruction === 'string' && question.instruction, `${label}: 問題文がない`)
  if (question?.type === 'choice') requireValue(question?.visual?.kind && !String(question.visual.text ?? '').includes('undefined') && !String(question.visual.text ?? '').includes('NaN'), `${label}: visual が空または壊れている`)
  if (question?.type === 'choice') {
    requireValue(typeof question?.explain === 'string' && question.explain, `${label}: 解説がない`)
    const choices = question.choices ?? []
    const ids = choices.map((choice) => choice.id)
    // 比較・偶奇など、意味のある二択問題は2択を許容する。
    const minimumChoices = 2
    requireValue(choices.length >= minimumChoices, `${label}: 選択肢が足りない`)
    requireValue(new Set(ids).size === ids.length, `${label}: 選択肢が重複`)
    requireValue(ids.every((id) => String(id).trim()), `${label}: 空の選択肢がある`)
    requireValue(ids.includes(question.answerId), `${label}: 正解が選択肢にない`)
  }
  requireValue(!JSON.stringify(question).includes('undefined') && !JSON.stringify(question).includes('NaN'), `${label}: undefined/NaN を含む`)
}

for (let grade = 0; grade <= 6; grade++) {
  for (const domain of domainsForGrade(grade)) {
    if (domain.id === 'english') continue // 英語は test:english が専用に網羅する
    for (const choiceCount of [3, 4]) {
      for (const level of [1, 3, 8, 12]) for (let n = 0; n < SAMPLE_COUNT; n++) {
        let question
        try {
          question = domain.generateQuestion({ grade, choiceCount, level })
        } catch (error) {
          errors.push(`小${grade} ${domain.id}: 問題生成で例外: ${error.message}`)
          continue
        }

        verifyQuestion(question, grade, domain, choiceCount)
      }
    }
  }
}

// 乱数任せにせず、全ビルダー・全固定知識を直接再生成する。
const numericDomain = { id: 'suuji' }
for (const kind of NUMBERS_KINDS) for (const level of [1, 3, 8, 12]) {
  verifyQuestion(generateNumbersQuestion({ grade: 6, level, choiceCount: 4 }, `n:${kind}`), 6, numericDomain, 4)
}
const lifeDomain = { id: 'seikatsu' }
for (const kind of SEIKATSU_KINDS) for (const level of [1, 3, 8, 12]) {
  verifyQuestion(generateSeikatsuQuestion({ grade: 2, level, choiceCount: 4 }, `s:${kind}`), 2, lifeDomain, 4)
}
const scienceDomain = { id: 'rika' }
for (const q of RIKA_QUESTIONS) verifyQuestion(generateRikaQuestion({ grade: 6, level: 12, choiceCount: 4 }, `r:${q}`), 6, scienceDomain, 4)
const socialDomain = { id: 'shakai' }
for (const q of SHAKAI_QUESTIONS) verifyQuestion(generateShakaiQuestion({ grade: 6, level: 12, choiceCount: 4 }, `c:${q}`), 6, socialDomain, 4)
for (const [grade, expected] of Object.entries(RIKA_UNIT_EXPECTATIONS)) for (const [question, unitId] of Object.entries(expected)) requireValue(generateRikaQuestion({ grade: Number(grade), choiceCount: 4 }, `r:${question}`).unitId === unitId, `理科単元IDが不正: ${question}`)
for (const [grade, expected] of Object.entries(SHAKAI_UNIT_EXPECTATIONS)) for (const [question, unitId] of Object.entries(expected)) requireValue(generateShakaiQuestion({ grade: Number(grade), choiceCount: 4 }, `c:${question}`).unitId === unitId, `社会単元IDが不正: ${question}`)

// 月末・うるう日の実在日付を決定論的に確認する。
const RealDate = Date
for (const [year, month, day] of [[2024, 1, 29], [2025, 1, 28], [2025, 0, 31], [2025, 11, 31]]) {
  globalThis.Date = class extends RealDate {
    constructor(...args) { super(...(args.length ? args : [year, month, day, 12])) }
    static now() { return new RealDate(year, month, day, 12).getTime() }
  }
  for (let n = 0; n < 20; n++) {
    const q = generateSeikatsuQuestion({ grade: 2, level: 12, choiceCount: 4 }, 's:todayDate')
    for (const choice of q.choices) {
      const match = String(choice.id).match(/^(\d+)がつ (\d+)にち$/)
      requireValue(!!match, `日付選択肢の形式が不正: ${choice.id}`)
      const test = new RealDate(year, Number(match[1]) - 1, Number(match[2]))
      requireValue(test.getMonth() === Number(match[1]) - 1 && test.getDate() === Number(match[2]), `存在しない日付の選択肢: ${choice.id}`)
    }
  }
}
globalThis.Date = RealDate

if (errors.length) {
  console.error(`コンテンツ検証失敗 (${errors.length}件)`)
  for (const error of errors.slice(0, 30)) console.error(`- ${error}`)
  process.exit(1)
}

console.log('コンテンツ検証OK: 非英語の全学年・全難易度・全ビルダー・日付境界を確認')
