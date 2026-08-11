import { readFileSync } from 'node:fs'
import { ENGLISH_WORDS, ENGLISH_PHRASES, englishTaskForms, englishTaskItemSlot, generateEnglishQuestion } from '../src/data/content/english.js'
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
const englishPromptForms = new Set(['listen-picture', 'conversation', 'word-meaning', 'spelling'])

must(ENGLISH_WORDS.length >= 200, `単語数が不足: ${ENGLISH_WORDS.length}`)
must(ENGLISH_PHRASES.length >= 50, `会話表現数が不足: ${ENGLISH_PHRASES.length}`)
must(new Set(ENGLISH_WORDS.map((w) => w.id)).size === ENGLISH_WORDS.length, '単語IDが重複')
must(new Set(ENGLISH_PHRASES.map((p) => p.id)).size === ENGLISH_PHRASES.length, '会話IDが重複')
must(new Set(ENGLISH_WORDS.map((w) => w.japanese)).size === ENGLISH_WORDS.length, '日本語の意味が重複')
for (const word of ENGLISH_WORDS) {
  const sameEnglish = ENGLISH_WORDS.filter((other) => other.english === word.english)
  if (sameEnglish.length > 1) {
    const q = generateEnglishQuestion({ grade: 6, englishAudioAvailable: false, forceForm: 'word-meaning', englishWordStats: { [word.id]: { stage: 2, nextDue: 0 } } })
    must(q.visual.text.includes('（'), `${word.english}: 同じ英単語の意味をカテゴリーで限定していない`)
  }
}

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
  if (!englishPromptForms.has(q.form)) {
    must(!q.autoPlayPrompt && !q.promptEnglishAudio, `小${grade}: 回答前に正解音声が流れる (${q.form})`)
  }
  if (['word-meaning', 'spelling'].includes(q.form)) {
    must(q.autoPlayPrompt && q.promptEnglishAudio === q.answerWord?.text, `小${grade}: 文字問題で英語の音が再生されない (${q.form})`)
  }
  if (!audioAvailable) must(!['listen-picture', 'conversation'].includes(q.form), `小${grade}: 音声なしでリスニングが生成された`)
  if (q.form === 'alphabet') {
    must(q.itemKey.startsWith('ena:'), 'アルファベット問題が単語進捗キーを使っている')
    must(!q.practiceEnglish, 'アルファベット問題に無関係な発音練習がある')
  }
  if (q.form === 'spelling' && /\s/.test(q.answerWord?.text || '')) must(/\s/.test(q.visual?.text || ''), '複数語スペルの空白が消えた')
}

// 絵だけで意味が一つに決まらない語は、聞く／絵から英語の教材に混ぜない。
// 例: 🌙=moon と Monday。曜日や重複絵文字は、文字と音で学ぶ。
const pictureSafe = (word) => word.category !== 'time' && ENGLISH_WORDS.filter((other) => other.emoji === word.emoji).length === 1
for (const weekday of ENGLISH_WORDS.filter((word) => word.category === 'time' && /day$/i.test(word.english))) {
  must(weekday.emoji === '📅', `${weekday.english}: 曜日を別の英単語と結び付ける絵で表示している`)
}
for (const word of ENGLISH_WORDS) {
  if (!pictureSafe(word)) continue
  must(word.emoji, `${word.english}: 絵がないのに絵問題の対象になっている`)
}
for (const form of ['listen-picture', 'picture-word']) {
  for (let i = 0; i < 500; i++) {
    const q = generateEnglishQuestion({ grade: 6, englishAudioAvailable: true, forceForm: form })
    const answer = ENGLISH_WORDS.find((word) => `enw:${word.id}` === q.itemKey)
    must(answer && pictureSafe(answer), `${form}: あいまいな絵を教材にした (${answer?.english || q.itemKey})`)
    must(answer.english !== 'Monday', `${form}: 月の絵を Monday と結び付ける問題が生成された`)
  }
}
for (let i = 0; i < 1000; i++) {
  const q = generateEnglishQuestion({ grade: 6, englishAudioAvailable: true })
  if (!['listen-picture', 'picture-word'].includes(q.form)) continue
  const answer = ENGLISH_WORDS.find((word) => `enw:${word.id}` === q.itemKey)
  must(answer && pictureSafe(answer), `${q.form}: 通常出題であいまいな絵を教材にした (${answer?.english || q.itemKey})`)
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

// タスク開始時に4問の形式を確定し、学年別の必須経験を保証する。
const expectedPlans = {
  0: ['listen-picture', 'picture-word', 'word-meaning', 'alphabet'],
  1: ['listen-picture', 'picture-word', 'word-meaning', 'spelling'],
  3: ['listen-picture', 'picture-word', 'conversation', 'word-order'],
  5: ['listen-picture', 'word-meaning', 'conversation', 'word-order']
}
for (const [grade, plan] of Object.entries(expectedPlans)) {
  must(JSON.stringify(englishTaskForms(Number(grade), true)) === JSON.stringify(plan), `小${grade}: 音声あり4問構成が不正`)
  const seenPlan = []
  for (const form of plan) {
    const q = generateEnglishQuestion({ grade: Number(grade), taskForm: form, englishAudioAvailable: true, seenItemKeys: seenPlan })
    verifyQuestion(q, Number(grade), true)
    seenPlan.push(q.itemKey)
  }
}

// 通常の4問は、同じ語を3回続けず「Aを2形式、Bを2形式」にする。
// 年長のアルファベットは単語とは別の3枠目として扱う。
for (const grade of [0, 1, 3, 5, 6]) {
  const plan = englishTaskForms(grade, true)
  const slots = plan.map((_, index) => englishTaskItemSlot(plan, index))
  must(slots[0] === slots[1], `小${grade}: 最初の語を2形式で練習できない`)
  must(slots[2] !== slots[1], `小${grade}: 同じ項目が3問連続する計画`)
  if (plan[3] !== 'alphabet') must(slots[2] === slots[3], `小${grade}: 後半の項目を2形式で練習できない`)

  const itemBySlot = {}
  const seenItems = []
  const generatedKeys = plan.map((form, index) => {
    const slot = slots[index]
    const reviewKey = itemBySlot[slot]
    const q = generateEnglishQuestion({ grade, englishAudioAvailable: true, taskForm: form, reviewKey, seenItemKeys: seenItems }, reviewKey)
    if (!reviewKey) {
      itemBySlot[slot] = q.itemKey
      seenItems.push(q.itemKey)
    }
    return q.itemKey
  })
  must(!generatedKeys.some((key, index) => index >= 2 && key === generatedKeys[index - 1] && key === generatedKeys[index - 2]), `小${grade}: 実生成で同じ英語項目が3問連続 ${generatedKeys.join(',')}`)
}

// 正解後の発音チャレンジは進行を止めず、英文は日本語ナビを挟まず直接再生する。
const activitySource = readFileSync(new URL('../src/screens/ActivityPlayer.jsx', import.meta.url), 'utf8')
const visualSource = readFileSync(new URL('../src/components/QuestionVisual.jsx', import.meta.url), 'utf8')
must(!activitySource.includes("setPhase(needsSpeaking ? 'practice'"), '正解後に発音チャレンジで進行を止めている')
must(activitySource.includes("phase === 'answering' && question.autoPlayPrompt && question.practiceEnglish"), '発音チャレンジが回答前の任意操作になっていない')
must(activitySource.includes("disabled={phase !== 'answering' || wrongIds.includes(choice.id)}"), '採点後も回答ボタンが押せるように見える')
must(!activitySource.includes("speak('よく きいてね').then") && !visualSource.includes("speak('もういちど、よく きいてね').then"), '英文の前に日本語音声を挟んでいる')
for (const grade of [0, 1, 3, 5, 6]) {
  const plan = englishTaskForms(grade, false)
  must(!plan.some((form) => ['listen-picture', 'conversation'].includes(form)), `小${grade}: 音声OFFで音声形式を計画した`)
  if (grade >= 5) must(plan.includes('word-order'), `小${grade}: 音声OFFで語順問題がない`)
  const seenPlan = []
  for (const form of plan) {
    const q = generateEnglishQuestion({ grade, taskForm: form, englishAudioAvailable: false, seenItemKeys: seenPlan })
    verifyQuestion(q, grade, false)
    must(!seenPlan.includes(q.itemKey), `小${grade}: 音声OFFの4問で項目が重複`)
    seenPlan.push(q.itemKey)
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
must(generateEnglishQuestion(noDue).itemKey !== `enw:${wrong.id}`, '未学習単語が期限前の誤答項目より優先されない')

// 語順は問い掛けの意味と同じ英文を並べる。会話だけが response を答えにする。
const howAreYou = ENGLISH_PHRASES.find((p) => p.english === 'How are you?')
const nameQuestion = ENGLISH_PHRASES.find((p) => p.english === 'What is your name?')
for (const phrase of [howAreYou, nameQuestion]) {
  const q = generateEnglishQuestion({ grade: 5, today, englishAudioAvailable: true, forceForm: 'word-order', englishPhraseStats: { [phrase.id]: { stage: 2, nextDue: today - 1 } } })
  const answer = q.correctOrder.map((id) => q.items.find((item) => item.id === id).label).join(' ')
  must(answer === phrase.english.replace(/[.!?]/g, ''), `語順問題が ${phrase.japanese} の英文になっていない`)
}
for (const phrase of ENGLISH_PHRASES) {
  const q = generateEnglishQuestion({ grade: 6, today, englishAudioAvailable: true, forceForm: 'conversation', englishPhraseStats: { [phrase.id]: { stage: 2, nextDue: today - 1 } } })
  must(q.choices.filter((c) => c.id === q.answerId).length === 1, '会話の正解が一つに定まらない')
  must(new Set(q.choices.map((c) => c.label)).size === q.choices.length, '会話選択肢の表示文言が重複')
}

const progressDay1 = advanceEnglishProgress(null, true, today, 1)
const progressSameDay = advanceEnglishProgress(progressDay1, true, today, 2)
const progressDay2 = advanceEnglishProgress(progressSameDay, true, today + 1, 3)
must(progressDay1.stage === 1 && progressDay1.nextDue === today + 1, '1日後の英語復習を計算できない')
must(progressSameDay.stage === 1, '同じ日に英語の習得段階が複数回進んだ')
must(progressDay2.stage === 2 && progressDay2.nextDue === today + 4, '3日後の英語復習を計算できない')
let p = progressDay2
for (const day of [today + 4, today + 11]) p = advanceEnglishProgress(p, true, day)
must(p.stage === 4 && !p.masteredAt, '14日後の確認前に英語が習得扱いになった')
p = advanceEnglishProgress(p, true, today + 25)
must(p.stage === 5 && p.masteredAt, '14日後確認後に英語が習得扱いにならない')

// 小3〜小6も、国語・算数を毎日、道徳は週2回、他教科を週内で回す。
for (let grade = 3; grade <= 6; grade++) {
  const union = new Set()
  let moral = 0
  for (let day = 40000; day < 40007; day++) {
    const ids = buildCoreMission(grade, day).map((task) => task.domainId)
    must(ids.length === 5 && new Set(ids).size === 5 && ids.includes('yomu') && ids.includes('suuji'), `小${grade}: 重み付き5教科にならない`)
    moral += ids.filter((id) => id === 'doutoku').length
    ids.forEach((id) => union.add(id))
  }
  must(union.size === 7 && union.has('english') && moral === 2, `小${grade}: 英語を含む週次ローテーションにならない`)
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
const profileA = { grade: 3, unlockedMonsters: ['m001', 'm020'], daily: legacyDaily, englishWordStats: { ew001: { stage: 2 } }, englishPhraseStats: { ep001: { stage: 1 } }, englishAlphabetStats: { 'A-B': { stage: 1 } } }
const profileB = { grade: 0, unlockedMonsters: ['m002'], daily: { ...legacyDaily, coreIndex: 0 }, englishWordStats: { ew002: { stage: 3 } }, englishPhraseStats: { ep002: { stage: 2 } }, englishAlphabetStats: { 'B-C': { stage: 1 } } }
const profilesAfterSwitch = saveProfileSnapshot(saveProfileSnapshot({}, 'childA', 'A', profileA), 'childB', 'B', profileB)
const reloadedProfiles = JSON.parse(JSON.stringify(profilesAfterSwitch))
must(reloadedProfiles.childA.state.grade === 3 && reloadedProfiles.childA.state.englishPhraseStats.ep001.stage === 1 && reloadedProfiles.childA.state.daily.coreIndex === 1, 'プロフィールAの保存・再読み込みに失敗')
must(reloadedProfiles.childB.state.grade === 0 && reloadedProfiles.childB.state.englishWordStats.ew002.stage === 3 && reloadedProfiles.childB.state.englishAlphabetStats['B-C'].stage === 1, 'プロフィールBの保存・再読み込みに失敗')

console.log(`英語検証OK: ${ENGLISH_WORDS.length}語・${ENGLISH_PHRASES.length}表現、安全な出題・復習・保存移行・7教科ローテーションを確認`)
