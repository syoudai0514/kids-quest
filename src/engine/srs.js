// ============================================================
// 間隔反復（かんかくはんぷく）— ライトナー方式
//
// ねらい:
//   これまでは「まちがえた問題」を溜めて 35%の確率で ランダムに
//   再出題するだけだった。これだと 忘れかけた ちょうどよい
//   タイミングで 出会えないので、覚えても また忘れてしまう。
//
//   そこで「正解するたびに 次に会う日を のばしていく」方式にする。
//     1日後 → 3日後 → 1週間後 → 2週間後 → 1か月後
//   まちがえたら いちばん最初（その日のうち）に もどす。
//   これで「一度おぼえたものを 忘れない」状態を作る。
//
// データの形:
//   srs = { [domainId]: { [itemKey]: { box, due, lapses } } }
//     box   : 0〜5。大きいほど よく身についている
//     due   : 次に出す日（1970-01-01からの通算日数）
//     lapses: まちがえた回数（にがて度の目安）
// ============================================================

// box ごとの「次に会うまでの日数」
export const BOX_DAYS = [0, 1, 3, 7, 14, 30]
export const MAX_BOX = BOX_DAYS.length - 1

/** ローカル時間の「通算日数」。todayKey() と同じ 深夜0時 区切り。 */
export function dayNumber(d = new Date()) {
  // getTimezoneOffset を引いてから割ることで、ローカル日付で切り替わる
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.floor(local.getTime() / 86400000)
}

export function makeEntry(today = dayNumber()) {
  return { box: 0, due: today, lapses: 0 }
}

/**
 * 1回の解答を反映して、次にいつ出すかを決める。
 * @returns {{entry: object, mastered: boolean}} mastered = 最高boxに到達した瞬間
 */
export function scheduleNext(entry, correct, today = dayNumber()) {
  const cur = entry || makeEntry(today)
  if (!correct) {
    // まちがえたら いちばん最初にもどす（その日のうちに もう一度）
    return {
      entry: { box: 0, due: today, lapses: (cur.lapses || 0) + 1 },
      mastered: false
    }
  }
  const box = Math.min(MAX_BOX, (cur.box || 0) + 1)
  return {
    entry: { box, due: today + BOX_DAYS[box], lapses: cur.lapses || 0 },
    mastered: box >= MAX_BOX && (cur.box || 0) < MAX_BOX
  }
}

// 期限前の同日連打では箱を進めない。初回・期限到来・誤答だけを更新する。
export function scheduleAnswer(entry, correct, today = dayNumber()) {
  if (correct && entry && !isDue(entry, today)) return { entry, mastered: false, advanced: false }
  return { ...scheduleNext(entry, correct, today), advanced: true }
}

/** きょう出すべきか（期限が来ているか） */
export function isDue(entry, today = dayNumber()) {
  return !!entry && (entry.due ?? 0) <= today
}

/** その教科で きょう復習する itemKey の一覧（期限が古い順） */
export function dueKeys(srs, domainId, today = dayNumber(), limit = Infinity) {
  const byKey = (srs && srs[domainId]) || {}
  return Object.entries(byKey)
    .filter(([, e]) => isDue(e, today))
    .sort((a, b) => (a[1].due ?? 0) - (b[1].due ?? 0))
    .slice(0, limit)
    .map(([k]) => k)
}

/** 全教科ぶん。[{domainId, key, entry}] を期限が古い順で返す */
export function dueEntries(srs, today = dayNumber(), limit = Infinity) {
  const out = []
  for (const [domainId, byKey] of Object.entries(srs || {})) {
    for (const [key, entry] of Object.entries(byKey || {})) {
      if (isDue(entry, today)) out.push({ domainId, key, entry })
    }
  }
  out.sort((a, b) => (a.entry.due ?? 0) - (b.entry.due ?? 0))
  return limit === Infinity ? out : out.slice(0, limit)
}

/** きょう復習する問題の数 */
export function dueCount(srs, today = dayNumber()) {
  let n = 0
  for (const byKey of Object.values(srs || {})) {
    for (const e of Object.values(byKey || {})) if (isDue(e, today)) n++
  }
  return n
}

/** box ごとの件数（おうちの人画面の定着状況グラフ用） */
export function boxCounts(srs) {
  const counts = new Array(MAX_BOX + 1).fill(0)
  for (const byKey of Object.values(srs || {})) {
    for (const e of Object.values(byKey || {})) {
      counts[Math.min(MAX_BOX, Math.max(0, e.box || 0))]++
    }
  }
  return counts
}

/** 次の復習は何日後か（期限切れが無いときの案内用）。無ければ null */
export function daysUntilNext(srs, today = dayNumber()) {
  let min = Infinity
  for (const byKey of Object.values(srs || {})) {
    for (const e of Object.values(byKey || {})) {
      const d = (e.due ?? 0) - today
      if (d > 0 && d < min) min = d
    }
  }
  return min === Infinity ? null : min
}

/** 旧セーブの missed（配列）を srs に取り込む。進捗を失わせない。 */
export function migrateMissed(missed, today = dayNumber()) {
  const srs = {}
  for (const [domainId, keys] of Object.entries(missed || {})) {
    if (!Array.isArray(keys)) continue
    srs[domainId] = {}
    for (const key of keys) {
      srs[domainId][key] = { box: 0, due: today, lapses: 1 }
    }
  }
  return srs
}
