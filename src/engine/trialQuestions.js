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
    // 同じ単元でもgeneratorが複数形式を返すことがある。試練画面が採点できる
    // choice / trace が出るまで少数回だけ再生成し、1回の不適合で6問全体を欠損させない。
    for (let attempt = 0; attempt < 6; attempt++) {
      const params = { ...difficultyParams(state.skills?.[grade]?.[domain.id] || {}), grade, unitId }
      const mathKind = unitId?.match(/^math:(.+)$/)?.[1]
      const generated = domain.generateQuestion(params, mathKind ? `n:${mathKind}` : null)
      if (!generated) continue
      const enriched = withQuestionIds(withLearningUnit(forceWriting ? { ...generated, stage: 'free' } : generated, grade))
      if (enriched.unitId !== unitId) continue
      if (forceWriting) {
        if (enriched.type === 'trace') return enriched
        continue
      }
      if (enriched.type === 'choice' && enriched.choices?.length) return enriched
    }
    return null
  }

  const orderedUnits = (domainId) => {
    const units = unitLedger(grade).filter((entry) => entry.domainId === domainId).map((entry) => entry.unitId)
    return shuffle(units).sort((a, b) =>
      Number(usedUnits.has(a)) - Number(usedUnits.has(b)) ||
      Number(previousUnits.has(a)) - Number(previousUnits.has(b))
    )
  }

  const makeForDomain = (domain, forceWriting = false) => {
    for (const unitId of orderedUnits(domain.id)) {
      const question = makeForUnit(domain, unitId, forceWriting)
      if (question) return question
    }
    return null
  }

  for (let i = 0; i < questionCount - 1 && order.length; i++) {
    const domain = order[i % order.length]
    const question = makeForDomain(domain)
    if (question) { usedUnits.add(question.unitId); list.push({ ...question, _domainId: domain.id }) }
  }

  const writing = domains.find((domain) => domain.id === 'kaku')
  if (writing) {
    const question = makeForDomain(writing, true)
    if (question) { usedUnits.add(question.unitId); list.push({ ...question, _domainId: writing.id }) }
  }

  // 補充は1つの不適合domainでbreakしない。全domain/単元を巡回し、
  // 6問契約を満たすまで別の採点可能問題を探す。
  let refillAttempt = 0
  const maxRefillAttempts = Math.max(24, questionCount * Math.max(1, choiceDomains.length) * 4)
  while (list.length < questionCount && choiceDomains.length && refillAttempt < maxRefillAttempts) {
    const domain = choiceDomains[refillAttempt % choiceDomains.length]
    const question = makeForDomain(domain)
    refillAttempt += 1
    if (!question) continue
    usedUnits.add(question.unitId)
    list.push({ ...question, _domainId: domain.id })
  }
  return shuffle(list).slice(0, questionCount)
}
