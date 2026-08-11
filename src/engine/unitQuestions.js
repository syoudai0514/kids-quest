import { withLearningUnit } from './learningUnits.js'

// 指定単元から外れない問題を作る。生成器が直接対応しない旧経路だけ再試行する。
export function questionForUnit(domain, params, unitId) {
  if (!unitId) return withLearningUnit(domain.generateQuestion(params, null), params.grade)
  const math = unitId.match(/^math:(.+)$/)
  if (math) return withLearningUnit(domain.generateQuestion(params, `n:${math[1]}`), params.grade)
  const targeted = withLearningUnit(domain.generateQuestion({ ...params, unitId }, null), params.grade)
  if (targeted?.unitId === unitId) return targeted
  let first = null
  for (let i = 0; i < 32; i++) {
    const candidate = withLearningUnit(domain.generateQuestion(params, null), params.grade)
    if (!first) first = candidate
    if (candidate?.unitId === unitId) return candidate
  }
  return first
}
