import React, { useEffect, useRef, useState } from 'react'
import { speakEnglish } from '../engine/tts.js'

// 録音はこの画面だけの一時Blob。送信・永続化・自動採点はしない。
export default function EnglishSpeakingPractice({ text, onDone }) {
  const recorder = useRef(null); const stream = useRef(null); const url = useRef(null); const timer = useRef(null)
  const [state, setState] = useState('idle'); const [audioUrl, setAudioUrl] = useState(null); const [note, setNote] = useState('おてほんを きいて、まねして いってみよう！')
  const stop = () => { if (timer.current) clearTimeout(timer.current); if (recorder.current?.state === 'recording') recorder.current.stop() }
  useEffect(() => () => { stop(); stream.current?.getTracks().forEach((t) => t.stop()); if (url.current) URL.revokeObjectURL(url.current) }, [])
  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setNote('この ききでは ろくおん できないよ。おてほんを きいて こえに だしてみよう！'); return }
    try { stream.current = await navigator.mediaDevices.getUserMedia({ audio: true }); const chunks = []; const r = new MediaRecorder(stream.current); recorder.current = r
      r.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }; r.onstop = () => { stream.current?.getTracks().forEach((t) => t.stop()); const next = URL.createObjectURL(new Blob(chunks, { type: r.mimeType || 'audio/webm' })); if (url.current) URL.revokeObjectURL(url.current); url.current = next; setAudioUrl(next); setState('done'); setNote('じぶんの こえを きいてみよう！') }
      r.start(); setState('recording'); setNote('🔴 ろくおん中… 5びょうで とまるよ'); timer.current = setTimeout(stop, 5000)
    } catch (_) { setNote('マイクを つかわなくても だいじょうぶ。おてほんを まねして いってみよう！') }
  }
  return <div className="conquer-tag" style={{ marginTop: 10 }}><strong>🗣️ まねして いってみよう</strong><div className="row wrap" style={{ justifyContent: 'center', gap: 8, marginTop: 8 }}><button className="btn btn--ghost" onClick={() => speakEnglish(text)}>🔊 おてほん</button><button className="btn btn--primary" onClick={state === 'recording' ? stop : start}>{state === 'recording' ? '⏹ とめる' : '🎙️ ろくおん'}</button>{audioUrl && <button className="btn btn--ghost" onClick={() => new Audio(audioUrl).play()}>▶️ じぶんのこえ</button>}<button className="btn btn--sun" onClick={onDone}>まねできた！</button></div><small>{note}</small></div>
}
