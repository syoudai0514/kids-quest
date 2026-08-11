import { ENGLISH_WORDS, ENGLISH_PHRASES, generateEnglishQuestion } from '../src/data/content/english.js'
import { domainsForGrade } from '../src/engine/activities.js'
import { buildCoreMission } from '../src/engine/missions.js'

const fail = (message) => { throw new Error(message) }
if (ENGLISH_WORDS.length < 200) fail(`単語数が不足: ${ENGLISH_WORDS.length}`)
if (ENGLISH_PHRASES.length < 50) fail(`会話表現数が不足: ${ENGLISH_PHRASES.length}`)
if (new Set(ENGLISH_WORDS.map((w) => w.id)).size !== ENGLISH_WORDS.length) fail('単語IDが重複')
for (let grade = 0; grade <= 6; grade++) {
  if (!domainsForGrade(grade).some((d) => d.id === 'english')) fail(`小${grade}: えいごが未登録`)
  for (let i = 0; i < 80; i++) {
    const q = generateEnglishQuestion({ grade, choiceCount: 4, englishAudioAvailable: i % 2 === 0 })
    if (!q.choices.some((choice) => choice.id === q.answerId)) fail(`小${grade}: 正解選択肢なし`)
    if (new Set(q.choices.map((choice) => choice.id)).size !== q.choices.length) fail(`小${grade}: 選択肢重複`)
  }
  const tasks = buildCoreMission(grade)
  if (tasks.length > 6 || new Set(tasks.map((t) => t.domainId)).size !== tasks.length) fail(`小${grade}: ミッション重複または上限超過`)
}
console.log(`英語検証OK: ${ENGLISH_WORDS.length}語・${ENGLISH_PHRASES.length}表現、年長〜小6、ミッション上限を確認`)
