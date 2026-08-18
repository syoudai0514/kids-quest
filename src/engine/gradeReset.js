// 保護者が学年を下げるときの、進級判定と当日ミッションの整合を保つ。
// 学習の履歴・報酬は消さず、「その先の学年を合格した」という資格だけを戻す。

import { buildCoreMission } from './missions.js'

function progressionBelow(records, gradeMax) {
  return Object.fromEntries(
    Object.entries(records || {}).filter(([grade]) => Number(grade) < gradeMax)
  )
}

export function freshDailyMission(date, grade = 0) {
  return {
    date,
    coreTasks: buildCoreMission(grade),
    coreIndex: 0,
    coreDone: false,
    tasksClearedToday: 0,
    correctToday: 0,
    attemptsToday: 0,
    perDomainToday: {},
    ticketsEarnedToday: 0,
    battleUnlocks: [],
    okawariIndex: 0,
    extraIndex: 0
  }
}

export function lowerGradeProgress(state, requestedGradeMax) {
  const gradeMax = Math.max(0, Math.min(state.gradeMax, requestedGradeMax))
  if (gradeMax === state.gradeMax) return state
  const grade = Math.min(state.grade, gradeMax)
  // 学年えらびの下限（保護者設定）が新しいgradeMaxより上だと、選べる学年が
  // 1つも無くなってしまう。gradeMaxを下げたら下限も追従して引き下げる。
  const minSelectableGrade = Math.min(state.settings?.minSelectableGrade ?? 0, gradeMax)
  return {
    ...state,
    gradeMax,
    grade,
    settings: { ...state.settings, minSelectableGrade },
    // gradeMax と同じ学年の合格も消す。残すと、戻した直後に次の学年を再解放できてしまう。
    testPassed: progressionBelow(state.testPassed, gradeMax),
    starTrials: progressionBelow(state.starTrials, gradeMax),
    pendingGradeUp: state.pendingGradeUp != null && state.pendingGradeUp >= gradeMax ? null : state.pendingGradeUp,
    // 教科構成・進み具合・当日統計を同じ学年にそろえる。報酬や学習履歴には触れない。
    daily: freshDailyMission(state.daily?.date, grade)
  }
}
