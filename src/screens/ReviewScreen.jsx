// ============================================================
// とっくん（復習）画面 — 「まちがいは たからもの」
//
// v2: 間隔反復に対応。
//   ここに出るのは「きょうが 復習の期限」の問題だけ。
//   正解すると 次に会う日が のびていく（1→3→7→14→30日）ので、
//   だんだん出てこなくなる ＝ 身についた しるし。
//
// 「まちがいから おぼえた数」を大きく見せて、
// 失敗するほど知っていることが増える、を体感させる。
// ============================================================

import React, { useEffect } from 'react'
import { useGame, missedCount, REVIEW_BATCH_MAX } from '../state/GameContext.jsx'
import { DOMAIN_BY_ID, domainName } from '../engine/activities.js'
import { dueEntries, daysUntilNext, boxCounts, MAX_BOX } from '../engine/srs.js'
import { KIND_LABELS } from '../data/content/numbers.js'
import { SEIKATSU_LABELS } from '../data/content/seikatsu.js'
import { Starfield } from '../components/common.jsx'
import { speak } from '../engine/tts.js'
import { sfx } from '../engine/sfx.js'

// 長い問題文は 子どもが見て わかる長さに切る
function short(text, n = 14) {
  const t = String(text).replace(/\s+/g, '')
  return t.length > n ? t.slice(0, n) + '…' : t
}

// itemKey → 子ども向けの表示
function labelOf(domainId, key) {
  if (domainId === 'yomu') {
    if (key.startsWith('j:')) return { big: key.slice(2), sub: 'じゅくご' }
    if (key.startsWith('k:')) return { big: key.slice(2), sub: 'かんじ' }
    if (key.startsWith('w:')) return { big: key.slice(2), sub: 'ことば' }
  }
  if (domainId === 'kaku') return { big: key, sub: 'かく' }
  if (domainId === 'suuji' && key.startsWith('n:')) {
    return { big: '🔢', sub: KIND_LABELS[key.slice(2)] || 'さんすう' }
  }
  if (domainId === 'seikatsu' && key.startsWith('s:')) {
    return { big: '📅', sub: SEIKATSU_LABELS[key.slice(2)] || 'せいかつ' }
  }
  if (domainId === 'rika' && key.startsWith('r:')) return { big: '🔬', sub: short(key.slice(2)) }
  if (domainId === 'shakai' && key.startsWith('c:')) return { big: '🗾', sub: short(key.slice(2)) }
  if (domainId === 'doutoku' && key.startsWith('d:')) return { big: '💗', sub: short(key.slice(2)) }
  return { big: '❓', sub: '' }
}

export default function ReviewScreen({ onBack, onStartTask }) {
  const { state } = useGame()
  const count = missedCount(state)
  const items = dueEntries(state.srs)
  const nextInDays = daysUntilNext(state.srs)
  const boxes = boxCounts(state.srs)
  const learning = boxes.slice(0, MAX_BOX).reduce((a, b) => a + b, 0)

  useEffect(() => {
    if (count === 0) {
      speak(
        nextInDays
          ? `すごい！ きょう ふくしゅうする もんだいは ないよ。つぎの ふくしゅうは ${nextInDays}にちごに でてくるね`
          : `すごい！ いまは ぜんぶ おぼえてるよ。きみは まちがいから ${state.conquered}こも おぼえたんだ！`
      )
    } else {
      speak(
        `とっくんの じかん！ きょう ふくしゅうすると いい もんだいが ${count}こ あるよ。わすれる まえに もういちど やろう！`
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const start = () => {
    sfx.swoosh()
    // 期限の古い順に、多すぎない数だけ（心が折れないように）
    const plan = items.slice(0, REVIEW_BATCH_MAX).map(({ domainId, key }) => ({ domainId, key }))
    onStartTask({
      uid: `review_${Date.now()}`,
      kind: 'review',
      domainId: plan[0].domainId,
      questionCount: plan.length,
      plan
    })
  }

  return (
    <div className="screen screen-in">
      <Starfield />
      <div className="topbar">
        <button className="btn btn--ghost" style={{ minHeight: 60 }} onClick={onBack}>
          🏠 もどる
        </button>
        <div className="topbar__title">🎯 とっくん</div>
        <div className="pill">⚡ {state.conquered}</div>
      </div>

      <div className="center-col scroll-col">
        {/* 「失敗から学んだ数」を主役に */}
        <div className="conquer-counter">
          <div className="conquer-counter__num">{state.conquered}</div>
          <div className="conquer-counter__label">まちがいから おぼえた かず</div>
        </div>

        {count === 0 ? (
          <div className="card" style={{ textAlign: 'center', width: 'min(560px,92vw)' }}>
            <div style={{ fontSize: 60 }}>🏆</div>
            <div style={{ fontWeight: 900, fontSize: 'clamp(18px,3.4vw,26px)', margin: '8px 0' }}>
              きょうの ふくしゅうは かんりょう！
            </div>
            <div className="muted" style={{ fontWeight: 700, lineHeight: 1.6 }}>
              {nextInDays ? (
                <>
                  つぎの ふくしゅうは <b>{nextInDays}にちご</b>に でてくるよ。
                  <br />
                  わすれた ころに もういちど 出すから、
                  <br />
                  だんだん わすれなく なるんだ！
                </>
              ) : (
                <>
                  まちがえたら ここに あつまるよ。
                  <br />
                  まちがいは あたらしく おぼえられる チャンス！
                </>
              )}
            </div>
            {learning > 0 && (
              <div className="pill" style={{ marginTop: 12 }}>
                おぼえかけ {learning}こ ／ かんぺき {boxes[MAX_BOX]}こ
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="muted" style={{ fontWeight: 800, fontSize: 'clamp(14px,2.6vw,18px)', textAlign: 'center', lineHeight: 1.6 }}>
              きょう ふくしゅうする もんだい <b>{count}こ</b>
              <br />
              <span style={{ fontSize: 13 }}>
                せいかいすると、つぎは もっと あとに でてくるよ（1→3→7→14→30日）
              </span>
            </div>
            <div className="seed-grid">
              {items.slice(0, 12).map(({ domainId, key, entry }) => {
                const l = labelOf(domainId, key)
                const dom = DOMAIN_BY_ID[domainId]
                return (
                  <div key={`${domainId}:${key}`} className="seed-card">
                    <span className="seed-card__big">{l.big}</span>
                    <span className="seed-card__sub">
                      {dom?.emoji} {l.sub}
                    </span>
                    <span className="seed-card__sub" style={{ opacity: 0.75 }}>
                      {'★'.repeat(entry.box || 0) || '・'}
                    </span>
                  </div>
                )
              })}
            </div>
            <button className="btn btn--sun btn--big" onClick={start}>
              ⚡ とっくん スタート！（{Math.min(count, REVIEW_BATCH_MAX)}もん）
            </button>
          </>
        )}
      </div>
    </div>
  )
}
