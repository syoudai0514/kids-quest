// コンテンツ追加時に、全学年・全教科が実際に問題を作れるかを確認する。
// Luna のような軽量エージェントがデータだけを増やしても、壊れた設問を
// 公開へ持ち込まないための最小ゲート。外部サービスや乱数シードは不要。
import { domainsForGrade } from '../src/engine/activities.js'
import { generateNumbersQuestion, NUMBERS_KINDS, NUMBERS_KINDS_BY_GRADE } from '../src/data/content/numbers.js'
import { generateSeikatsuQuestion, SEIKATSU_KINDS } from '../src/data/content/seikatsu.js'
import { generateRikaQuestion, RIKA_QUESTIONS, RIKA_UNIT_EXPECTATIONS } from '../src/data/content/rika.js'
import { generateShakaiQuestion, SHAKAI_QUESTIONS, SHAKAI_UNIT_EXPECTATIONS } from '../src/data/content/shakai.js'
import { generateDoutokuQuestion, DOUTOKU_BANK_SIZES, DOUTOKU_LIFE_END_ITEM_KEYS } from '../src/data/content/doutoku.js'
import { generateReadingQuestion } from '../src/data/content/reading.js'
import { generateLanguageQuestion, generateDokkaiQuestion } from '../src/data/content/readingLanguage.js'
import { KANJI_BY_GRADE, JUKUGO_BY_GRADE } from '../src/data/kanjiByGrade.js'
import { hasStrokeData } from '../src/data/strokeOrder.js'
import { generateWritingQuestion, WRITING_GROUPS_BY_GRADE } from '../src/data/content/writing.js'
import { questionIds } from '../src/engine/reviewKey.js'
import { generateHardNumbersQuestion, HARD_NUMBERS_KINDS, HARD_NUMBERS_KINDS_BY_GRADE } from '../src/data/content/hard/numbers-hard.js'
import { generateHardReadingQuestion, HARD_READING_FORMS } from '../src/data/content/hard/reading-hard.js'
import { generateHardRikaQuestion, HARD_RIKA_QUESTIONS } from '../src/data/content/hard/rika-hard.js'
import { generateHardShakaiQuestion, HARD_SHAKAI_QUESTIONS } from '../src/data/content/hard/shakai-hard.js'
import { generateHardEnglishQuestion, HARD_ENGLISH_QUESTIONS } from '../src/data/content/hard/english-hard.js'
import { generateEnglishQuestion, ENGLISH_GRAMMAR } from '../src/data/content/english.js'
import { unitIdFor, unitLedger } from '../src/engine/learningUnits.js'

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

// WP4/WP5: 「単元名がある」だけでは完了にしない。各学年30問以上、
// 各単元3問以上を要求し、計画書で明示された社会の未収録単元も固定する。
function verifyFixedBankCoverage(label, expectations) {
  for (const [grade, expected] of Object.entries(expectations)) {
    const unitCounts = Object.values(expected).reduce((counts, unitId) => ({ ...counts, [unitId]: (counts[unitId] || 0) + 1 }), {})
    requireValue(Object.keys(expected).length >= 30, `${label} 小${grade}: 30問未満（${Object.keys(expected).length}問）`)
    for (const [unitId, count] of Object.entries(unitCounts)) requireValue(count >= 3, `${label} 小${grade}: ${unitId} が3問未満（${count}問）`)
  }
}
verifyFixedBankCoverage('理科', RIKA_UNIT_EXPECTATIONS)
verifyFixedBankCoverage('社会', SHAKAI_UNIT_EXPECTATIONS)
for (const unitId of ['social:3:city-observation', 'social:3:local-production', 'social:4:traditional-culture', 'social:4:local-development', 'social:5:trade', 'social:5:environment']) {
  const grade = unitId.split(':')[1]
  requireValue(Object.values(SHAKAI_UNIT_EXPECTATIONS[grade] || {}).includes(unitId), `社会の必須単元が未収録: ${unitId}`)
}

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

// 計画書§6.1「正解が常に最長／最短になっていない（全問題で分布を検査）」。
// 1問ずつの上限（上の verifyNoLengthTell）だけでは、1〜3文字の差が
// 積み重なった偏りを見逃す。実際、教材を増やしたときに しゃかいの
// 新規60問は50%が「正解が単独最長」になっていた（4択の偶然は約25%）。
// 「いちばん長い選択肢を選ぶ」だけで正答率が偶然を超える状態を禁じる。
function verifyLengthDistribution(label, questions, generate, prefix, maxRate = 0.3, maxGap = 3) {
  let total = 0
  let uniquelyLongest = 0
  for (const question of questions) {
    const item = generate({ grade: 6, level: 12, choiceCount: 4 }, `${prefix}${question}`)
    const choices = item?.choices ?? []
    const answer = choices.find((choice) => choice.id === item.answerId)
    if (!answer || choices.length < 3) continue
    total++
    const lengths = choices.map((choice) => String(choice.label ?? choice.id).replace(/\s/g, '').length)
    const answerLength = String(answer.label ?? answer.id).replace(/\s/g, '').length
    const longest = Math.max(...lengths)
    if (answerLength === longest && lengths.filter((l) => l === longest).length === 1) uniquelyLongest++
    const wrongLengths = choices.filter((choice) => choice.id !== item.answerId).map((choice) => String(choice.label ?? choice.id).replace(/\s/g, '').length)
    const gap = answerLength - Math.max(...wrongLengths)
    requireValue(gap <= maxGap, `${label}: 正解が全誤答より${gap}文字長く、見ただけで選べる: 「${question}」`)
  }
  if (!total) return
  const rate = uniquelyLongest / total
  requireValue(rate <= maxRate, `${label}: 正解が単独で最長になる割合が${Math.round(rate * 100)}%（4択の偶然は約25%、上限${Math.round(maxRate * 100)}%）。長い選択肢を選ぶだけで当たってしまう`)
}
verifyLengthDistribution('りか', RIKA_QUESTIONS, generateRikaQuestion, 'r:')
verifyLengthDistribution('しゃかい', SHAKAI_QUESTIONS, generateShakaiQuestion, 'c:')

// WP2の短文読解も、選択肢を1問ずつ手で書くため同じ偏りが出る
// （実測で正解が単独最長になる割合が64%あった）。固定リストではなく
// 実際の生成結果をまとめて測る。
{
  let total = 0
  let uniquelyLongest = 0
  let worstGap = { gap: 0, question: '' }
  for (const grade of [3, 4, 5, 6]) {
    for (let i = 0; i < 600; i++) {
      const item = generateDokkaiQuestion({ grade, choiceCount: 4 })
      const choices = item?.choices ?? []
      const answer = choices.find((choice) => choice.id === item.answerId)
      if (!answer || choices.length < 3) continue
      total++
      const lengths = choices.map((choice) => String(choice.label ?? choice.id).replace(/\s/g, '').length)
      const answerLength = String(answer.label ?? answer.id).replace(/\s/g, '').length
      const longest = Math.max(...lengths)
      if (answerLength === longest && lengths.filter((l) => l === longest).length === 1) uniquelyLongest++
      const wrongLengths = choices.filter((choice) => choice.id !== item.answerId).map((choice) => String(choice.label ?? choice.id).replace(/\s/g, '').length)
      const gap = answerLength - Math.max(...wrongLengths)
      if (gap > worstGap.gap) worstGap = { gap, question: item.instruction }
    }
  }
  if (total) {
    const rate = uniquelyLongest / total
    requireValue(rate <= 0.35, `短文読解: 正解が単独で最長になる割合が${Math.round(rate * 100)}%（4択の偶然は約25%）。長い選択肢を選ぶだけで当たってしまう`)
    requireValue(worstGap.gap <= 6, `短文読解: 正解が全誤答より${worstGap.gap}文字長い設問がある: 「${worstGap.question}」`)
  }
}

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

// WP6: どうとくの3段階化（各段階20問以上）と、D視点「生命の終わり」の
// 保護者設定・学年ゲートを固定する。gradeMax ではなく grade で判定する
// ことが必須要件（学年を戻した子に高学年向け話題を出さないため）。
for (const [tier, size] of Object.entries(DOUTOKU_BANK_SIZES)) {
  requireValue(size >= 20, `どうとく${tier}段階が20問未満: ${size}問`)
}
requireValue(DOUTOKU_LIFE_END_ITEM_KEYS.length > 0, 'どうとく: 生命の終わりの項目が1つも登録されていない')
// 設定OFFなら、学年を問わず絶対に出ない。
for (let grade = 0; grade <= 6; grade++) {
  for (let n = 0; n < 400; n++) {
    const q = generateDoutokuQuestion({ grade, choiceCount: 3, showLifeEndTopics: false })
    requireValue(!DOUTOKU_LIFE_END_ITEM_KEYS.includes(q.itemKey), `小${grade}: 保護者設定OFFなのに生命の終わりの項目が出た「${q.itemKey}」`)
  }
}
// 設定ONでも、学年が5未満（grade判定。gradeMaxは見ない）なら出ない。
for (let grade = 0; grade <= 4; grade++) {
  for (let n = 0; n < 400; n++) {
    const q = generateDoutokuQuestion({ grade, choiceCount: 3, showLifeEndTopics: true })
    requireValue(!DOUTOKU_LIFE_END_ITEM_KEYS.includes(q.itemKey), `小${grade}: 設定ONでも高学年未満なのに生命の終わりの項目が出た「${q.itemKey}」`)
  }
}
// 設定ONかつ小5・小6なら、実際に生成候補へ入っている（機能していることの確認）。
for (const grade of [5, 6]) {
  const seenLifeEnd = new Set()
  for (let n = 0; n < 3000; n++) {
    const q = generateDoutokuQuestion({ grade, choiceCount: 3, showLifeEndTopics: true })
    if (DOUTOKU_LIFE_END_ITEM_KEYS.includes(q.itemKey)) seenLifeEnd.add(q.itemKey)
  }
  requireValue(seenLifeEnd.size > 0, `小${grade}: 設定ONでも生命の終わりの項目が一度も出なかった`)
}
// D視点「答えのない問い」(type:'reflect') は、正誤の概念を一切持たない
// 形であることをデータ構造レベルで固定する。
for (let grade = 3; grade <= 6; grade++) {
  for (let n = 0; n < 300; n++) {
    const q = generateDoutokuQuestion({ grade, choiceCount: 3, showLifeEndTopics: true })
    if (q.type !== 'reflect') continue
    requireValue(q.answerId === undefined && q.choices === undefined, `どうとく 答えのない問いに正誤フィールドが混入: ${q.itemKey}`)
    requireValue(Array.isArray(q.views) && q.views.length >= 3, `どうとく 答えのない問いの見方が不足: ${q.itemKey}`)
    const labels = q.views.map((v) => v.label)
    requireValue(new Set(labels).size === labels.length, `どうとく 答えのない問いの見方ラベルが重複: ${q.itemKey}`)
    for (const v of q.views) requireValue(typeof v.note === 'string' && v.note.length > 8, `どうとく 答えのない問いの説明が短すぎる: ${q.itemKey}/${v.id}`)
  }
}
for (const grade of [0, 3, 6]) {
  verifyUnseenPriorityCoverage(`どうとく(小${grade})`, generateDoutokuQuestion, { grade, choiceCount: 3, showLifeEndTopics: true })
}

// ---- 「長さで正解が分かる」問題を、教科をまたいで体系的に検出する ----
// 既存の verifyNoLengthTell は りか・しゃかい の固定リストだけを見ていたため、
// どうとく・せいかつ・よむ に同じ欠陥が入っても素通りしていた（実際に
// どうとく9件・よむ6件が公開まで到達した）。ここでは出題タイプごとに
// 「正解が唯一の最長／唯一の最短になる割合」を測り、偶然ではなく
// 構造的に当てられるものだけを落とす。
function verifySystematicLengthTell(label, generate, grades, draws = 900) {
  const stats = new Map()
  for (const grade of grades) {
    for (let i = 0; i < draws; i++) {
      let question
      try { question = generate({ grade, level: (i % 12) + 1, choiceCount: 3 }) } catch { continue }
      const choices = question?.choices ?? []
      if (choices.length < 3) continue
      const answer = choices.find((choice) => choice.id === question.answerId)
      if (!answer) continue
      const lengths = choices.map((choice) => String(choice.label ?? choice.id).replace(/\s/g, '').length)
      const answerLength = String(answer.label ?? answer.id).replace(/\s/g, '').length
      const longest = Math.max(...lengths)
      const shortest = Math.min(...lengths)
      const entry = stats.get(question.itemKey) || { n: 0, long: 0, short: 0, sample: '' }
      entry.n++
      if (answerLength === longest && lengths.filter((l) => l === longest).length === 1) entry.long++
      if (answerLength === shortest && lengths.filter((l) => l === shortest).length === 1) entry.short++
      entry.sample = choices.map((choice) => choice.label).join(' / ')
      stats.set(question.itemKey, entry)
    }
  }
  for (const [itemKey, entry] of stats) {
    if (entry.n < 20) continue
    const longRate = entry.long / entry.n
    const shortRate = entry.short / entry.n
    requireValue(longRate < 0.9, `${label}: 正解がほぼ毎回いちばん長く、長さだけで当てられる: ${itemKey}（${entry.sample}）`)
    requireValue(shortRate < 0.9, `${label}: 正解がほぼ毎回いちばん短く、長さだけで当てられる: ${itemKey}（${entry.sample}）`)
  }
}
verifySystematicLengthTell('どうとく', generateDoutokuQuestion, [0, 1, 2, 3, 4, 5, 6])
verifySystematicLengthTell('せいかつ', generateSeikatsuQuestion, [0, 1, 2])
verifySystematicLengthTell('よむ', generateReadingQuestion, [1, 2, 3, 4, 5, 6])

// ---- 算数: 円周率をつかう式を、丸めずに検算する ----
// 直径×3.14 は必ず小数第2位までの値になる。1位で丸めると
// 4×3.14=12.6 のように「算数として誤った答え」を正解にしてしまい、
// 正しく計算した子ほど不正解になる（実際に公開まで到達した）。
for (let i = 0; i < 400; i++) {
  const circumference = generateNumbersQuestion({ grade: 5, level: 12, choiceCount: 4 }, 'n:circumference')
  if (circumference?.itemKey === 'n:circumference') {
    const diameter = Number(String(circumference.visual.text).match(/直径(\d+)cm/)[1])
    const expected = Math.round(diameter * 3.14 * 100) / 100
    requireValue(Number(circumference.answerId) === expected, `さんすう 円周の正解が誤り: 直径${diameter}cm → ${circumference.answerId}（正しくは ${expected}）`)
  }
  const circleArea = generateNumbersQuestion({ grade: 6, level: 12, choiceCount: 4 }, 'n:circleArea')
  if (circleArea?.itemKey === 'n:circleArea') {
    const radius = Number(String(circleArea.visual.text).match(/半径(\d+)cm/)[1])
    const expected = Math.round(radius * radius * 3.14 * 100) / 100
    requireValue(Number(circleArea.answerId) === expected, `さんすう 円の面積の正解が誤り: 半径${radius}cm → ${circleArea.answerId}（正しくは ${expected}）`)
  }
}

// ---- WP3: 名前だけでなく、学年の中核操作を実際に問う ----
// decimalDiv は小数「で」わる、fracDiv は分数「で」わる問題でなければ、
// 小5・小6の欠落単元を埋めたことにならない。
for (let i = 0; i < 300; i++) {
  const decimal = generateNumbersQuestion({ grade: 5, level: 12, choiceCount: 4 }, 'n:decimalDiv')
  const decimalMatch = String(decimal.instruction).match(/^([\d.]+) ÷ ([\d.]+) ＝/)
  requireValue(decimalMatch && Number(decimalMatch[2]) % 1 !== 0, `さんすう 小数のわり算: 除数が小数ではない (${decimal.instruction})`)
  if (decimalMatch) {
    const expected = Math.round((Number(decimalMatch[1]) / Number(decimalMatch[2])) * 100) / 100
    requireValue(Number(decimal.answerId) === expected, `さんすう 小数のわり算の正解が誤り: ${decimal.instruction} → ${decimal.answerId}`)
  }

  const fraction = generateNumbersQuestion({ grade: 6, level: 12, choiceCount: 4 }, 'n:fracDiv')
  const fractionMatch = String(fraction.instruction).match(/^(\d+)\/(\d+) ÷ (\d+)\/(\d+) ＝/)
  requireValue(!!fractionMatch, `さんすう 分数のわり算: 除数が分数ではない (${fraction.instruction})`)
  if (fractionMatch) {
    const expected = (Number(fractionMatch[1]) * Number(fractionMatch[4])) / (Number(fractionMatch[2]) * Number(fractionMatch[3]))
    const [num, denom = '1'] = String(fraction.answerId).split('/')
    requireValue(Math.abs(Number(num) / Number(denom) - expected) < 1e-9, `さんすう 分数のわり算の正解が誤り: ${fraction.instruction} → ${fraction.answerId}`)
  }
}
for (const kind of ['decimalMul', 'fracAddSame', 'fracSubSame']) {
  requireValue(NUMBERS_KINDS_BY_GRADE[4].includes(kind), `小4の必須算数単元が未登録: ${kind}`)
}
for (const kind of ['volume', 'multiples', 'divisors', 'lcm', 'gcdKind']) {
  requireValue(NUMBERS_KINDS_BY_GRADE[5].includes(kind), `小5の必須算数単元が未登録: ${kind}`)
}

// ---- 算数: 選択肢に浮動小数の誤差を出さない ----
// 小数の答えに整数を足してダミーを作ると 16.560000000000002 のような
// 表示になる。子どもには意味不明なので、桁をそろえてから出す。
for (let grade = 0; grade <= 6; grade++) {
  for (let i = 0; i < 400; i++) {
    const question = generateNumbersQuestion({ grade, level: (i % 12) + 1, choiceCount: 4 })
    for (const choice of question?.choices ?? []) {
      requireValue(!/\d\.\d{3,}/.test(String(choice.label)), `さんすう 選択肢に浮動小数の誤差: ${question.itemKey} → ${choice.label}`)
    }
  }
}

// ---- WP9/WP10: むずかしいモード（特殊算）----
// 計画書§4.2(d)(f): hard専用の名前空間を使い、通常のunitLedgerに
// 一切合流しないことを固定で検証する（りか/しゃかい等と違い、
// 「単元台帳を汚さない」こと自体が受入条件のため）。
for (const grade of [4, 5, 6]) {
  const expectedKinds = new Set(HARD_NUMBERS_KINDS_BY_GRADE[grade] || [])
  for (const kind of expectedKinds) {
    for (let i = 0; i < 20; i++) {
      const q = generateHardNumbersQuestion({ grade }, `hard:n:${kind}`)
      requireValue(q, `hard算数 小${grade} ${kind}: 生成できない`)
      if (!q) continue
      requireValue(q.itemKey === `hard:n:${kind}`, `hard算数 小${grade} ${kind}: itemKeyが不正 (${q.itemKey})`)
      requireValue(/^\d+$/.test(String(q.answerId)), `hard算数 小${grade} ${kind}: 答えが非負整数でない (${q.answerId})`)
      requireValue(typeof q.explain === 'string' && q.explain.length > 0, `hard算数 小${grade} ${kind}: explainがない`)
      requireValue(Array.isArray(q.explainSteps) && q.explainSteps.length >= 2, `hard算数 小${grade} ${kind}: explainStepsが不足`)
      const unitId = unitIdFor(q, grade)
      requireValue(String(unitId).startsWith('hard:'), `hard算数 小${grade} ${kind}: unitIdが通常名前空間に漏れている (${unitId})`)
    }
  }
  // 未出のkindも含め、grade指定のみでの自由生成でも到達できることを確認
  const reached = new Set()
  for (let i = 0; i < 400; i++) {
    const q = generateHardNumbersQuestion({ grade })
    if (q) reached.add(q.itemKey.slice(7))
  }
  for (const kind of expectedKinds) requireValue(reached.has(kind), `hard算数 小${grade} ${kind}: 自由生成で一度も出ない`)
}
// numbers.js の mode==='hard' 分岐が正しく機能し、通常モードを汚さないこと
for (const grade of [4, 5, 6]) {
  for (let i = 0; i < 60; i++) {
    const hardQ = generateNumbersQuestion({ grade, mode: 'hard', level: 1, choiceCount: 4 })
    requireValue(hardQ && String(hardQ.itemKey).startsWith('hard:n:'), `さんすう hardモード 小${grade}: hard内容が返らない`)
    const normalQ = generateNumbersQuestion({ grade, mode: 'normal', level: 3, choiceCount: 4 })
    requireValue(normalQ && !String(normalQ.itemKey).startsWith('hard:'), `さんすう normalモード 小${grade}: hard内容が混入`)
  }
}
// unitLedgerにhard系unitIdが一切現れないこと（全学年）
for (let grade = 0; grade <= 6; grade++) {
  const polluted = unitLedger(grade).filter((entry) => String(entry.unitId).startsWith('hard:'))
  requireValue(polluted.length === 0, `unitLedger 小${grade}: hard系unitIdが混入 (${polluted.map((e) => e.unitId).join(',')})`)
}

// ---- hard算数: 解説の式が、書いてあるとおりに計算して答えに合うこと ----
// ×と÷を混ぜた式でかっこを忘れると（例: 6×5÷1×2＝15）、書いてある順に
// 計算した子は違う答えになる。答え自体は正しいので通常の検算では見つからず、
// 解説を読んで真面目に計算した子だけが混乱する。実際に道順の解説で発生した。
{
  const EXPR = /([0-9０-９().,×÷＋－]+)＝([0-9]+(?:\.[0-9]+)?)/g
  const toJs = (expr) => expr
    .replace(/×/g, '*').replace(/÷/g, '/').replace(/＋/g, '+').replace(/－/g, '-')
    .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xFEE0))
    .replace(/,/g, '')
  for (const kind of HARD_NUMBERS_KINDS) {
    for (let i = 0; i < 60; i++) {
      const question = generateHardNumbersQuestion({ grade: 6 }, `hard:n:${kind}`)
      for (const step of [...(question?.explainSteps || []), question?.explain || '']) {
        const text = String(step)
        for (const match of text.matchAll(EXPR)) {
          const [whole, expr, rhs] = match
          // 「A：B＝C：D」の比の行は「式＝答え」ではないため対象外
          //（＝をまたいで比の片側だけを拾ってしまい誤検知になる）。
          if (text[match.index - 1] === '：' || text[match.index + whole.length] === '：') continue
          if (!/[×÷＋－]/.test(expr)) continue
          const js = toJs(expr)
          if (!/^[\d().+\-*/ ]+$/.test(js)) continue
          let value
          try { value = eval(js) } catch { continue } // eslint-disable-line no-eval
          if (typeof value !== 'number' || !isFinite(value)) continue
          requireValue(
            Math.abs(value - Number(rhs)) < 1e-9,
            `hard算数 ${kind}: 解説の式が書いてある順に計算すると合わない「${expr}＝${rhs}」（計算すると ${value}。かっこが要る）`
          )
        }
      }
    }
  }
}

// ---- WP10: むずかしいモード（こくご発展）----
// hard算数と同じ設計（計画書§4.2(d)）。itemKeyは 'hard:yomu:' 名前空間、
// unitIdは 'hard:' 名前空間で、unitLedgerには一切合流しない（上のループで確認済み）。
for (const grade of [4, 5, 6]) {
  const reached = new Set()
  for (let i = 0; i < 1500; i++) {
    const q = generateHardReadingQuestion({ grade, choiceCount: 4 })
    if (!q) continue
    reached.add(q.itemKey)
    requireValue(String(q.itemKey).startsWith('hard:yomu:'), `hardこくご 小${grade}: itemKeyが不正 (${q.itemKey})`)
    requireValue(String(q.unitId).startsWith('hard:'), `hardこくご 小${grade}: unitIdが通常名前空間に漏れている (${q.unitId})`)
    requireValue(typeof q.explain === 'string' && q.explain.length > 0, `hardこくご 小${grade} ${q.itemKey}: explainがない`)
    requireValue((q.choices || []).some((c) => c.id === q.answerId), `hardこくご 小${grade} ${q.itemKey}: 正解が選択肢にない`)
    requireValue(new Set((q.choices || []).map((c) => c.id)).size === (q.choices || []).length, `hardこくご 小${grade} ${q.itemKey}: 選択肢が重複`)
  }
  for (const form of HARD_READING_FORMS) {
    for (const item of form.pool) {
      if ((item.minGrade ?? 4) > grade) continue
      const key = form.keyOf(item)
      requireValue(reached.has(key), `hardこくご 小${grade}: 自由生成で一度も出ない (${key})`)
    }
  }
}
// reading.js の mode==='hard' 分岐が正しく機能し、通常モードを汚さないこと
for (const grade of [4, 5, 6]) {
  for (let i = 0; i < 60; i++) {
    const hardQ = generateReadingQuestion({ grade, mode: 'hard', level: 1, choiceCount: 4 })
    requireValue(hardQ && String(hardQ.itemKey).startsWith('hard:'), `こくご hardモード 小${grade}: hard内容が返らない`)
    const normalQ = generateReadingQuestion({ grade, mode: 'normal', level: 3, choiceCount: 4 })
    requireValue(normalQ && !String(normalQ.itemKey).startsWith('hard:'), `こくご normalモード 小${grade}: hard内容が混入`)
  }
}
// 長さだけで正解が分かってしまわないこと（品詞名の字数など、固定語い系の形式は
// 特に危険。numbers-hard.jsと同じ verifySystematicLengthTell を再利用する）
verifySystematicLengthTell('こくご(hard)', (params) => generateReadingQuestion({ ...params, mode: 'hard' }), [4, 5, 6], 1500)

// ---- WP10: むずかしいモード（りか発展）----
// hard算数・hardこくごと同じ設計。itemKeyは 'hard:r:' 名前空間、
// unitIdは 'hard:rika:' 名前空間で、unitLedgerには一切合流しない。
{
  const reached = new Set()
  for (let i = 0; i < 3000; i++) {
    const q = generateHardRikaQuestion({ grade: 6, choiceCount: 4 })
    if (!q) continue
    reached.add(q.itemKey)
    requireValue(String(q.itemKey).startsWith('hard:r:'), `hardりか: itemKeyが不正 (${q.itemKey})`)
    requireValue(String(q.unitId).startsWith('hard:rika:'), `hardりか: unitIdが通常名前空間に漏れている (${q.unitId})`)
    requireValue(typeof q.explain === 'string' && q.explain.length > 0, `hardりか ${q.itemKey}: explainがない`)
    requireValue((q.choices || []).some((c) => c.id === q.answerId), `hardりか ${q.itemKey}: 正解が選択肢にない`)
    requireValue(new Set((q.choices || []).map((c) => c.id)).size === (q.choices || []).length, `hardりか ${q.itemKey}: 選択肢が重複`)
  }
  for (const question of HARD_RIKA_QUESTIONS) {
    requireValue(reached.has(`hard:r:${question}`), `hardりか: 自由生成で一度も出ない (${question})`)
  }
  const dupCheck = new Set()
  for (const question of HARD_RIKA_QUESTIONS) {
    requireValue(!dupCheck.has(question), `hardりか: 問題文が重複 (${question})`)
    dupCheck.add(question)
    requireValue(!RIKA_QUESTIONS.includes(question), `hardりか: 通常モードと同じ問題文が混入 (${question})`)
  }
}
// rika.js の mode==='hard' 分岐が正しく機能し、通常モードを汚さないこと
for (const grade of [4, 5, 6]) {
  for (let i = 0; i < 40; i++) {
    const hardQ = generateRikaQuestion({ grade, mode: 'hard', choiceCount: 4 })
    requireValue(hardQ && String(hardQ.itemKey).startsWith('hard:'), `りか hardモード 小${grade}: hard内容が返らない`)
    const normalQ = generateRikaQuestion({ grade, mode: 'normal', choiceCount: 4 })
    requireValue(normalQ && !String(normalQ.itemKey).startsWith('hard:'), `りか normalモード 小${grade}: hard内容が混入`)
  }
}
// hardりかは通常りかと同じ「最長の誤答を必ず含める」build()方式（選択肢が
// 常に4つ）なので、専用のcc=4版チェック（通常りか/しゃかいと同じ関数）を使う。
// verifySystematicLengthTell はcc=3を使うため、この方式とは相性が悪い
// （誤答3件中2件しか見せない分、正解が単独最長/最短に偏って見える）。
verifyNoLengthTell('りか(hard)', HARD_RIKA_QUESTIONS, (params, key) => generateHardRikaQuestion(params, key), 'hard:r:')
verifyLengthDistribution('りか(hard)', HARD_RIKA_QUESTIONS, (params, key) => generateHardRikaQuestion(params, key), 'hard:r:')

// ---- WP10: むずかしいモード（しゃかい発展）----
// hardりかと同じ設計。itemKeyは 'hard:c:' 名前空間、
// unitIdは 'hard:shakai:' 名前空間で、unitLedgerには一切合流しない。
{
  const reached = new Set()
  for (let i = 0; i < 3000; i++) {
    const q = generateHardShakaiQuestion({ grade: 6, choiceCount: 4 })
    if (!q) continue
    reached.add(q.itemKey)
    requireValue(String(q.itemKey).startsWith('hard:c:'), `hardしゃかい: itemKeyが不正 (${q.itemKey})`)
    requireValue(String(q.unitId).startsWith('hard:shakai:'), `hardしゃかい: unitIdが通常名前空間に漏れている (${q.unitId})`)
    requireValue(typeof q.explain === 'string' && q.explain.length > 0, `hardしゃかい ${q.itemKey}: explainがない`)
    requireValue((q.choices || []).some((c) => c.id === q.answerId), `hardしゃかい ${q.itemKey}: 正解が選択肢にない`)
    requireValue(new Set((q.choices || []).map((c) => c.id)).size === (q.choices || []).length, `hardしゃかい ${q.itemKey}: 選択肢が重複`)
  }
  for (const question of HARD_SHAKAI_QUESTIONS) {
    requireValue(reached.has(`hard:c:${question}`), `hardしゃかい: 自由生成で一度も出ない (${question})`)
  }
  const dupCheck = new Set()
  for (const question of HARD_SHAKAI_QUESTIONS) {
    requireValue(!dupCheck.has(question), `hardしゃかい: 問題文が重複 (${question})`)
    dupCheck.add(question)
    requireValue(!SHAKAI_QUESTIONS.includes(question), `hardしゃかい: 通常モードと同じ問題文が混入 (${question})`)
  }
}
// shakai.js の mode==='hard' 分岐が正しく機能し、通常モードを汚さないこと
for (const grade of [4, 5, 6]) {
  for (let i = 0; i < 40; i++) {
    const hardQ = generateShakaiQuestion({ grade, mode: 'hard', choiceCount: 4 })
    requireValue(hardQ && String(hardQ.itemKey).startsWith('hard:'), `しゃかい hardモード 小${grade}: hard内容が返らない`)
    const normalQ = generateShakaiQuestion({ grade, mode: 'normal', choiceCount: 4 })
    requireValue(normalQ && !String(normalQ.itemKey).startsWith('hard:'), `しゃかい normalモード 小${grade}: hard内容が混入`)
  }
}
verifyNoLengthTell('しゃかい(hard)', HARD_SHAKAI_QUESTIONS, (params, key) => generateHardShakaiQuestion(params, key), 'hard:c:')
verifyLengthDistribution('しゃかい(hard)', HARD_SHAKAI_QUESTIONS, (params, key) => generateHardShakaiQuestion(params, key), 'hard:c:')

// ---- WP10: むずかしいモード（えいご発展）----
// hardりか/hardしゃかいと同じ設計。itemKeyは 'hard:eng:' 名前空間、
// unitIdは 'hard:english:' 名前空間で、unitLedgerには一切合流しない
// （english.jsのwithLearningUnitはdomain:'english'をそもそも素通りするため
// unitId/skillIdはbuild()が明示的に設定した値がそのまま使われる）。
{
  const reached = new Set()
  for (let i = 0; i < 3000; i++) {
    const q = generateHardEnglishQuestion({ grade: 6, choiceCount: 4 })
    if (!q) continue
    reached.add(q.itemKey)
    requireValue(String(q.itemKey).startsWith('hard:eng:'), `hardえいご: itemKeyが不正 (${q.itemKey})`)
    requireValue(String(q.unitId).startsWith('hard:english:'), `hardえいご: unitIdが通常名前空間に漏れている (${q.unitId})`)
    requireValue(q.domain === 'english', `hardえいご ${q.itemKey}: domainが不正 (${q.domain})`)
    requireValue(typeof q.explain === 'string' && q.explain.length > 0, `hardえいご ${q.itemKey}: explainがない`)
    requireValue((q.choices || []).some((c) => c.id === q.answerId), `hardえいご ${q.itemKey}: 正解が選択肢にない`)
    requireValue(new Set((q.choices || []).map((c) => c.id)).size === (q.choices || []).length, `hardえいご ${q.itemKey}: 選択肢が重複`)
  }
  for (const question of HARD_ENGLISH_QUESTIONS) {
    requireValue(reached.has(`hard:eng:${question}`), `hardえいご: 自由生成で一度も出ない (${question})`)
  }
  const dupCheck = new Set()
  for (const question of HARD_ENGLISH_QUESTIONS) {
    requireValue(!dupCheck.has(question), `hardえいご: 問題文が重複 (${question})`)
    dupCheck.add(question)
    requireValue(!ENGLISH_GRAMMAR.some((item) => item.sentence === question), `hardえいご: 通常モードと同じ文が混入 (${question})`)
  }
}
// english.js の mode==='hard' 分岐が正しく機能し、通常モードを汚さないこと
for (const grade of [4, 5, 6]) {
  for (let i = 0; i < 40; i++) {
    const hardQ = generateEnglishQuestion({ grade, mode: 'hard', choiceCount: 4 })
    requireValue(hardQ && String(hardQ.itemKey).startsWith('hard:'), `えいご hardモード 小${grade}: hard内容が返らない`)
    const normalQ = generateEnglishQuestion({ grade, mode: 'normal', choiceCount: 4, englishAudioAvailable: true })
    requireValue(normalQ && !String(normalQ.itemKey).startsWith('hard:'), `えいご normalモード 小${grade}: hard内容が混入`)
  }
}
// 指定復習（reviewKey）で hard:eng: を渡したときに、同じ文へ戻ること。
for (const question of HARD_ENGLISH_QUESTIONS) {
  const key = `hard:eng:${question}`
  const q = generateEnglishQuestion({ grade: 6, mode: 'hard', choiceCount: 4, reviewKey: key }, key)
  requireValue(q?.itemKey === key, `hardえいご: 指定復習が別の文へ化けた (${question})`)
}
verifyNoLengthTell('えいご(hard)', HARD_ENGLISH_QUESTIONS, (params, key) => generateHardEnglishQuestion(params, key), 'hard:eng:')
verifyLengthDistribution('えいご(hard)', HARD_ENGLISH_QUESTIONS, (params, key) => generateHardEnglishQuestion(params, key), 'hard:eng:')

if (errors.length) {
  console.error(`コンテンツ検証失敗 (${errors.length}件)`)
  for (const error of errors.slice(0, 30)) console.error(`- ${error}`)
  process.exit(1)
}

console.log('コンテンツ検証OK: 非英語の全学年・全難易度・全ビルダー・日付境界を確認')
