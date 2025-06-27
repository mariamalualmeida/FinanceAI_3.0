import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App-debug'
import './index.css'

// Service Worker temporarily disabled for debugging
console.log('Main.tsx carregando...');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)