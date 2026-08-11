// ============================================================
// バトルチケット
//
// 日付をまたいでも、がんばって取ったごほうびが消えないようにする。
// ただし無期限にためこまないよう、獲得から7日後までの期限を持たせる。
// ============================================================

export const BATTLE_TICKET_TTL_DAYS = 7

function dateFromKey(dateKey) {
  return new Date(`${dateKey}T12:00:00`)
}

export function dateKeyAfter(dateKey, days) {
  const date = dateFromKey(dateKey)
  date.setDate(date.getDate() + days)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function validTicket(ticket, today) {
  return ticket && typeof ticket.expiresOn === 'string' && ticket.expiresOn >= today
}

/**
 * 旧セーブの数値チケットも、初回読込時に失わず期限付きチケットへ移す。
 * 期限情報が壊れているチケットも、保存済みのごほうびを消さないため今日から7日間残す。
 */
export function normalizeBattleTickets(battle = {}, today) {
  const legacyCount = Math.max(0, Number.isFinite(battle.tickets) ? Math.floor(battle.tickets) : 0)
  const hasTicketGrants = Array.isArray(battle.ticketGrants)
  const existing = hasTicketGrants
    ? battle.ticketGrants.filter((ticket) => validTicket(ticket, today))
    : []
  // ticketGrants がある新形式では、期限切れを tickets の古い数値から復活させない。
  const missing = hasTicketGrants ? 0 : legacyCount
  const migrated = Array.from({ length: missing }, () => ({
    earnedOn: today,
    expiresOn: dateKeyAfter(today, BATTLE_TICKET_TTL_DAYS),
    migrated: true
  }))
  const ticketGrants = [...existing, ...migrated]
  return { ...battle, tickets: ticketGrants.length, ticketGrants }
}

export function grantBattleTicket(battle, today) {
  const current = normalizeBattleTickets(battle, today)
  const ticket = { earnedOn: today, expiresOn: dateKeyAfter(today, BATTLE_TICKET_TTL_DAYS) }
  const ticketGrants = [...current.ticketGrants, ticket]
  return { ...current, tickets: ticketGrants.length, ticketGrants }
}

/** 期限が近いチケットから使う。 */
export function spendBattleTicket(battle, today) {
  const current = normalizeBattleTickets(battle, today)
  if (!current.ticketGrants.length) return current
  const ticketGrants = [...current.ticketGrants]
    .sort((a, b) => a.expiresOn.localeCompare(b.expiresOn))
    .slice(1)
  return { ...current, tickets: ticketGrants.length, ticketGrants }
}
