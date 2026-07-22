import { useState } from 'react'
import { ResistorWizard } from './tools/resistor/ResistorWizard'
import './App.css'

type Screen = 'home' | 'resistor'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')

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
        <span className="build-badge" title="Build number">
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
                <span className="tool-link-desc">Decode 4 / 5 / 6 band stripes</span>
              </button>
            </nav>
          </section>
        ) : (
          <ResistorWizard />
        )}
      </main>
    </div>
  )
}
