// ============================================================
// 選択肢を押すだけではない「手を動かす問題」の回答UI。
// 5歳でも迷わないよう、すべて大きなタップ領域・一つずつの操作にそろえる。
// ============================================================

import React, { useEffect, useMemo, useState } from 'react'
import { Shape } from './QuestionVisual.jsx'

function KeyButton({ children, onClick, disabled, wide = false }) {
  return (
    <button className={'answer-key' + (wide ? ' answer-key--wide' : '')} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

export function NumberPad({ question, onSubmit, disabled, showHint }) {
  const [value, setValue] = useState('')
  useEffect(() => setValue(''), [question])
  const submit = () => {
    if (!value || disabled) return
    const ok = onSubmit(value)
    if (!ok) setValue('')
  }
  return (
    <div className="interaction-wrap">
      <div className={'answer-display' + (showHint ? ' answer-display--hint' : '')}>
        {showHint ? question.answerWord?.text || question.answerId : value || '？'}
      </div>
      <div className="keypad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <KeyButton key={n} disabled={disabled} onClick={() => setValue((v) => (v.length < 5 ? `${v}${n}` : v))}>{n}</KeyButton>
        ))}
        <KeyButton disabled={disabled} onClick={() => setValue((v) => v.slice(0, -1))}>けす</KeyButton>
        <KeyButton disabled={disabled} onClick={() => setValue((v) => (v.length < 5 ? `${v}0` : v))}>0</KeyButton>
        <KeyButton disabled={disabled} onClick={submit}>OK</KeyButton>
      </div>
    </div>
  )
}

export function ClockPicker({ question, onSubmit, disabled, showHint }) {
  const [hour, setHour] = useState(null)
  const [minute, setMinute] = useState(null)
  useEffect(() => { setHour(null); setMinute(null) }, [question])
  const submit = () => {
    if (hour == null || minute == null || disabled) return
    const ok = onSubmit(`${hour}:${minute}`)
    if (!ok) { setHour(null); setMinute(null) }
  }
  return (
    <div className="interaction-wrap">
      <div className={'answer-display answer-display--time' + (showHint ? ' answer-display--hint' : '')}>
        {showHint ? question.answerWord?.text || question.answerId : hour == null ? '？じ' : `${hour}じ`}
        {' '}
        {showHint ? '' : minute == null ? '？ふん' : `${minute}ふん`}
      </div>
      <div className="time-choice-row">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
          <button key={n} className={'time-key' + (hour === n ? ' time-key--selected' : '')} onClick={() => setHour(n)} disabled={disabled}>{n}</button>
        ))}
      </div>
      <div className="row wrap" style={{ justifyContent: 'center', gap: 10 }}>
        {[0, 30].map((n) => (
          <button key={n} className={'btn ' + (minute === n ? 'btn--primary' : 'btn--ghost')} style={{ minHeight: 52, padding: '10px 22px' }} onClick={() => setMinute(n)} disabled={disabled}>
            {n === 0 ? '00ぷん' : '30ぷん'}
          </button>
        ))}
        <button className="btn btn--sun" style={{ minHeight: 52, padding: '10px 22px' }} onClick={submit} disabled={disabled || hour == null || minute == null}>OK</button>
      </div>
    </div>
  )
}

export function OrderPicker({ question, onSubmit, disabled, showHint }) {
  const [order, setOrder] = useState([])
  useEffect(() => setOrder([]), [question])
  const add = (id) => {
    if (disabled || order.includes(id)) return
    const next = [...order, id]
    setOrder(next)
    if (next.length === question.items.length) {
      const ok = onSubmit(next.join('|'))
      if (!ok) setOrder([])
    }
  }
  return (
    <div className="interaction-wrap">
      <div className={'order-slots' + (showHint ? ' answer-display--hint' : '')}>
        {(showHint ? question.correctOrder : order).map((id, index) => {
          const item = question.items.find((x) => x.id === id)
          return <span className="order-slot" key={`${id}-${index}`}>{index + 1}. {item?.label}</span>
        })}
        {!showHint && Array.from({ length: question.items.length - order.length }, (_, i) => <span className="order-slot order-slot--empty" key={`empty-${i}`}>{order.length + i + 1}. ？</span>)}
      </div>
      <p className="muted" style={{ margin: 0, fontWeight: 800 }}>ちいさい じゅんに タッチしてね</p>
      <div className="order-items">
        {question.items.map((item) => (
          <button key={item.id} className={'choice order-item' + (order.includes(item.id) ? ' choice--picked' : '')} onClick={() => add(item.id)} disabled={disabled || order.includes(item.id)}>
            <span className="choice__label">{item.label}</span>
          </button>
        ))}
      </div>
      {!disabled && order.length > 0 && <button className="btn btn--ghost" style={{ minHeight: 46, padding: '8px 16px' }} onClick={() => setOrder([])}>やりなおす</button>}
    </div>
  )
}

function groupAnswer(items, selected) {
  return items.map((item) => `${item.id}:${selected[item.id] || ''}`).join('|')
}

export function GroupPicker({ question, onSubmit, disabled, showHint }) {
  const [selected, setSelected] = useState({})
  useEffect(() => setSelected({}), [question])
  const complete = useMemo(() => question.items.every((item) => selected[item.id]), [question.items, selected])
  const submit = () => {
    if (!complete || disabled) return
    const ok = onSubmit(groupAnswer(question.items, selected))
    if (!ok) setSelected({})
  }
  const display = showHint
    ? Object.fromEntries(question.items.map((item) => [item.id, question.correctGroups[item.id]]))
    : selected
  return (
    <div className="interaction-wrap">
      <p className="muted" style={{ margin: 0, fontWeight: 800 }}>なかまごとに わけよう</p>
      <div className="group-items">
        {question.items.map((item) => (
          <div className={'group-item' + (display[item.id] ? ' group-item--done' : '')} key={item.id}>
            <span className="group-item__label">{item.shape ? <Shape shape={item.shape} color={item.color} small /> : item.emoji} {item.label}</span>
            <div className="row wrap" style={{ gap: 6 }}>
              {question.groups.map((group) => (
                <button key={group.id} className={'group-key' + (display[item.id] === group.id ? ' group-key--selected' : '')} onClick={() => setSelected((v) => ({ ...v, [item.id]: group.id }))} disabled={disabled}>
                  {group.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn--sun" style={{ minHeight: 56 }} onClick={submit} disabled={!complete || disabled}>これで OK！</button>
    </div>
  )
}

export default function QuestionInteraction({ question, onSubmit, disabled, showHint }) {
  if (question.type === 'keypad') return <NumberPad question={question} onSubmit={onSubmit} disabled={disabled} showHint={showHint} />
  if (question.type === 'clock') return <ClockPicker question={question} onSubmit={onSubmit} disabled={disabled} showHint={showHint} />
  if (question.type === 'order') return <OrderPicker question={question} onSubmit={onSubmit} disabled={disabled} showHint={showHint} />
  if (question.type === 'group') return <GroupPicker question={question} onSubmit={onSubmit} disabled={disabled} showHint={showHint} />
  return null
}
