// 学習報酬・難易度・連打対策・探索ポイントの唯一の正本。
// 追加チケットは無制限のまま、きんのわ供給と不正判定を分離する。

export const REWARDS = {
  coreTask: {
    label: 'コアタスクを1つクリア（4〜5問）',
    perOccurrence: { star: 1 },
    dailyCap: 5,
  },
  coreAllClear: {
    label: 'その日のコアタスク5つを全部クリア（＝基本ノルマ達成）',
    onceGrant: { ticket: 3, silver: 1, explorePoint: 2 },
  },
  extraTask: {
    label: '追加問題を1つクリア',
    perOccurrence: { ticket: 1, explorePoint: 1 },
    dailyCap: null, // 保護者方針: 追加学習によるチケット獲得は上限なし
  },
  // きんのわは「追加1問ごと」には出さない。
  // 追加問題4問を1セットとして、セット内3問以上正解なら1個。
  extraGoldSet: {
    label: '追加問題4問セットで3問以上正解',
    windowSize: 4,
    minCorrect: 3,
    oncePerWindow: true,
    grant: { gold: 1 },
    dailyCap: null,
  },
  masteryMilestone: {
    label: 'そのskillの習熟度が1段階上がる',
    grant: { explorePoint: 2 },
  },
  weeklyStreak: {
    label: '7日連続で学習した日',
    onceGrant: { moonStone: 1 },
  },
  chapterTest: {
    label: '章末テストに合格',
    onceGrant: { rainbow: 1, explorePoint: 5 },
  },
  areaBossFirstClear: {
    label: 'エリアボスを初めて倒す',
    onceGrant: { rainbow: 1, itemOfArea: 1 },
  },
}

export const DIFFICULTY = {
  windowSize: 8,
  upThreshold: 0.85,
  downThreshold: 0.45,
  minAttemptsBeforeUp: 6,
  // 速度や選択肢位置を単独理由に報酬0にはしない。
  // 疑い判定は複数シグナルの合算で、学習XPは維持し、追加ゲーム報酬だけ一時保留する。
  antiSpam: {
    minimumSignalsToHoldBonus: 2,
    signalWindow: 8,
    signals: {
      veryFastAnswerMs: 650,
      veryFastRatio: 0.75,
      highErrorRatio: 0.55,
      repeatedQuestionRatio: 0.50,
      sameChoiceRatio: 0.80,
      hardQuestionFastRatio: 0.65,
    },
    suspiciousAction: {
      learningXpMultiplier: 1.0,
      holdExtraTicketAndGold: true,
      releaseAfterNormalAnswers: 3,
      uiMessage: 'ゆっくり もんだいを みて 3もん とこう！ できたら ごほうび さいかい！',
    },
  },
}

export const EXPLORATION = {
  pointsPerRun: 5,
  maxRunsPerDay: null, // 学習すれば何度でも探索できる
  rareDropChance: 0.20,
  commonDropChance: 0.80,
  pityRuns: 5, // 地域ごとに5回連続で進化アイテム不発なら、6回目の開始時に1個選べる
  pityScope: 'perArea',
  pityPersist: true,
  pityReward: 'chooseOneEvolutionItemFromArea',
  duplicateHandling: 'inventoryStack',
}


export const AREA_BOSS_UNLOCK = {
  // 1地域につき「意味のある学習進行」を12ポイントためるとボス挑戦可。
  // 重要: progressPoints / uniqueSkillIds は地域別。新地域解放時はその地域を0/空集合で開始し、過去地域の値を流用しない。
  scope: 'perArea',
  resetOnAreaUnlock: true,
  persistByArea: true,
  // 全科目必須にはせず、同一skillの簡単問題反復だけでは稼げない。
  requiredProgressPoints: 12,
  grants: {
    coreTaskFirstClearPerDay: 1,
    masteryMilestone: 2,
    chapterTestFirstClear: 3,
  },
  uniqueSkillMinimum: 2,
  repeatedSameQuestionGrant: 0,
  alreadyMasteredEasyRepeatGrant: 0,
}

export const GROWTH_SHARD = {
  shardsPerUse: 3,
  xpPerUse: 30,
  // 標準学習XP 350/日に対し、重複捕獲3回で30XP。
  // 捕獲には勝利とチケットが必要なため、学習を主要育成手段のまま維持する。
  standardLearningXpPerDay: 350,
}

export function canChallengeAreaBoss({ progressPoints, uniqueSkillCount }) {
  return progressPoints >= AREA_BOSS_UNLOCK.requiredProgressPoints &&
    uniqueSkillCount >= AREA_BOSS_UNLOCK.uniqueSkillMinimum
}

// 探索天井は「欲しい物の登録」を持たない。地域ごとに連続不発回数だけを保存する。
// 5回連続で進化アイテムが出なければ、6回目の探索開始時に選択保証。
// 進化アイテムを通常抽選で得た時、または保証で1個選んだ時に0へ戻る。
export function explorationPityBeforeRun(misses) {
  return misses >= EXPLORATION.pityRuns
}
export function explorationPityAfterRun(misses, { gotEvolutionItem=false, usedPityChoice=false }={}) {
  if (gotEvolutionItem || usedPityChoice) return 0
  return misses + 1
}

if ((process.argv[1] || '').endsWith('rewards.mjs')) {
  console.log(JSON.stringify(REWARDS, null, 1))
  console.log(JSON.stringify(DIFFICULTY, null, 1))
  console.log(JSON.stringify(EXPLORATION, null, 1))
}
