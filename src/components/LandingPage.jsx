// src/components/LandingPage.jsx
import { useState } from 'react'
import '../styles/landing.css'

export function LandingPage({ onEnter }) {
  const [exiting, setExiting] = useState(false)

  function handleEnter() {
    if (exiting) return
    setExiting(true)
    // Wait for fade-to-black animation, then notify parent
    setTimeout(onEnter, 860)
  }

  return (
    <div className={`landing${exiting ? ' exiting' : ''}`}>
      <div className="landing-scanline" />

      <div className="landing-content">
        <p className="landing-eyebrow">Signal Detected</p>

        <h1 className="landing-title">NIGHT CHANNEL</h1>

        <div className="landing-lines">
          <p className="landing-line">It's late.</p>
          <p className="landing-line">You're still awake.</p>
          <p className="landing-line">The signal is unstable tonight.</p>
        </div>

        <div className="landing-divider" />

        <button className="landing-enter" onClick={handleEnter}>
          ENTER
        </button>
      </div>
    </div>
  )
}
