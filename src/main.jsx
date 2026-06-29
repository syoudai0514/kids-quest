import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { GameProvider } from './state/GameContext.jsx'
import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>
)
