// ============================================================
// 画面ルーター（シンプルな state ベース）。
// 5歳が迷わないよう、つねにホームへ戻れる構成。
// ============================================================

import React, { useEffect, useState } from 'react'
import { useGame } from './state/GameContext.jsx'
import { unlockTts, setTtsEnabled } from './engine/tts.js'
import { unlockSfx, setSfxEnabled } from './engine/sfx.js'
import HomeScreen from './screens/HomeScreen.jsx'
import ActivityPlayer from './screens/ActivityPlayer.jsx'
import BattleScreen from './screens/BattleScreen.jsx'
import CollectionScreen from './screens/CollectionScreen.jsx'
import ParentScreen from './screens/ParentScreen.jsx'
import CelebrationOverlay from './screens/CelebrationOverlay.jsx'

export default function App() {
  const { state, dispatch } = useGame()
  const [screen, setScreen] = useState('home')
  const [activeTask, setActiveTask] = useState(null)

  // 最初のタップで音声と効果音を解錠（ブラウザの自動再生制限対策）
  useEffect(() => {
    const unlock = () => {
      unlockTts()
      unlockSfx()
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  // 保存済みの設定（音声・効果音 ON/OFF）をエンジンへ反映
  useEffect(() => {
    setTtsEnabled(state.settings.tts)
    setSfxEnabled(state.settings.sfx)
  }, [state.settings.tts, state.settings.sfx])

  const startTask = (task) => {
    setActiveTask(task)
    setScreen('task')
  }

  const finishTask = () => {
    // タスク完了 → CLEAR_TASK は ActivityPlayer 内で dispatch 済み。
    // ここでは画面を戻すだけ。ごほうび演出は CelebrationOverlay が拾う。
    setActiveTask(null)
    setScreen('home')
  }

  const go = (s) => setScreen(s)

  return (
    <div className="app-shell">
      {screen === 'home' && (
        <HomeScreen onStartTask={startTask} onGo={go} />
      )}
      {screen === 'task' && activeTask && (
        <ActivityPlayer task={activeTask} onDone={finishTask} onQuit={finishTask} />
      )}
      {screen === 'battle' && <BattleScreen onBack={() => go('home')} />}
      {screen === 'collection' && <CollectionScreen onBack={() => go('home')} />}
      {screen === 'parent' && <ParentScreen onBack={() => go('home')} />}

      {/* ごほうび演出（惑星解放・なかま・チケット）は最前面に */}
      {state.pendingCelebration && (
        <CelebrationOverlay
          celebration={state.pendingCelebration}
          onClose={() => dispatch({ type: 'CLEAR_CELEBRATION' })}
        />
      )}
    </div>
  )
}
