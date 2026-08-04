// ============================================================
// 画面ルーター（シンプルな state ベース）。
// 背景の空の色は「いまいる惑星」で変わる（--bg-a / --bg-b）。
// ============================================================

import React, { useEffect, useState } from 'react'
import { useGame } from './state/GameContext.jsx'
import { currentPlanet } from './data/planets.js'
import { unlockTts, setTtsEnabled } from './engine/tts.js'
import { unlockSfx, setSfxEnabled } from './engine/sfx.js'
import { setBgmEnabled } from './engine/bgm.js'
import OnboardingScreen from './screens/OnboardingScreen.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import ActivityPlayer from './screens/ActivityPlayer.jsx'
import BattleScreen from './screens/BattleScreen.jsx'
import CollectionScreen from './screens/CollectionScreen.jsx'
import EquipScreen from './screens/EquipScreen.jsx'
import ChapterTestScreen from './screens/ChapterTestScreen.jsx'
import ParentScreen from './screens/ParentScreen.jsx'
import ReviewScreen from './screens/ReviewScreen.jsx'
import CelebrationOverlay from './screens/CelebrationOverlay.jsx'

export default function App() {
  const { state, dispatch } = useGame()
  const stateRef = React.useRef(state)
  stateRef.current = state
  const [screen, setScreen] = useState('home')
  const [activeTask, setActiveTask] = useState(null)

  // 最初のタップで音声と効果音を解錠（ブラウザの自動再生制限対策）
  useEffect(() => {
    const unlock = () => {
      unlockTts()
      unlockSfx()
      if (stateRef.current.settings.bgm) setBgmEnabled(true)
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  // 保存済みの設定（音声・効果音 ON/OFF）をエンジンへ反映
  useEffect(() => {
    setTtsEnabled(state.settings.tts)
    setSfxEnabled(state.settings.sfx)
  }, [state.settings.tts, state.settings.sfx])

  // BGM の ON/OFF（初回は unlock 時に開始される）
  useEffect(() => {
    if (!state.settings.bgm) setBgmEnabled(false)
    else setBgmEnabled(true)
  }, [state.settings.bgm])

  const startTask = (task) => {
    setActiveTask(task)
    setScreen('task')
  }

  const finishTask = () => {
    setActiveTask(null)
    setScreen('home')
  }

  const go = (s) => setScreen(s)

  const planet = currentPlanet(state.totalClears)

  return (
    <div className="app-shell" style={{ '--bg-a': planet.bg[0], '--bg-b': planet.bg[1] }}>
      {!state.onboarded ? (
        <OnboardingScreen />
      ) : (
        <>
          {screen === 'home' && <HomeScreen onStartTask={startTask} onGo={go} />}
          {screen === 'task' && activeTask && (
            <ActivityPlayer task={activeTask} onDone={finishTask} onQuit={finishTask} />
          )}
          {screen === 'battle' && <BattleScreen onBack={() => go('home')} />}
          {screen === 'review' && (
            <ReviewScreen onBack={() => go('home')} onStartTask={startTask} />
          )}
          {screen === 'collection' && <CollectionScreen onBack={() => go('home')} />}
          {screen === 'equip' && <EquipScreen onBack={() => go('home')} />}
          {screen === 'test' && <ChapterTestScreen onBack={() => go('home')} />}
          {screen === 'parent' && <ParentScreen onBack={() => go('home')} />}

          {state.pendingCelebration && (
            <CelebrationOverlay
              celebration={state.pendingCelebration}
              onClose={() => dispatch({ type: 'CLEAR_CELEBRATION' })}
            />
          )}
        </>
      )}
    </div>
  )
}
