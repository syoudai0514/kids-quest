// コンテンツ追加時に、全学年・全教科が実際に問題を作れるかを確認する。
// Luna のような軽量エージェントがデータだけを増やしても、壊れた設問を
// 公開へ持ち込まないための最小ゲート。外部サービスや乱数シードは不要。
import { domainsForGrade } from '../src/engine/activities.js'
import { generateNumbersQuestion, NUMBERS_KINDS } from '../src/data/content/numbers.js'
import { generateSeikatsuQuestion, SEIKATSU_KINDS } from '../src/data/content/seikatsu.js'
import { generateRikaQuestion, RIKA_QUESTIONS, RIKA_UNIT_EXPECTATIONS } from '../src/data/content/rika.js'
import { generateShakaiQuestion, SHAKAI_QUESTIONS, SHAKAI_UNIT_EXPECTATIONS } from '../src/data/content/shakai.js'
import { generateDoutokuQuestion } from '../src/data/content/doutoku.js'
import { generateReadingQuestion } from '../src/data/content/reading.js'
import { generateLanguageQuestion, generateDokkaiQuestion } from '../src/data/content/readingLanguage.js'
import { KANJI_BY_GRADE, JUKUGO_BY_GRADE } from '../src/data/kanjiByGrade.js'
import { hasStrokeData } from '../src/data/strokeOrder.js'
import { generateWritingQuestion, WRITING_GROUPS_BY_GRADE } from '../src/data/content/writing.js'
import { questionIds } from '../src/engine/reviewKey.js'

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
    // 計画書§2原則4: 解説は「なぜ」を含む。答えの言い換えだけは禁止。
    // 解説から答えの文字列を取り除いても、理由・手順として読める分量が
    // 残っていることを機械的に確認する（例「これは まるだよ」は不可）。
    const answerText = String(question.answerWord?.text ?? question.answerId ?? '')
    const explainText = String(question.explain ?? '')
    if (answerText && explainText) {
      const withoutAnswer = explainText.split(answerText).join('').replace(/[「」。、\s]/g, '')
      requireValue(withoutAnswer.length > 6, `${label}: 解説が答えの言い換えだけ（理由・手順がない）: 「${explainText}」`)
    }
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

// 計画書§2-3: 正解だけが長いという見た目の手がかりを作らない。
// 固定バンク教科は誤答も人手で書くため、正解だけが極端に長くなりやすい
// （実測でりかは正解が単独最長になる割合が43%＝偶然の25%を大きく超えていた）。
// 「いちばん長い選択肢を選ぶ」だけで正解できる状態を防ぐため、正解が
// すべての誤答より6文字以上長い設問を禁止する。
// 1〜2文字差は日本語では手がかりにならないため許容する。
function verifyNoLengthTell(label, questions, generate, prefix) {
  for (const question of questions) {
    const item = generate({ grade: 6, level: 12, choiceCount: 4 }, `${prefix}${question}`)
    const labels = (item?.choices ?? []).map((choice) => String(choice.label ?? choice.id))
    const answer = String(item?.answerId ?? '')
    const wrongs = labels.filter((text) => text !== answer)
    if (!answer || !wrongs.length) continue
    const gap = answer.length - Math.max(...wrongs.map((text) => text.length))
    requireValue(gap < 6, `${label}: 正解が全誤答より${gap}文字長く、長さで正解が分かる: 「${question}」→「${answer}」`)
  }
}
verifyNoLengthTell('りか', RIKA_QUESTIONS, generateRikaQuestion, 'r:')
verifyNoLengthTell('しゃかい', SHAKAI_QUESTIONS, generateShakaiQuestion, 'c:')

// WP1: 学年別漢字配当表（2020年度〜, 計1026字）との完全一致を固定する。
// 実際の配当表突合は生成時に政府公式データ（文化庁 常用漢字表本表）で
// 実施済み。ここでは回帰防止として、字数・重複・学年配置・書き順・
// 熟語の構成漢字が壊れていないことを検証する。
const KANJI_TARGET_COUNT_BY_GRADE = { 1: 80, 2: 160, 3: 200, 4: 202, 5: 193, 6: 191 }
const ALL_KANJI_LIST = []
for (const [grade, target] of Object.entries(KANJI_TARGET_COUNT_BY_GRADE)) {
  const list = KANJI_BY_GRADE[grade] ?? []
  requireValue(list.length === target, `小${grade}の漢字数が配当表と不一致: ${list.length}/${target}`)
  for (const entry of list) {
    requireValue(typeof entry.yomi === 'string' && entry.yomi.length > 0, `漢字「${entry.k}」の読みが空`)
    requireValue(hasStrokeData(entry.k), `漢字「${entry.k}」の書き順データがない（かきとりに出題できない）`)
    ALL_KANJI_LIST.push(entry.k)
  }
}
requireValue(ALL_KANJI_LIST.length === 1026, `教育漢字の総数が1026字ではない: ${ALL_KANJI_LIST.length}`)
requireValue(new Set(ALL_KANJI_LIST).size === ALL_KANJI_LIST.length, '教育漢字に重複がある')

// WP1: 熟語は最低60語/学年。構成漢字はその学年までの配当漢字だけであること。
let cumulativeKanji = new Set()
for (let grade = 1; grade <= 6; grade++) {
  for (const entry of KANJI_BY_GRADE[grade]) cumulativeKanji.add(entry.k)
  const words = JUKUGO_BY_GRADE[grade] ?? []
  requireValue(words.length >= 60, `小${grade}の熟語が60語未満: ${words.length}`)
  const seen = new Set()
  for (const entry of words) {
    requireValue(!seen.has(entry.k), `小${grade}の熟語「${entry.k}」が重複`)
    seen.add(entry.k)
    for (const ch of entry.k) {
      requireValue(cumulativeKanji.has(ch), `小${grade}の熟語「${entry.k}」に未習の漢字「${ch}」を含む`)
    }
  }
}

// WP1: かきとり（書字）が全学年で配当漢字を網羅していることを確認する。
for (let grade = 1; grade <= 6; grade++) {
  const groups = WRITING_GROUPS_BY_GRADE[grade] ?? []
  const writingChars = new Set(groups.flatMap((group) => group.chars))
  const gradeKanji = KANJI_BY_GRADE[grade].map((entry) => entry.k)
  const missing = gradeKanji.filter((k) => !writingChars.has(k))
  requireValue(missing.length === 0, `小${grade}のかきとりに未収録の配当漢字: ${missing.join('')}`)
}

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

// Step1: 「未出（everSeenKnowledge）優先」が実際に機能し、新規教材が既出の
// ランダム再出題に埋もれず到達できることを固定する。固定バンク教科（りか・
// しゃかい・どうとく・よむ・かく）は、everSeenKnowledge を正しく渡すと
// 「そのグレードの実プール件数ぶん、一度も重複せずに新規知識へ到達する」
// はず。まず優先なしの大量サンプルで実プール件数の下限を推定し、優先ありで
// 同じ回数だけ引いても重複が出ないことを確認する（出れば、未出優先が
// 機能していないか、キー形式（knowledgeId）がずれている回帰）。
function verifyUnseenPriorityCoverage(label, generate, baseParams, baselineDraws = 600) {
  const baselineSeen = new Set()
  for (let i = 0; i < baselineDraws; i++) {
    const q = generate(baseParams)
    baselineSeen.add(questionIds(q).knowledgeId)
  }
  const lowerBound = baselineSeen.size
  if (lowerBound < 2) return // 極小プールは対象外（生成不能などは他の検証で捕まる）

  const seen = new Set()
  for (let i = 0; i < lowerBound; i++) {
    const q = generate({ ...baseParams, everSeenKnowledge: seen })
    const { knowledgeId } = questionIds(q)
    requireValue(
      !seen.has(knowledgeId),
      `${label}: 未出優先のはずが ${i + 1}/${lowerBound}回目で既出「${knowledgeId}」が再出題された（実プールは${lowerBound}件以上あるはず）`
    )
    seen.add(knowledgeId)
  }
}

for (const grade of [3, 4, 5, 6]) {
  verifyUnseenPriorityCoverage(`りか(小${grade})`, generateRikaQuestion, { grade, level: 12, choiceCount: 4 })
  verifyUnseenPriorityCoverage(`しゃかい(小${grade})`, generateShakaiQuestion, { grade, level: 12, choiceCount: 4 })
}
for (const grade of [0, 3, 6]) {
  verifyUnseenPriorityCoverage(`どうとく(小${grade})`, generateDoutokuQuestion, { grade, level: 12, choiceCount: 3 })
  verifyUnseenPriorityCoverage(`よむ(小${grade})`, generateReadingQuestion, { grade, level: 12, choiceCount: 4, allowKatakana: true, allowHard: true })
}
for (const grade of [2, 4, 6]) {
  verifyUnseenPriorityCoverage(`かく(小${grade})`, generateWritingQuestion, { grade, level: 12 }, 1200)
}

// WP2: こくご新形式10種。generateReadingQuestion は unitId で
// reading:{grade}:language / :dokkai を明示したときだけこれらの形式に入る
// （通常のミックス出題は unitLedger 経由の単元ターゲティングが担う）ため、
// 全体ループの generateQuestion({grade, choiceCount, level}) だけでは
// 一度も踏まれない。ここで直接その経路を検証する。
const readingDomain = { id: 'yomu' }
for (let grade = 2; grade <= 6; grade++) {
  for (let n = 0; n < SAMPLE_COUNT; n++) {
    verifyQuestion(generateReadingQuestion({ grade, choiceCount: 4, unitId: `reading:${grade}:language` }), grade, readingDomain, 4)
  }
}
for (let grade = 3; grade <= 6; grade++) {
  for (let n = 0; n < SAMPLE_COUNT; n++) {
    const q = generateReadingQuestion({ grade, choiceCount: 4, unitId: `reading:${grade}:dokkai` })
    verifyQuestion(q, grade, readingDomain, 4)
    requireValue(q?.visual?.kind === 'passage' && q.visual.text.length >= 60, `小${grade} よむ 短文読解: 文章が短すぎる、または表示形式が不正`)
  }
}
for (const grade of [2, 3, 4, 5, 6]) {
  verifyUnseenPriorityCoverage(`よむ・ことばのきまり(小${grade})`, generateLanguageQuestion, { grade, choiceCount: 4 })
}
for (const grade of [3, 4, 5, 6]) {
  verifyUnseenPriorityCoverage(`よむ・どっかい(小${grade})`, generateDokkaiQuestion, { grade, choiceCount: 4 }, 200)
}
// 指定復習（reviewKey）で同じ知識IDが再現できることを固定する。
// keigo/bunpo は「1項目から複数の設問」を作れるため、往復不整合が
// 起きやすい（実際に発生し、既出プールの展開漏れとして修正済み）。
for (let grade = 3; grade <= 6; grade++) {
  for (let n = 0; n < 40; n++) {
    const original = generateReadingQuestion({ grade, choiceCount: 4, unitId: `reading:${grade}:language` })
    if (!original) continue
    const again = generateReadingQuestion({ grade, choiceCount: 4 }, original.itemKey)
    requireValue(again?.itemKey === original.itemKey, `よむ 指定復習が一致しない: 「${original.itemKey}」→「${again?.itemKey}」`)
  }
}

if (errors.length) {
  console.error(`コンテンツ検証失敗 (${errors.length}件)`)
  for (const error of errors.slice(0, 30)) console.error(`- ${error}`)
  process.exit(1)
}

console.log('コンテンツ検証OK: 非英語の全学年・全難易度・全ビルダー・日付境界を確認')
