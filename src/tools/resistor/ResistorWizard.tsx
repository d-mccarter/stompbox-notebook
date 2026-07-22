import { useEffect, useMemo, useState } from 'react'
import {
  COLORS,
  defaultBands,
  slotsForBands,
  type BandColor,
  type BandCount,
} from './colors'
import { DecodeBoard } from './DecodeBoard'
import { decodeResistor } from './decode'
import {
  encodeResistor,
  parseResistanceInput,
  swatchValueLabel,
  TEMPCO_OPTIONS,
  TOLERANCE_OPTIONS,
} from './encode'
import { ResistorGraphic } from './ResistorGraphic'
import './ResistorWizard.css'

const BAND_OPTIONS: BandCount[] = [4, 5, 6]
type WizardMode = 'decode' | 'encode'

export function ResistorWizard() {
  const [mode, setMode] = useState<WizardMode>('decode')
  const [bandCount, setBandCount] = useState<BandCount>(4)
  const [bands, setBands] = useState<BandColor[]>(() => defaultBands(4))

  const [encodeText, setEncodeText] = useState('4.7k')
  const [encodeTolerance, setEncodeTolerance] = useState(5)
  const [encodeTempco, setEncodeTempco] = useState(100)

  const slots = useMemo(() => slotsForBands(bandCount), [bandCount])

  const decodeResult = useMemo(() => {
    try {
      return { ok: true as const, value: decodeResistor(bands, bandCount) }
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Invalid color combination',
      }
    }
  }, [bands, bandCount])

  const encodeResult = useMemo(() => {
    const ohms = parseResistanceInput(encodeText)
    if (ohms === null) {
      return { ok: false as const, message: 'Enter a value like 4.7k, 4700, or 1M' }
    }
    try {
      return {
        ok: true as const,
        value: encodeResistor(
          {
            ohms,
            tolerancePercent: encodeTolerance,
            tempcoPpm: bandCount === 6 ? encodeTempco : null,
          },
          bandCount,
        ),
      }
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Could not encode value',
      }
    }
  }, [encodeText, encodeTolerance, encodeTempco, bandCount])

  useEffect(() => {
    if (mode !== 'encode') return
    if (!encodeResult.ok) return
    setBands(encodeResult.value.bands)
  }, [mode, encodeResult])

  function handleBandCountChange(next: BandCount) {
    setBandCount(next)
    if (mode === 'decode') {
      setBands(defaultBands(next))
    }
  }

  function handleBandChange(index: number, color: BandColor) {
    setBands((prev) => {
      const next = [...prev]
      next[index] = color
      return next
    })
  }

  function handleModeChange(next: WizardMode) {
    if (next === 'encode' && decodeResult.ok) {
      const { ohms, tolerancePercent, tempcoPpm } = decodeResult.value
      setEncodeText(formatEncodePrefill(ohms))
      setEncodeTolerance(tolerancePercent)
      if (tempcoPpm !== null) setEncodeTempco(tempcoPpm)
    }
    setMode(next)
  }

  const activeReadout = mode === 'decode' ? decodeResult : encodeResult

  return (
    <section className="wizard" aria-labelledby="wizard-title">
      <header className="wizard-header">
        <p className="wizard-kicker">Resistor tool</p>
        <h1 id="wizard-title" className="wizard-title">
          Color code
        </h1>
        <p className="wizard-lede">
          {mode === 'decode'
            ? 'Pick band count, tap a color in each column under its stripe.'
            : 'Enter a resistance, pick tolerance, and get the color bands.'}
        </p>
      </header>

      <div className="mode-toggle" role="group" aria-label="Wizard mode">
        {(['decode', 'encode'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={`mode-btn${mode === option ? ' is-active' : ''}`}
            aria-pressed={mode === option}
            onClick={() => handleModeChange(option)}
          >
            {option === 'decode' ? 'Decode' : 'Encode'}
          </button>
        ))}
      </div>

      <div className="band-count" role="group" aria-label="Number of bands">
        {BAND_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            className={`band-count-btn${bandCount === n ? ' is-active' : ''}`}
            aria-pressed={bandCount === n}
            onClick={() => handleBandCountChange(n)}
          >
            {n}-band
          </button>
        ))}
      </div>

      {mode === 'decode' ? (
        <DecodeBoard
          bands={bands}
          bandCount={bandCount}
          slots={slots}
          onBandChange={handleBandChange}
        />
      ) : (
        <ResistorGraphic bands={bands} bandCount={bandCount} />
      )}

      <div className="readout" aria-live="polite">
        {activeReadout.ok ? (
          <>
            <p className="readout-value">{activeReadout.value.formattedValue}</p>
            <p className="readout-meta">
              <span>{activeReadout.value.formattedTolerance}</span>
              {activeReadout.value.formattedTempco ? (
                <>
                  <span className="readout-dot" aria-hidden="true">
                    ·
                  </span>
                  <span>{activeReadout.value.formattedTempco}</span>
                </>
              ) : null}
            </p>
            {mode === 'encode' &&
            'exact' in activeReadout.value &&
            !activeReadout.value.exact ? (
              <p className="readout-note">Nearest encodable value for this band count</p>
            ) : null}
          </>
        ) : (
          <p className="readout-error">{activeReadout.message}</p>
        )}
      </div>

      {mode === 'encode' ? (
        <div className="encode-form">
          <label className="field">
            <span className="field-label">Resistance</span>
            <input
              className="field-input"
              type="text"
              inputMode="decimal"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="e.g. 4.7k"
              value={encodeText}
              onChange={(e) => setEncodeText(e.target.value)}
              aria-describedby="encode-hint"
            />
            <span id="encode-hint" className="field-hint">
              Use Ω / k / M suffixes — 4700, 4.7k, or 1M
            </span>
          </label>

          <label className="field">
            <span className="field-label">Tolerance</span>
            <select
              className="field-input"
              value={encodeTolerance}
              onChange={(e) => setEncodeTolerance(Number(e.target.value))}
            >
              {TOLERANCE_OPTIONS.map((opt) => (
                <option key={opt.color} value={opt.value}>
                  {opt.label} ({COLORS[opt.color].label})
                </option>
              ))}
            </select>
          </label>

          {bandCount === 6 ? (
            <label className="field">
              <span className="field-label">Tempco</span>
              <select
                className="field-input"
                value={encodeTempco}
                onChange={(e) => setEncodeTempco(Number(e.target.value))}
              >
                {TEMPCO_OPTIONS.map((opt) => (
                  <option key={opt.color} value={opt.value}>
                    {opt.label} ({COLORS[opt.color].label})
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {encodeResult.ok ? (
            <ol className="encode-band-summary">
              {slots.map((slot, index) => (
                <li key={slot.key}>
                  <span className="encode-band-index">{index + 1}</span>
                  <span
                    className="encode-band-swatch"
                    style={{ backgroundColor: COLORS[encodeResult.value.bands[index]].hex }}
                  />
                  <span>
                    {COLORS[encodeResult.value.bands[index]].label}
                    <span className="encode-band-value">
                      {' '}
                      · {swatchValueLabel(slot.role, encodeResult.value.bands[index])}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function formatEncodePrefill(ohms: number): string {
  if (ohms === 0) return '0'
  if (ohms >= 1_000_000) {
    const n = ohms / 1_000_000
    return trimNum(n) + 'M'
  }
  if (ohms >= 1_000) {
    const n = ohms / 1_000
    return trimNum(n) + 'k'
  }
  return trimNum(ohms)
}

function trimNum(n: number): string {
  const rounded = Number(n.toPrecision(6))
  return Number.isInteger(rounded)
    ? String(rounded)
    : String(rounded).replace(/\.?0+$/, '')
}
