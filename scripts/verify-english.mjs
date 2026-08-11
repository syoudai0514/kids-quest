import { ENGLISH_WORDS, ENGLISH_PHRASES, generateEnglishQuestion } from '../src/data/content/english.js'
import { domainsForGrade } from '../src/engine/activities.js'
import { buildCoreMission } from '../src/engine/missions.js'
import { migrateContentVersion, saveProfileSnapshot } from '../src/engine/storage.js'
import { advanceEnglishProgress } from '../src/engine/englishProgress.js'

const fail = (message) => { throw new Error(message) }
const must = (ok, message) => { if (!ok) fail(message) }
const expectedForms = {
  0: ['listen-picture', 'picture-word', 'alphabet'],
  1: ['listen-picture', 'picture-word', 'word-meaning', 'spelling'],
  3: ['listen-picture', 'picture-word', 'word-meaning', 'japanese-word', 'conversation'],
  5: ['listen-picture', 'word-meaning', 'japanese-word', 'spelling', 'conversation', 'word-order']
}

must(ENGLISH_WORDS.length >= 200, `単語数が不足: ${ENGLISH_WORDS.length}`)
must(ENGLISH_PHRASES.length >= 50, `会話表現数が不足: ${ENGLISH_PHRASES.length}`)
must(new Set(ENGLISH_WORDS.map((w) => w.id)).size === ENGLISH_WORDS.length, '単語IDが重複')
must(new Set(ENGLISH_PHRASES.map((p) => p.id)).size === ENGLISH_PHRASES.length, '会話IDが重複')

function verifyQuestion(q, grade, audioAvailable) {
  must(q?.answerId, `小${grade}: 正解IDなし`)
  if (q.type === 'choice') {
    must(q.choices.some((choice) => choice.id === q.answerId), `小${grade}: 正解選択肢なし`)
    must(new Set(q.choices.map((choice) => choice.id)).size === q.choices.length, `小${grade}: 選択肢ID重複`)
    const labels = q.choices.map((choice) => String(choice.label || '').trim()).filter(Boolean)
    const emojis = q.choices.map((choice) => String(choice.emoji || '').trim()).filter(Boolean)
    must(new Set(labels).size === labels.length, `小${grade}: 選択肢文言重複 (${q.form})`)
    must(new Set(emojis).size === emojis.length, `小${grade}: 選択肢絵文字重複 (${q.form})`)
    // 「絵→英語」などで、問題の絵と答えの絵を一致させない。
    if (q.visual?.kind === 'emoji') must(!emojis.includes(q.visual.emoji), `小${grade}: 問題と選択肢の絵が一致 (${q.form})`)
  } else if (q.type === 'order') {
    must(q.answerId === q.correctOrder.join('|'), `小${grade}: 語順問題の正解が不正`)
    must(new Set(q.items.map((item) => item.id)).size === q.items.length, `小${grade}: 語順トークン重複`)
  } else fail(`小${grade}: 未対応の問題形式 ${q.type}`)
  if (!['listen-picture', 'conversation'].includes(q.form)) {
    must(!q.autoPlayPrompt && !q.promptEnglishAudio, `小${grade}: 回答前に正解音声が流れる (${q.form})`)
  }
  if (!audioAvailable) must(!['listen-picture', 'conversation'].includes(q.form), `小${grade}: 音声なしでリスニングが生成された`)
}

for (let grade = 0; grade <= 6; grade++) {
  must(domainsForGrade(grade).some((d) => d.id === 'english'), `小${grade}: えいごが未登録`)
  for (let i = 0; i < 120; i++) verifyQuestion(generateEnglishQuestion({ grade, choiceCount: 4, englishAudioAvailable: i % 2 === 0 }), grade, i % 2 === 0)
  const tasks = buildCoreMission(grade, 20000)
  must(tasks.length <= 6 && new Set(tasks.map((t) => t.domainId)).size === tasks.length, `小${grade}: ミッション重複または上限超過`)
}

for (const [grade, forms] of Object.entries(expectedForms)) {
  for (const form of forms) {
    const q = generateEnglishQuestion({ grade: Number(grade), choiceCount: 4, englishAudioAvailable: true, forceForm: form })
    must(q.form === form, `小${grade}: ${form} が生成されない（${q.form}）`)
    verifyQuestion(q, grade, true)
  }
}

// 4問の中で同じ語を出さない（補強復習を明示指定した場合だけは例外）。
const seen = []
for (let i = 0; i < 4; i++) {
  const q = generateEnglishQuestion({ grade: 3, choiceCount: 4, englishAudioAvailable: true, seenItemKeys: seen })
  must(!seen.includes(q.itemKey), '同一4問で英語項目が重複')
  seen.push(q.itemKey)
}

// 期限到来 → 間違い → 未学習 → 習得済み の優先順位。
const today = 30000
const due = ENGLISH_WORDS[0]
const wrong = ENGLISH_WORDS[1]
const unseen = ENGLISH_WORDS[2]
const learned = ENGLISH_WORDS[3]
const baseParams = { grade: 1, englishAudioAvailable: false, today, forceForm: 'picture', englishWordStats: {
  [due.id]: { stage: 2, nextDue: today - 1 }, [wrong.id]: { wrong: 2, stage: 0, nextDue: today + 1 }, [learned.id]: { correct: 10, stage: 4, nextDue: today + 14 }
} }
must(generateEnglishQuestion(baseParams).itemKey === `enw:${due.id}`, '期限到来の単語が最優先にならない')
const noDue = { ...baseParams, englishWordStats: { ...baseParams.englishWordStats, [due.id]: { stage: 2, nextDue: today + 1 } } }
must(generateEnglishQuestion(noDue).itemKey === `enw:${wrong.id}`, '間違えた単語が未学習より優先されない')

const progressDay1 = advanceEnglishProgress(null, true, today, 1)
const progressSameDay = advanceEnglishProgress(progressDay1, true, today, 2)
const progressDay2 = advanceEnglishProgress(progressSameDay, true, today + 1, 3)
must(progressDay1.stage === 1 && progressDay1.nextDue === today + 1, '1日後の英語復習を計算できない')
must(progressSameDay.stage === 1, '同じ日に英語の習得段階が複数回進んだ')
must(progressDay2.stage === 2 && progressDay2.nextDue === today + 4, '3日後の英語復習を計算できない')

// 7教科の小3〜小6は、毎日6教科・7日で全教科が一度は出る。
for (let grade = 3; grade <= 6; grade++) {
  const union = new Set()
  for (let day = 40000; day < 40007; day++) {
    const ids = buildCoreMission(grade, day).map((task) => task.domainId)
    must(ids.length === 6 && new Set(ids).size === 6, `小${grade}: 日替わり6教科にならない`)
    ids.forEach((id) => union.add(id))
  }
  must(union.size === 7 && union.has('english'), `小${grade}: 英語を含む7教科ローテーションにならない`)
}

// 古い保存を開いても、今日のミッション・学年・進捗を消さない。
const legacyDaily = { date: '2026-08-11', coreTasks: [{ uid: 'old', domainId: 'english', kind: 'core', questionCount: 4 }], coreIndex: 1, tasksClearedToday: 1 }
const migrated = migrateContentVersion({ version: 3, contentVersion: 11, grade: 3, gradeMax: 5, englishWordStats: { ew001: { stage: 2 } }, unlockedMonsters: ['m001', 'm010'], xp: 77, streak: 4, daily: legacyDaily }, 12)
must(migrated.grade === 3 && migrated.gradeMax === 5 && migrated.englishWordStats.ew001?.stage === 2, '旧保存の学年または英語進捗が消えた')
must(migrated.unlockedMonsters.includes('m010') && migrated.xp === 77 && migrated.streak === 4, '旧保存の報酬が消えた')
must(migrated.daily.coreTasks[0]?.uid === 'old' && migrated.daily.coreIndex === 1, '更新で当日ミッションがリセットされた')

const separated = saveProfileSnapshot({ childB: { name: 'しの', state: { grade: 1, xp: 22, englishWordStats: { ew002: { stage: 3 } } } } }, 'childA', 'しょうだい', { grade: 3, xp: 77, englishWordStats: { ew001: { stage: 2 } }, profiles: { ignored: true } })
must(separated.childA.state.grade === 3 && separated.childA.state.profiles === undefined, 'プロフィール保存が現在の子どもの状態を正しく分離しない')
must(separated.childB.state.grade === 1 && separated.childB.state.englishWordStats.ew002.stage === 3, '別プロフィールの進捗が上書きされた')

console.log(`英語検証OK: ${ENGLISH_WORDS.length}語・${ENGLISH_PHRASES.length}表現、安全な出題・復習・保存移行・7教科ローテーションを確認`)
