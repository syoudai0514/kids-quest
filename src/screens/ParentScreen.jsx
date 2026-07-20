// ============================================================
// 保護者向けビュー（おまけ）
//  - 今日やった量、得意/苦手の傾向、息抜き解放（チケット）の回数。
//  - 音声・効果音の ON/OFF、データのリセット。
//  - すべて端末内にのみ保存（プライバシー説明つき）。
// ============================================================

import React, { useState } from 'react'
import { useGame, skillOf } from '../state/GameContext.jsx'
import { DOMAINS } from '../engine/activities.js'
import { trendLabel } from '../engine/difficulty.js'
import { setTtsEnabled } from '../engine/tts.js'
import { setSfxEnabled } from '../engine/sfx.js'
import { setBgmEnabled } from '../engine/bgm.js'
import { serializeForExport, parseImport } from '../engine/storage.js'
import { GRADES, MAX_GRADE, gradeOf } from '../data/grades.js'

function downloadText(filename, text) {
  try {
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1500)
    return true
  } catch (_) {
    return false
  }
}

// 機種変更のための「データひきつぎ」（バックアップ書き出し／読み込み）
function DataMigration({ state, dispatch, onBack }) {
  const [mode, setMode] = useState(null) // null | 'export' | 'import'
  const [importText, setImportText] = useState('')
  const [confirmImport, setConfirmImport] = useState(false)
  const [msg, setMsg] = useState(null) // {ok, text}

  const exportText = serializeForExport(state)
  const stamp = new Date().toISOString().slice(0, 10)

  const doDownload = () => {
    const ok = downloadText(`hoshizora-quest-${stamp}.json`, exportText)
    setMsg(ok ? { ok: true, text: 'ファイルを ほぞんしました（ダウンロード）' } : { ok: false, text: 'ダウンロードできませんでした。下のコードを コピーして ほかんしてください' })
  }
  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportText)
      setMsg({ ok: true, text: 'コードを コピーしました。メモやメールに はりつけて ほかんしてください' })
    } catch (_) {
      setMsg({ ok: false, text: 'コピーできませんでした。下のコードを 手で えらんで コピーしてください' })
    }
  }
  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    try {
      const text = await f.text()
      setImportText(text)
      setMsg({ ok: true, text: 'ファイルを よみこみました。「このデータで ひきつぐ」を おしてください' })
    } catch (_) {
      setMsg({ ok: false, text: 'ファイルを ひらけませんでした' })
    }
    e.target.value = ''
  }
  const doImport = () => {
    let data
    try {
      data = parseImport(importText.trim())
    } catch (_) {
      setMsg({ ok: false, text: 'ひきつぎデータの 形式が ちがうようです。もういちど かくにんしてください' })
      setConfirmImport(false)
      return
    }
    dispatch({ type: 'IMPORT_STATE', data })
    setMsg({ ok: true, text: '✅ ひきつぎ かんりょう！ データを もどしました' })
    setConfirmImport(false)
    setTimeout(onBack, 1200)
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontWeight: 900 }}>📦 データひきつぎ（機種変更）</div>
      <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
        データは この端末のなかだけに 保存されます。機種変更のときは、
        <b>古い端末で「書き出す」→ 新しい端末で「読み込む」</b>と 進捗を そのまま 引っ越せます。
      </p>

      <div className="row wrap" style={{ gap: 8 }}>
        <button
          className={'btn ' + (mode === 'export' ? 'btn--primary' : 'btn--ghost')}
          style={{ minHeight: 52 }}
          onClick={() => { setMode(mode === 'export' ? null : 'export'); setMsg(null) }}
        >
          ⬆️ データを 書き出す
        </button>
        <button
          className={'btn ' + (mode === 'import' ? 'btn--primary' : 'btn--ghost')}
          style={{ minHeight: 52 }}
          onClick={() => { setMode(mode === 'import' ? null : 'import'); setMsg(null); setConfirmImport(false) }}
        >
          ⬇️ データを 読み込む
        </button>
      </div>

      {mode === 'export' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="row wrap" style={{ gap: 8 }}>
            <button className="btn btn--primary" style={{ minHeight: 52 }} onClick={doDownload}>
              💾 ファイルに ほぞん
            </button>
            <button className="btn btn--ghost" style={{ minHeight: 52 }} onClick={doCopy}>
              📋 コードを コピー
            </button>
          </div>
          <textarea
            readOnly
            value={exportText}
            onFocus={(e) => e.target.select()}
            spellCheck={false}
            style={{
              width: '100%', minHeight: 96, fontSize: 11, fontFamily: 'monospace',
              borderRadius: 12, padding: 10, boxSizing: 'border-box', resize: 'vertical'
            }}
          />
          <p className="muted" style={{ fontSize: 12, margin: 0 }}>
            ※ ファイルか、この文字（コード）を メモ・メール・クラウド等に 保存してください。
          </p>
        </div>
      )}

      {mode === 'import' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label className="btn btn--ghost" style={{ minHeight: 52, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            📂 ファイルを えらぶ
            <input type="file" accept=".json,application/json" onChange={onFile} style={{ display: 'none' }} />
          </label>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="…または、書き出した コードを ここに はりつけてください"
            spellCheck={false}
            style={{
              width: '100%', minHeight: 96, fontSize: 11, fontFamily: 'monospace',
              borderRadius: 12, padding: 10, boxSizing: 'border-box', resize: 'vertical'
            }}
          />
          <p className="muted" style={{ fontSize: 12, margin: 0 }}>
            ⚠️ 読み込むと、いまの端末のデータは <b>上書き</b>されます。
          </p>
          {!confirmImport ? (
            <button
              className="btn btn--primary"
              style={{ minHeight: 52 }}
              disabled={!importText.trim()}
              onClick={() => { setMsg(null); setConfirmImport(true) }}
            >
              このデータで ひきつぐ
            </button>
          ) : (
            <div className="row wrap" style={{ gap: 8 }}>
              <button className="btn btn--pink" style={{ minHeight: 52 }} onClick={doImport}>
                上書きして ひきつぐ
              </button>
              <button className="btn btn--ghost" style={{ minHeight: 52 }} onClick={() => setConfirmImport(false)}>
                やめる
              </button>
            </div>
          )}
        </div>
      )}

      {msg && (
        <div
          className="pill"
          style={{
            background: msg.ok ? 'var(--good)' : 'var(--bad-soft)',
            color: '#10231c', border: 'none', alignSelf: 'flex-start',
            whiteSpace: 'normal', lineHeight: 1.5, padding: '8px 12px'
          }}
        >
          {msg.text}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, sub }) {
  return (
    <div className="card" style={{ flex: '1 1 140px', textAlign: 'center' }}>
      <div style={{ fontSize: 'clamp(26px,5vw,40px)', fontWeight: 900 }}>{value}</div>
      <div className="muted" style={{ fontWeight: 700 }}>{label}</div>
      {sub && <div className="muted" style={{ fontSize: 12 }}>{sub}</div>}
    </div>
  )
}

function trendColor(label) {
  if (label === 'とくい！') return 'var(--good)'
  if (label === 'おうえん中') return 'var(--bad-soft)'
  return 'var(--accent)'
}

export default function ParentScreen({ onBack }) {
  const { state, dispatch } = useGame()
  const d = state.daily
  const accuracy = d.attemptsToday ? Math.round((d.correctToday / d.attemptsToday) * 100) : 0
  const [confirmReset, setConfirmReset] = useState(false)

  // 直近7日間の取り組み日数
  const activeDays = Object.keys(state.history).length + (d.attemptsToday > 0 ? 1 : 0)

  const toggle = (key) => {
    const next = !state.settings[key]
    dispatch({ type: 'SET_SETTING', key, value: next })
    if (key === 'tts') setTtsEnabled(next)
    if (key === 'sfx') setSfxEnabled(next)
    if (key === 'bgm') setBgmEnabled(next)
  }

  return (
    <div className="screen fade-in">
      <div className="topbar">
        <button className="btn btn--ghost" style={{ minHeight: 56 }} onClick={onBack}>
          ← もどる
        </button>
        <div className="topbar__title">👨‍👩‍👧 おうちのひとへ</div>
        <div style={{ width: 60 }} />
      </div>

      <div className="scroll-y" style={{ flex: 1, padding: '4px 8px 28px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* 今日のサマリー */}
          <div>
            <h3 style={{ margin: '4px 0 10px' }}>きょうの がんばり</h3>
            <div className="row wrap">
              <Stat label="クリアした タスク" value={d.tasksClearedToday} />
              <Stat label="といた もんだい" value={d.attemptsToday} />
              <Stat label="せいかい率" value={`${accuracy}%`} />
              <Stat
                label="息抜き解放"
                value={d.ticketsEarnedToday}
                sub="追加問題で獲得したチケット数"
              />
              <Stat label="連続日数" value={`${state.streak}日`} sub="毎日つづけると🔥" />
              <Stat
                label="まちがいから覚えた数"
                value={state.conquered}
                sub="復習(とっくん)で克服した累計"
              />
            </div>
          </div>

          {/* 分野ごとの傾向 */}
          <div>
            <h3 style={{ margin: '4px 0 10px' }}>とくい・にがての けいこう</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DOMAINS.map((dom) => {
                const sk = skillOf(state, dom.id)
                const today = d.perDomainToday[dom.id]
                const label = dom.available ? trendLabel(sk) : 'じゅんびちゅう'
                return (
                  <div key={dom.id} className="card row" style={{ alignItems: 'center', gap: 14 }}>
                    <div style={{ fontSize: 30 }}>{dom.emoji}</div>
                    <div className="grow">
                      <div style={{ fontWeight: 900 }}>{dom.name}</div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {dom.available
                          ? `レベル ${Math.floor(sk.level)} ・ きょう ${
                              today ? `${today.correct}/${today.attempts}` : '0/0'
                            }`
                          : 'もうすぐ ついか予定'}
                      </div>
                    </div>
                    <div
                      className="pill"
                      style={{ background: trendColor(label), color: '#10231c', border: 'none' }}
                    >
                      {label}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>
              ※「おうえん中」の分野は、アプリが自動でヒントを増やし、段階を細かくして支えます。
              苦手意識を持たせない設計です。
            </p>
          </div>

          {/* 学年（先取り解放の保護者操作） */}
          <div>
            <h3 style={{ margin: '4px 0 10px' }}>学年レベル</h3>
            <div className="card">
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, marginTop: 0 }}>
                現在: {gradeOf(state.grade).short} ／ 解放済み: {gradeOf(state.gradeMax).short} まで
                <br />
                通常は各学年をマスターすると次が自動で解放されます。
                保護者判断で先取り解放することもできます。
              </p>
              <div className="row wrap">
                {state.gradeMax < MAX_GRADE && (
                  <button
                    className="btn btn--ghost"
                    onClick={() => dispatch({ type: 'FORCE_GRADE_MAX', gradeMax: state.gradeMax + 1 })}
                  >
                    ⏭ {gradeOf(state.gradeMax + 1).short} を先取り解放
                  </button>
                )}
                {GRADES.filter((g) => g.id <= state.gradeMax).map((g) => (
                  <button
                    key={g.id}
                    className={'btn ' + (g.id === state.grade ? 'btn--primary' : 'btn--ghost')}
                    style={{ minHeight: 52, padding: '8px 16px' }}
                    onClick={() => dispatch({ type: 'SET_GRADE', grade: g.id })}
                  >
                    {g.short}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 設定 */}
          <div>
            <h3 style={{ margin: '4px 0 10px' }}>せってい</h3>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label className="row" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800 }}>🔊 おんせい よみあげ</span>
                <button
                  className={'btn ' + (state.settings.tts ? 'btn--primary' : 'btn--ghost')}
                  style={{ minHeight: 52, padding: '8px 20px' }}
                  onClick={() => toggle('tts')}
                >
                  {state.settings.tts ? 'ON' : 'OFF'}
                </button>
              </label>
              <label className="row" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800 }}>🎵 こうかおん</span>
                <button
                  className={'btn ' + (state.settings.sfx ? 'btn--primary' : 'btn--ghost')}
                  style={{ minHeight: 52, padding: '8px 20px' }}
                  onClick={() => toggle('sfx')}
                >
                  {state.settings.sfx ? 'ON' : 'OFF'}
                </button>
              </label>
              <label className="row" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800 }}>🎼 BGM（うちゅうの音楽）</span>
                <button
                  className={'btn ' + (state.settings.bgm ? 'btn--primary' : 'btn--ghost')}
                  style={{ minHeight: 52, padding: '8px 20px' }}
                  onClick={() => toggle('bgm')}
                >
                  {state.settings.bgm ? 'ON' : 'OFF'}
                </button>
              </label>
            </div>
          </div>

          {/* データ */}
          <div>
            <h3 style={{ margin: '4px 0 10px' }}>データ</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <DataMigration state={state} dispatch={dispatch} onBack={onBack} />
            <div className="card">
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, marginTop: 0 }}>
                とりくみ日数: {activeDays}日 ／ 累計クリア: {state.totalClears}回
                <br />
                すべてのデータは この端末のなかだけに保存されます（アカウント登録不要）。
              </p>
              {!confirmReset ? (
                <button className="btn btn--ghost" onClick={() => setConfirmReset(true)}>
                  さいしょから やりなおす
                </button>
              ) : (
                <div className="row wrap">
                  <button
                    className="btn btn--pink"
                    onClick={() => {
                      dispatch({ type: 'RESET_ALL' })
                      setConfirmReset(false)
                      onBack()
                    }}
                  >
                    ほんとうに けす
                  </button>
                  <button className="btn btn--ghost" onClick={() => setConfirmReset(false)}>
                    やめる
                  </button>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
