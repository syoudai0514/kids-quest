// コンテンツ追加時に、全学年・全教科が実際に問題を作れるかを確認する。
// Luna のような軽量エージェントがデータだけを増やしても、壊れた設問を
// 公開へ持ち込まないための最小ゲート。外部サービスや乱数シードは不要。
import { domainsForGrade } from '../src/engine/activities.js'

const errors = []
const SAMPLE_COUNT = 40

function requireValue(condition, message) {
  if (!condition) errors.push(message)
}

for (let grade = 0; grade <= 6; grade++) {
  for (const domain of domainsForGrade(grade)) {
    for (const choiceCount of [3, 4]) {
      for (let n = 0; n < SAMPLE_COUNT; n++) {
        let question
        try {
          question = domain.generateQuestion({ grade, choiceCount, level: 1 })
        } catch (error) {
          errors.push(`小${grade} ${domain.id}: 問題生成で例外: ${error.message}`)
          continue
        }

        const label = `小${grade} ${domain.id} ${question?.itemKey ?? '(itemKeyなし)'}`
        requireValue(question?.domain === domain.id, `${label}: domain が不正`)
        requireValue(typeof question?.type === 'string' && question.type, `${label}: type がない`)
        requireValue(typeof question?.itemKey === 'string' && question.itemKey, `${label}: itemKey がない`)
        requireValue(typeof question?.instruction === 'string' && question.instruction, `${label}: 問題文がない`)

        if (question?.type === 'choice') {
          const choices = question.choices ?? []
          const ids = choices.map((choice) => choice.id)
          // 「どちらがおおい？」と「ごぜん/ごご」は、意図的に2択。
          // それ以外のchoiceは最低3択を維持する。
          const minimumChoices = ['n:compareCards', 's:amPm'].includes(question.itemKey) ? 2 : Math.min(3, choiceCount)
          requireValue(choices.length >= minimumChoices, `${label}: 選択肢が足りない`)
          requireValue(new Set(ids).size === ids.length, `${label}: 選択肢が重複`)
          requireValue(ids.includes(question.answerId), `${label}: 正解が選択肢にない`)
        }
      }
    }
  }
}

if (errors.length) {
  console.error(`コンテンツ検証失敗 (${errors.length}件)`)
  for (const error of errors.slice(0, 30)) console.error(`- ${error}`)
  process.exit(1)
}

console.log('コンテンツ検証OK: 年長〜小6、全教科・3択/4択の問題生成を確認')
