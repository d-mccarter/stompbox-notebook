import { useMemo, useState } from 'react'
import {
  calculateDriveCurrent,
  calculateLimiterResistor,
  evaluateChosenResistor,
  formatCurrent,
  formatCurrentMa,
  formatOhms,
  formatWatts,
  LED_COLOR_PRESETS,
  RATED_BRIGHTNESS_PRESETS,
  recommendedWattage,
  TARGET_BRIGHTNESS_PRESETS,
} from './calc'
import './LedNotes.css'

type ConfigMode = 'single' | 'series'
type BrightMode = 'preset' | 'custom' | 'current'

export function LedNotes() {
  const [configMode, setConfigMode] = useState<ConfigMode>('single')
  const [selectedColor, setSelectedColor] = useState(LED_COLOR_PRESETS[0].id)
  const [supply, setSupply] = useState('9')
  const [vf, setVf] = useState('2.0')
  const [ledCount, setLedCount] = useState('2')
  const [ratedMcd, setRatedMcd] = useState('1000')
  const [testCurrentMa, setTestCurrentMa] = useState('20')
  const [ratedPresetId, setRatedPresetId] = useState('high')
  const [targetPresetId, setTargetPresetId] = useState('bright')
  const [brightMode, setBrightMode] = useState<BrightMode>('preset')
  const [targetMcd, setTargetMcd] = useState(800)
  const [customTargetMcd, setCustomTargetMcd] = useState('250')
  const [directCurrentMa, setDirectCurrentMa] = useState('15')
  const [chosenOhms, setChosenOhms] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  const color = LED_COLOR_PRESETS.find((p) => p.id === selectedColor) ?? LED_COLOR_PRESETS[0]
  const numLeds = configMode === 'series' ? Math.max(1, Math.floor(Number(ledCount)) || 1) : 1

  const drive = useMemo(() => {
    if (brightMode === 'current') {
      const ma = Number(directCurrentMa)
      return {
        ma,
        rawMa: ma,
        clampLo: false,
        clampHi: false,
        valid: Number.isFinite(ma) && ma > 0,
      }
    }
    const target =
      brightMode === 'custom' ? Number(customTargetMcd) : targetMcd
    return calculateDriveCurrent(Number(ratedMcd), Number(testCurrentMa), target)
  }, [
    brightMode,
    customTargetMcd,
    directCurrentMa,
    ratedMcd,
    targetMcd,
    testCurrentMa,
  ])

  const result = useMemo(() => {
    if (!drive.valid) {
      return calculateLimiterResistor({
        supplyVolts: Number(supply),
        forwardVolts: Number(vf),
        currentMa: NaN,
        numLeds,
      })
    }
    return calculateLimiterResistor({
      supplyVolts: Number(supply),
      forwardVolts: Number(vf),
      currentMa: drive.ma,
      numLeds,
    })
  }, [drive.ma, drive.valid, numLeds, supply, vf])

  // Reset chosen resistor when the recommended value changes
  const recommendedOhms = result.valid ? result.ohmsNearestE24 : null
  const activeOhms =
    chosenOhms != null &&
    result.valid &&
    result.nearbyE24.includes(chosenOhms)
      ? chosenOhms
      : recommendedOhms

  const evaluation =
    result.valid && activeOhms != null
      ? evaluateChosenResistor(
          result.voltageDrop,
          activeOhms,
          Number(ratedMcd),
          Number(testCurrentMa),
        )
      : null

  const brightnessHint = useMemo(() => {
    if (brightMode === 'current') {
      return 'Setting the current directly. Estimated brightness below comes from the rated mcd above.'
    }
    if (!drive.valid) return ''
    let txt = `Drives about ${formatCurrentMa(drive.ma)}`
    if (drive.clampHi) txt += " (capped: this LED can't reach that brightness)"
    else if (drive.clampLo) txt += ' (raised to a reliable minimum)'
    return txt
  }, [brightMode, drive])

  function applyColor(id: string) {
    const preset = LED_COLOR_PRESETS.find((p) => p.id === id)
    if (!preset) return
    setSelectedColor(id)
    setVf(String(preset.vf))
    setChosenOhms(null)
  }

  function applyRatedPreset(id: string) {
    const preset = RATED_BRIGHTNESS_PRESETS.find((p) => p.id === id)
    if (!preset) return
    setRatedPresetId(id)
    setRatedMcd(String(preset.mcd))
    setChosenOhms(null)
  }

  function applyTargetPreset(id: string) {
    const preset = TARGET_BRIGHTNESS_PRESETS.find((p) => p.id === id)
    if (!preset) return
    setTargetPresetId(id)
    setBrightMode(preset.mode)
    if (preset.mode === 'preset' && preset.mcd != null) {
      setTargetMcd(preset.mcd)
    }
    setChosenOhms(null)
  }

  async function copyResult() {
    if (activeOhms == null) return
    const text = formatOhms(activeOhms)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard may be unavailable */
    }
  }

  return (
    <section className="led-notes" aria-labelledby="led-notes-title">
      <header className="led-notes-header">
        <p className="led-notes-kicker">LED tool</p>
        <h1 id="led-notes-title" className="led-notes-title">
          LED resistor calculator
        </h1>
        <p className="led-notes-lede">
          Current-limiting resistor (CLR) for pedal LEDs — pick colour, supply,
          and brightness to get the right value.
        </p>
      </header>

      <div className="led-config-tabs" role="tablist" aria-label="LED configuration">
        <button
          type="button"
          role="tab"
          className={`led-config-tab${configMode === 'single' ? ' is-active' : ''}`}
          aria-selected={configMode === 'single'}
          onClick={() => {
            setConfigMode('single')
            setChosenOhms(null)
          }}
        >
          Single LED
        </button>
        <button
          type="button"
          role="tab"
          className={`led-config-tab${configMode === 'series' ? ' is-active' : ''}`}
          aria-selected={configMode === 'series'}
          onClick={() => {
            setConfigMode('series')
            setChosenOhms(null)
          }}
        >
          LEDs in series
        </button>
      </div>

      <div className="led-tool-card">
        <div className="led-tool-group">
          <span className="led-tool-label">LED colour preset</span>
          <div className="led-presets" role="group" aria-label="LED colour">
            {LED_COLOR_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`led-preset${selectedColor === preset.id ? ' is-active' : ''}`}
                onClick={() => applyColor(preset.id)}
              >
                <span
                  className="led-dot"
                  style={{ backgroundColor: preset.swatch }}
                  aria-hidden="true"
                />
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <label className="led-tool-group field">
          <span className="field-label">Supply voltage (V)</span>
          <input
            className="field-input"
            type="text"
            inputMode="decimal"
            value={supply}
            onChange={(e) => {
              setSupply(e.target.value)
              setChosenOhms(null)
            }}
          />
        </label>

        <label className="led-tool-group field">
          <span className="field-label">
            LED forward voltage (V<sub>f</sub>)
          </span>
          <input
            className="field-input"
            type="text"
            inputMode="decimal"
            value={vf}
            onChange={(e) => {
              setVf(e.target.value)
              setChosenOhms(null)
            }}
          />
        </label>

        {configMode === 'series' ? (
          <label className="led-tool-group field">
            <span className="field-label">Number of LEDs in series</span>
            <input
              className="field-input"
              type="text"
              inputMode="numeric"
              value={ledCount}
              onChange={(e) => {
                setLedCount(e.target.value)
                setChosenOhms(null)
              }}
            />
          </label>
        ) : null}

        <div className="led-tool-group">
          <span className="led-tool-label">
            LED rated brightness (luminous intensity)
          </span>
          <div className="led-presets" role="group" aria-label="Rated brightness">
            {RATED_BRIGHTNESS_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`led-preset${ratedPresetId === preset.id ? ' is-active' : ''}`}
                onClick={() => applyRatedPreset(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="led-input-row">
            <label className="field">
              <span className="field-label">Rated intensity (mcd)</span>
              <input
                className="field-input"
                type="text"
                inputMode="decimal"
                value={ratedMcd}
                onChange={(e) => {
                  setRatedMcd(e.target.value)
                  setRatedPresetId('')
                  setChosenOhms(null)
                }}
              />
            </label>
            <label className="field">
              <span className="field-label">At test current (mA)</span>
              <input
                className="field-input"
                type="text"
                inputMode="decimal"
                value={testCurrentMa}
                onChange={(e) => {
                  setTestCurrentMa(e.target.value)
                  setChosenOhms(null)
                }}
              />
            </label>
          </div>
          <p className="led-hint">
            Use the figure from your LED’s datasheet or store listing if you
            have it. The presets are typical ballparks.
          </p>
        </div>

        <div className="led-tool-group">
          <span className="led-tool-label">Target brightness on the pedal</span>
          <div
            className="led-presets"
            role="group"
            aria-label="Target brightness"
          >
            {TARGET_BRIGHTNESS_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`led-preset${targetPresetId === preset.id ? ' is-active' : ''}`}
                onClick={() => applyTargetPreset(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {brightnessHint ? <p className="led-hint">{brightnessHint}</p> : null}
        </div>

        {brightMode === 'custom' ? (
          <label className="led-tool-group field">
            <span className="field-label">Target intensity (mcd)</span>
            <input
              className="field-input"
              type="text"
              inputMode="decimal"
              value={customTargetMcd}
              placeholder="e.g. 200"
              onChange={(e) => {
                setCustomTargetMcd(e.target.value)
                setChosenOhms(null)
              }}
            />
          </label>
        ) : null}

        {brightMode === 'current' ? (
          <label className="led-tool-group field">
            <span className="field-label">Current (mA)</span>
            <input
              className="field-input"
              type="text"
              inputMode="decimal"
              value={directCurrentMa}
              placeholder="e.g. 10"
              onChange={(e) => {
                setDirectCurrentMa(e.target.value)
                setChosenOhms(null)
              }}
            />
          </label>
        ) : null}

        <div className="led-circuit-wrap" aria-hidden="true">
          <LedCircuitDiagram
            supply={Number(supply) || 9}
            ohms={result.valid && activeOhms != null ? activeOhms : null}
            currentA={evaluation?.actualCurrentA ?? null}
            numLeds={numLeds}
            ledColour={color.swatch}
          />
        </div>

        <div className="led-calc-result" aria-live="polite">
          {!result.valid || activeOhms == null || evaluation == null ? (
            result.message?.startsWith('Not enough voltage') ? (
              <p className="led-warning">
                <strong>Not enough voltage.</strong>{' '}
                {result.message.replace(/^Not enough voltage —?\s*/i, '')}
              </p>
            ) : (
              <p className="led-calc-empty">
                {result.message ?? 'Enter valid values above to calculate.'}
              </p>
            )
          ) : (
            <>
              <div className="led-result-card">
                <div className="led-result-header">
                  <div>
                    <p className="led-result-value">{formatOhms(activeOhms)}</p>
                    <p className="led-result-alts">
                      Exact: {result.ohmsExact.toFixed(1)} Ω
                      {activeOhms !== result.ohmsNearestE24
                        ? ` · Recommended: ${formatOhms(result.ohmsNearestE24)}`
                        : result.ohmsBelowE24 !== result.ohmsNearestE24
                          ? ` · Next lower: ${formatOhms(result.ohmsBelowE24)}`
                          : null}
                    </p>
                  </div>
                  <button type="button" className="led-copy-btn" onClick={copyResult}>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <div className="led-result-details">
                  <p>
                    <strong>Actual current:</strong>{' '}
                    {formatCurrent(evaluation.actualCurrentA)}
                  </p>
                  {evaluation.emittedMcd != null ? (
                    <p>
                      <strong>Estimated brightness:</strong> ~
                      {Math.round(evaluation.emittedMcd)} mcd
                    </p>
                  ) : null}
                  <p>
                    <strong>Voltage across resistor:</strong>{' '}
                    {result.voltageDrop.toFixed(2)} V
                  </p>
                  <p>
                    <strong>Power dissipation:</strong>{' '}
                    {formatWatts(evaluation.powerWatts)}, use a{' '}
                    {recommendedWattage(evaluation.powerWatts * 2)} resistor or
                    larger (2× headroom)
                  </p>
                </div>

                <div className="led-nearby">
                  <p className="led-nearby-label">
                    <strong>Nearby E24 values</strong> (tap to compare):
                  </p>
                  <div className="led-std-row">
                    {result.nearbyE24.map((ohms) => (
                      <button
                        key={ohms}
                        type="button"
                        className={`led-std-chip${ohms === activeOhms ? ' is-active' : ''}`}
                        title={`${formatCurrent(result.voltageDrop / ohms)} @ ${formatOhms(ohms)}`}
                        onClick={() => setChosenOhms(ohms)}
                      >
                        {formatOhms(ohms)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {drive.clampHi ? (
                <p className="led-warning">
                  <strong>Brightness capped.</strong> Reaching the target would
                  need more than the 20 mA a standard LED handles, so the
                  recommendation is set at 20 mA
                  {evaluation.emittedMcd != null
                    ? `: about ${Math.round(
                        evaluateChosenResistor(
                          result.voltageDrop,
                          result.ohmsNearestE24,
                          Number(ratedMcd),
                          Number(testCurrentMa),
                        ).emittedMcd ?? 0,
                      )} mcd, the most this LED will safely give.`
                    : '.'}{' '}
                  For more brightness, choose a higher-rated LED.
                </p>
              ) : null}

              {evaluation.actualCurrentA > 0.02 ? (
                <p className="led-warning">
                  <strong>High current.</strong>{' '}
                  {formatCurrent(evaluation.actualCurrentA)} exceeds the typical
                  20 mA maximum for standard LEDs. Consider a higher resistance.
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>

      <p className="led-formula-note">
        Formula: R = (V<sub>supply</sub> − V<sub>forward</sub>) / I · Always
        round up to the nearest standard value
      </p>

      <section className="led-polarity-block" aria-labelledby="led-polarity-title">
        <h2 id="led-polarity-title" className="led-section-title">
          Finding anode &amp; cathode
        </h2>
        <div className="led-polarity-wrap" aria-hidden="true">
          <LedPolarityDiagram />
        </div>
        <ul className="led-polarity-list">
          <li>
            <strong>Longer lead = anode (+).</strong> On a new LED the anode
            lead sticks out farther than the cathode.
          </li>
          <li>
            <strong>Flat edge = cathode (−).</strong> Look at the epoxy lens
            from above — the flattened rim sits on the cathode side.
          </li>
          <li>
            <strong>Inside the package:</strong> the larger metal “flag” or
            anvil is usually the cathode; the smaller post is the anode.
          </li>
          <li>
            <strong>Leads already trimmed?</strong> Use the flat on the body,
            or check continuity with a multimeter’s diode mode (it lights /
            reads when red probe is on the anode).
          </li>
        </ul>
      </section>

      <section className="led-ref-block" aria-labelledby="led-vf-title">
        <h2 id="led-vf-title" className="led-section-title">
          Forward voltage reference
        </h2>
        <div className="led-table-scroll">
          <table className="led-table">
            <thead>
              <tr>
                <th>Colour</th>
                <th>Typical Vf</th>
                <th>Range</th>
              </tr>
            </thead>
            <tbody>
              {LED_COLOR_PRESETS.map((preset) => (
                <tr key={preset.id}>
                  <td>
                    <span className="led-table-swatch-row">
                      <span
                        className="led-dot"
                        style={{ backgroundColor: preset.swatch }}
                        aria-hidden="true"
                      />
                      {preset.label}
                    </span>
                  </td>
                  <td className="led-mono">{preset.vf.toFixed(1)} V</td>
                  <td className="led-mono">{preset.vfRange}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

function LedCircuitDiagram({
  supply,
  ohms,
  currentA,
  numLeds,
  ledColour,
}: {
  supply: number
  ohms: number | null
  currentA: number | null
  numLeds: number
  ledColour: string
}) {
  const showLeds = Math.max(1, numLeds)
  const ledSpacing = 70
  const baseWidth = 340
  const svgWidth = baseWidth + (showLeds - 1) * ledSpacing
  const wireY = 50
  const botY = 100
  const colour =
    ledColour === '#ffffff' || ledColour === '#aaaaaa' ? '#cccccc' : ledColour

  const rX = 60
  const afterR = rX + 50
  const firstLedX = afterR + 30

  const ledElements = []
  for (let i = 0; i < showLeds; i++) {
    const lx = firstLedX + i * ledSpacing
    ledElements.push(
      <g key={i}>
        {i === 0 ? (
          <line
            x1={afterR}
            y1={wireY}
            x2={lx - 12}
            y2={wireY}
            stroke="#8a9299"
            strokeWidth="1.5"
          />
        ) : (
          <line
            x1={lx - ledSpacing + 18}
            y1={wireY}
            x2={lx - 12}
            y2={wireY}
            stroke="#8a9299"
            strokeWidth="1.5"
          />
        )}
        <polygon
          points={`${lx - 12},${wireY - 12} ${lx - 12},${wireY + 12} ${lx + 10},${wireY}`}
          fill="none"
          stroke={colour}
          strokeWidth="1.8"
        />
        <line
          x1={lx + 10}
          y1={wireY - 12}
          x2={lx + 10}
          y2={wireY + 12}
          stroke={colour}
          strokeWidth="2"
        />
        <path
          d={`M${lx + 16} ${wireY - 10} l8 -6 M${lx + 18} ${wireY - 2} l8 -5`}
          stroke={colour}
          strokeWidth="1.3"
          fill="none"
        />
        <text
          x={lx}
          y={wireY + 28}
          textAnchor="middle"
          className="sch-sub"
        >
          LED{showLeds > 1 ? ` ${i + 1}` : ''}
        </text>
      </g>,
    )
  }

  const lastLedX = firstLedX + (showLeds - 1) * ledSpacing
  const endX = lastLedX + 40

  return (
    <svg
      viewBox={`0 0 ${svgWidth} 120`}
      className="led-circuit"
      role="img"
      aria-label="Series CLR and LED circuit"
    >
      <text x="10" y="36" className="sch-label">
        +{Number.isFinite(supply) ? supply : 9}V
      </text>
      <line x1="40" y1={wireY} x2="60" y2={wireY} stroke="#8a9299" strokeWidth="1.5" />
      <polyline
        points={`${rX},${wireY} ${rX + 5},${wireY - 8} ${rX + 15},${wireY + 8} ${rX + 25},${wireY - 8} ${rX + 35},${wireY + 8} ${rX + 45},${wireY - 8} ${rX + 50},${wireY}`}
        fill="none"
        stroke="#152028"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <text x={rX + 25} y={wireY - 14} textAnchor="middle" className="sch-label">
        {ohms != null ? formatOhms(ohms) : 'R'}
      </text>
      {ledElements}
      <line
        x1={lastLedX + 10}
        y1={wireY}
        x2={endX}
        y2={wireY}
        stroke="#8a9299"
        strokeWidth="1.5"
      />
      <line
        x1={endX}
        y1={wireY}
        x2={endX}
        y2={botY}
        stroke="#8a9299"
        strokeWidth="1.5"
      />
      <line
        x1="40"
        y1={botY}
        x2={endX}
        y2={botY}
        stroke="#8a9299"
        strokeWidth="1.5"
      />
      <line x1="40" y1={wireY} x2="40" y2={botY} stroke="#8a9299" strokeWidth="1.5" />
      <text x="40" y={botY + 14} textAnchor="middle" className="sch-sub">
        GND
      </text>
      {currentA != null ? (
        <text x={svgWidth / 2} y={botY - 8} textAnchor="middle" className="sch-sub">
          I ≈ {formatCurrent(currentA)}
        </text>
      ) : null}
    </svg>
  )
}

function LedPolarityDiagram() {
  return (
    <svg
      viewBox="0 0 280 136"
      className="led-schematic"
      role="img"
      aria-label="Through-hole LED with flat cathode edge on the left and longer anode lead on the right"
    >
      <title>Physical LED polarity: flat edge and lead length</title>
      <defs>
        <marker
          id="led-arrow"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="#2f6f62" />
        </marker>
        <linearGradient id="led-lens" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e07468" stopOpacity="0.75" />
          <stop offset="45%" stopColor="#c0392b" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#8e2a20" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      <path
        d="M130 82
           L130 52
           C130 30 142 18 156 18
           C170 18 182 30 182 52
           L182 82
           L186 82
           L186 88
           L126 88
           L126 82
           Z"
        fill="url(#led-lens)"
        stroke="#152028"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line
        x1="128"
        y1="50"
        x2="128"
        y2="88"
        stroke="#152028"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect
        x="134"
        y="58"
        width="20"
        height="16"
        rx="1"
        fill="#b8bec6"
        stroke="#152028"
        strokeWidth="1"
      />
      <rect
        x="166"
        y="62"
        width="8"
        height="14"
        rx="1"
        fill="#d0d4d8"
        stroke="#152028"
        strokeWidth="1"
      />
      <line
        x1="144"
        y1="74"
        x2="144"
        y2="108"
        stroke="#8a9299"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="170"
        y1="76"
        x2="170"
        y2="118"
        stroke="#8a9299"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <text x="8" y="46" className="sch-label">
        flat edge
      </text>
      <text x="8" y="58" className="sch-label">
        = cathode (−)
      </text>
      <path
        d="M78 48 H120"
        stroke="#2f6f62"
        strokeWidth="1.5"
        markerEnd="url(#led-arrow)"
      />
      <text x="98" y="122" textAnchor="end" className="sch-label">
        − cathode
      </text>
      <text x="208" y="122" textAnchor="start" className="sch-label">
        + anode
      </text>
      <line
        x1="102"
        y1="118"
        x2="138"
        y2="110"
        stroke="#8a9299"
        strokeWidth="1"
      />
      <line
        x1="204"
        y1="118"
        x2="176"
        y2="114"
        stroke="#8a9299"
        strokeWidth="1"
      />
    </svg>
  )
}
