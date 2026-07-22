import { useEffect, useState } from 'react'
import { CapacitorWizard } from './tools/capacitor/CapacitorWizard'
import { LedNotes } from './tools/led/LedNotes'
import { OffboardWiring } from './tools/offboard/OffboardWiring'
import { ResistorWizard } from './tools/resistor/ResistorWizard'
import './App.css'

type Screen = 'home' | 'resistor' | 'capacitor' | 'led' | 'offboard'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')

  useEffect(() => {
    document.title = `Stompbox Notebook · build ${__BUILD_NUMBER__}`
  }, [])

  return (
    <div className="app-shell">
      <div className="app-atmosphere" aria-hidden="true" />

      <header className="app-topbar">
        {screen !== 'home' ? (
          <button
            type="button"
            className="back-btn"
            onClick={() => setScreen('home')}
            aria-label="Back to menu"
          >
            ← Menu
          </button>
        ) : (
          <span className="topbar-spacer" />
        )}
        <span className="build-badge" title={`Deployed build ${__BUILD_NUMBER__}`}>
          build {__BUILD_NUMBER__}
        </span>
      </header>

      <main className="app-main">
        {screen === 'home' ? (
          <section className="home" aria-labelledby="brand-title">
            <p className="home-eyebrow">DIY pedal bench notes</p>
            <h1 id="brand-title" className="brand">
              Stompbox Notebook
            </h1>
            <p className="home-lede">
              Quick reference tools for building guitar pedals — color codes,
              parts, and bench helpers.
            </p>

            <nav className="tool-menu" aria-label="Tools">
              <button
                type="button"
                className="tool-link"
                onClick={() => setScreen('resistor')}
              >
                <span className="tool-link-title">Resistor color code</span>
                <span className="tool-link-desc">
                  Encode or decode 4 / 5 / 6 band stripes
                </span>
              </button>
              <button
                type="button"
                className="tool-link"
                onClick={() => setScreen('capacitor')}
              >
                <span className="tool-link-title">Capacitor codes</span>
                <span className="tool-link-desc">
                  Decode markings, polarity, and pedal uses
                </span>
              </button>
              <button
                type="button"
                className="tool-link"
                onClick={() => setScreen('led')}
              >
                <span className="tool-link-title">LED resistor calculator</span>
                <span className="tool-link-desc">
                  CLR from colour, supply, and target brightness
                </span>
              </button>
              <button
                type="button"
                className="tool-link"
                onClick={() => setScreen('offboard')}
              >
                <span className="tool-link-title">Offboard wiring</span>
                <span className="tool-link-desc">
                  Jacks, 3PDT, dual builds, pots, and level trim
                </span>
              </button>
            </nav>
          </section>
        ) : screen === 'resistor' ? (
          <ResistorWizard />
        ) : screen === 'capacitor' ? (
          <CapacitorWizard />
        ) : screen === 'led' ? (
          <LedNotes />
        ) : (
          <OffboardWiring />
        )}
      </main>
    </div>
  )
}
