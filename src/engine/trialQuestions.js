import { domainsForGrade } from './activities.js'
import { difficultyParams } from './difficulty.js'
import { unitLedger, withLearningUnit } from './learningUnits.js'
import { withQuestionIds } from './reviewKey.js'

function shuffle(items) {
  const list = [...items]
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}

// 英語・道徳を除外し、主要教科と異なる単元を二日間で層化して選ぶ。
export function makeTrialQuestions(state, grade, questionCount = 6) {
  const domains = domainsForGrade(grade)
  const choiceDomains = domains.filter((domain) => !['kaku', 'doutoku', 'english'].includes(domain.id))
  const list = []
  const usedUnits = new Set()
  const previousUnits = new Set(state.starTrials?.[grade]?.rounds?.at(-1)?.unitIds || [])
  const order = shuffle(choiceDomains)

  const makeForUnit = (domain, unitId, forceWriting = false) => {
    const params = { ...difficultyParams(state.skills?.[grade]?.[domain.id] || {}), grade, unitId }
    const mathKind = unitId?.match(/^math:(.+)$/)?.[1]
    const generated = domain.generateQuestion(params, mathKind ? `n:${mathKind}` : null)
    if (!generated) return null
    const enriched = withQuestionIds(withLearningUnit(forceWriting ? { ...generated, stage: 'free' } : generated, grade))
    if (enriched.unitId !== unitId) return null
    if (forceWriting) return enriched.type === 'trace' ? enriched : null
    return enriched.type === 'choice' && enriched.choices?.length ? enriched : null
  }

  const chooseUnit = (domainId) => {
    const units = unitLedger(grade).filter((entry) => entry.domainId === domainId).map((entry) => entry.unitId)
    return shuffle(units).sort((a, b) => Number(previousUnits.has(a)) - Number(previousUnits.has(b)))
      .find((unitId) => !usedUnits.has(unitId)) || units[0]
  }

  for (let i = 0; i < questionCount - 1; i++) {
    const domain = order[i % order.length]
    const unitId = chooseUnit(domain.id)
    const question = makeForUnit(domain, unitId)
    if (question) { usedUnits.add(question.unitId); list.push({ ...question, _domainId: domain.id }) }
  }

  const writing = domains.find((domain) => domain.id === 'kaku')
  if (writing) {
    const unitId = chooseUnit(writing.id)
    const question = makeForUnit(writing, unitId, true)
    if (question) { usedUnits.add(question.unitId); list.push({ ...question, _domainId: writing.id }) }
  }

  while (list.length < questionCount && choiceDomains.length) {
    const domain = choiceDomains[list.length % choiceDomains.length]
    const unitId = chooseUnit(domain.id)
    const question = makeForUnit(domain, unitId)
    if (!question) break
    usedUnits.add(question.unitId)
    list.push({ ...question, _domainId: domain.id })
  }
  return shuffle(list).slice(0, questionCount)
}
