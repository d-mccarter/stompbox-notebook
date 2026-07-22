import { useMemo, useState } from 'react'
import {
  calculateLimiterResistor,
  formatOhms,
  formatWatts,
  LED_COLOR_PRESETS,
} from './calc'
import './LedNotes.css'

export function LedNotes() {
  const [supply, setSupply] = useState('9')
  const [vf, setVf] = useState('2.0')
  const [currentMa, setCurrentMa] = useState('10')
  const [selectedColor, setSelectedColor] = useState(LED_COLOR_PRESETS[0].id)

  const result = useMemo(() => {
    return calculateLimiterResistor(
      Number(supply),
      Number(vf),
      Number(currentMa),
    )
  }, [supply, vf, currentMa])

  function applyColor(id: string) {
    const preset = LED_COLOR_PRESETS.find((p) => p.id === id)
    if (!preset) return
    setSelectedColor(id)
    setVf(String(preset.vf))
  }

  return (
    <section className="led-notes" aria-labelledby="led-notes-title">
      <header className="led-notes-header">
        <p className="led-notes-kicker">LED tool</p>
        <h1 id="led-notes-title" className="led-notes-title">
          Current limiter
        </h1>
        <p className="led-notes-lede">
          Series resistor math for pedal indicator LEDs — schematic, typical
          values by color, and a quick calculator.
        </p>
      </header>

      <section className="led-schematic-block" aria-labelledby="led-schematic-title">
        <h2 id="led-schematic-title" className="led-section-title">
          Basic circuit
        </h2>
        <div className="led-schematic-wrap" aria-hidden="true">
          <LedSchematic />
        </div>
        <p className="led-formula">
          <span className="led-formula-label">Formula</span>
          <span className="led-formula-math">
            R = (V<sub>s</sub> − V<sub>f</sub>) / I
          </span>
        </p>
        <p className="led-schematic-note">
          The resistor drops the leftover voltage so LED current stays in a safe
          range. For 9 V pedals, 5–15 mA is typical for a panel LED.
        </p>
      </section>

      <section className="led-table-block" aria-labelledby="led-table-title">
        <h2 id="led-table-title" className="led-section-title">
          Typical resistors by color
        </h2>
        <p className="led-table-lede">
          Suggested series R at <strong>9 V</strong> and <strong>10 mA</strong>.
          Tap a row to load Vf into the calculator.
        </p>
        <div className="led-table-scroll">
          <table className="led-table">
            <thead>
              <tr>
                <th>Color</th>
                <th>Vf</th>
                <th>R @ 9 V</th>
              </tr>
            </thead>
            <tbody>
              {LED_COLOR_PRESETS.map((preset) => (
                <tr key={preset.id}>
                  <td>
                    <button
                      type="button"
                      className={`led-color-btn${selectedColor === preset.id ? ' is-active' : ''}`}
                      onClick={() => applyColor(preset.id)}
                    >
                      <span
                        className="led-swatch"
                        style={{ backgroundColor: preset.swatch }}
                        aria-hidden="true"
                      />
                      <span>
                        <span className="led-color-name">{preset.label}</span>
                        <span className="led-color-note">{preset.note}</span>
                      </span>
                    </button>
                  </td>
                  <td>
                    <span className="led-mono">{preset.vf.toFixed(1)} V</span>
                    <span className="led-range">{preset.vfRange}</span>
                  </td>
                  <td className="led-mono">{formatOhms(preset.rAt9v10mA)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="led-calc-block" aria-labelledby="led-calc-title">
        <h2 id="led-calc-title" className="led-section-title">
          Resistor calculator
        </h2>

        <div className="led-calc-fields">
          <label className="field">
            <span className="field-label">Supply V<sub>s</sub></span>
            <div className="field-with-unit">
              <input
                className="field-input"
                type="text"
                inputMode="decimal"
                value={supply}
                onChange={(e) => setSupply(e.target.value)}
              />
              <span className="field-unit">V</span>
            </div>
          </label>

          <label className="field">
            <span className="field-label">LED V<sub>f</sub></span>
            <div className="field-with-unit">
              <input
                className="field-input"
                type="text"
                inputMode="decimal"
                value={vf}
                onChange={(e) => setVf(e.target.value)}
              />
              <span className="field-unit">V</span>
            </div>
          </label>

          <label className="field">
            <span className="field-label">LED current</span>
            <div className="field-with-unit">
              <input
                className="field-input"
                type="text"
                inputMode="decimal"
                value={currentMa}
                onChange={(e) => setCurrentMa(e.target.value)}
              />
              <span className="field-unit">mA</span>
            </div>
          </label>
        </div>

        <div className="led-calc-readout" aria-live="polite">
          {result.valid ? (
            <>
              <p className="led-calc-value">{formatOhms(result.ohmsExact)}</p>
              <p className="led-calc-meta">
                exact · nearest E24 {formatOhms(result.ohmsNearestE24)}
              </p>
              <p className="led-calc-meta">
                resistor dissipation ≈ {formatWatts(result.powerWatts)}
                {result.powerWatts <= 0.125 ? ' (¼ W OK)' : result.powerWatts <= 0.25 ? ' (use ≥ ¼ W)' : ' (use ≥ ½ W)'}
              </p>
            </>
          ) : (
            <p className="led-calc-error">{result.message}</p>
          )}
        </div>
      </section>
    </section>
  )
}

function LedSchematic() {
  return (
    <svg viewBox="0 0 320 150" className="led-schematic" role="img">
      <title>LED with series current-limiting resistor</title>

      {/* Supply rails */}
      <line x1="36" y1="28" x2="36" y2="122" stroke="#152028" strokeWidth="2" />
      <line x1="28" y1="28" x2="44" y2="28" stroke="#152028" strokeWidth="2.5" />
      <line x1="30" y1="122" x2="42" y2="122" stroke="#152028" strokeWidth="2.5" />
      <text x="52" y="32" className="sch-label">
        Vs
      </text>
      <text x="20" y="20" className="sch-label">
        +
      </text>
      <text x="18" y="138" className="sch-label">
        GND
      </text>

      {/* Top wire to resistor */}
      <line x1="36" y1="48" x2="110" y2="48" stroke="#152028" strokeWidth="2" />

      {/* Resistor zig-zag */}
      <polyline
        points="110,48 118,40 130,56 142,40 154,56 166,40 178,56 186,48"
        fill="none"
        stroke="#152028"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <text x="148" y="30" textAnchor="middle" className="sch-label">
        R
      </text>

      {/* Wire to LED */}
      <line x1="186" y1="48" x2="230" y2="48" stroke="#152028" strokeWidth="2" />

      {/* LED diode triangle + bar + arrows */}
      <polygon points="230,34 230,62 258,48" fill="none" stroke="#152028" strokeWidth="2" />
      <line x1="258" y1="34" x2="258" y2="62" stroke="#152028" strokeWidth="2.5" />
      {/* light arrows */}
      <path d="M266 36 l10 -8" stroke="#2f6f62" strokeWidth="1.5" />
      <path d="M268 44 l10 -6" stroke="#2f6f62" strokeWidth="1.5" />
      <path d="M274 34 l4 4 M276 40 l4 4" stroke="#2f6f62" strokeWidth="1.2" />
      <text x="244" y="78" textAnchor="middle" className="sch-label">
        LED
      </text>
      <text x="244" y="90" textAnchor="middle" className="sch-sub">
        Vf
      </text>

      {/* Down to ground */}
      <line x1="258" y1="48" x2="284" y2="48" stroke="#152028" strokeWidth="2" />
      <line x1="284" y1="48" x2="284" y2="122" stroke="#152028" strokeWidth="2" />
      <line x1="36" y1="122" x2="284" y2="122" stroke="#152028" strokeWidth="2" />

      {/* Current annotation */}
      <text x="160" y="112" textAnchor="middle" className="sch-sub">
        I through R and LED
      </text>
    </svg>
  )
}
