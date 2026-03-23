// src/App.jsx
import { useState } from 'react'
import { LandingPage } from './components/LandingPage'
import { TVInterface }  from './components/TVInterface'
import './styles/base.css'

export default function App() {
  const [entered, setEntered] = useState(false)

  return entered
    ? <TVInterface />
    : <LandingPage onEnter={() => setEntered(true)} />
}
