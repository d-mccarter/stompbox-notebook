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
  ohmsFromMagnitudeAndPrefix,
  SI_PREFIX_OPTIONS,
  splitOhmsForInput,
  swatchValueLabel,
  TEMPCO_OPTIONS,
  TOLERANCE_OPTIONS,
  type SiPrefixId,
} from './encode'
import { ResistorGraphic } from './ResistorGraphic'
import './ResistorWizard.css'

const BAND_OPTIONS: BandCount[] = [4, 5, 6]
type WizardMode = 'decode' | 'encode'

export function ResistorWizard() {
  const [mode, setMode] = useState<WizardMode>('decode')
  const [bandCount, setBandCount] = useState<BandCount>(4)
  const [bands, setBands] = useState<BandColor[]>(() => defaultBands(4))

  const [encodeMagnitude, setEncodeMagnitude] = useState('4.7')
  const [encodePrefix, setEncodePrefix] = useState<SiPrefixId>('k')
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
    const ohms = ohmsFromMagnitudeAndPrefix(encodeMagnitude, encodePrefix)
    if (ohms === null) {
      return { ok: false as const, message: 'Enter a numeric resistance value' }
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
  }, [encodeMagnitude, encodePrefix, encodeTolerance, encodeTempco, bandCount])

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
      const split = splitOhmsForInput(ohms)
      setEncodeMagnitude(split.magnitude)
      setEncodePrefix(split.prefixId)
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
          readout={<Readout result={activeReadout} mode={mode} />}
        />
      ) : (
        <>
          <ResistorGraphic bands={bands} bandCount={bandCount} />
          <Readout result={activeReadout} mode={mode} />
        </>
      )}

      {mode === 'encode' ? (
        <div className="encode-form">
          <div className="field">
            <span className="field-label" id="resistance-label">
              Resistance
            </span>
            <div className="resistance-row">
              <input
                className="field-input resistance-magnitude"
                type="text"
                inputMode="decimal"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="4.7"
                value={encodeMagnitude}
                onChange={(e) => setEncodeMagnitude(e.target.value)}
                aria-labelledby="resistance-label"
                aria-describedby="encode-hint"
              />
              <select
                className="field-input resistance-prefix"
                value={encodePrefix}
                onChange={(e) => setEncodePrefix(e.target.value as SiPrefixId)}
                aria-label="SI prefix"
              >
                {SI_PREFIX_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <span id="encode-hint" className="field-hint">
              Enter the number, then choose mΩ / Ω / kΩ / MΩ / GΩ
            </span>
          </div>

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

type ReadoutResult =
  | { ok: true; value: { formattedValue: string; formattedTolerance: string; formattedTempco: string | null; exact?: boolean } }
  | { ok: false; message: string }

function Readout({
  result,
  mode,
}: {
  result: ReadoutResult
  mode: WizardMode
}) {
  return (
    <div className="readout" aria-live="polite">
      {result.ok ? (
        <>
          <p className="readout-value">{result.value.formattedValue}</p>
          <p className="readout-meta">
            <span>{result.value.formattedTolerance}</span>
            {result.value.formattedTempco ? (
              <>
                <span className="readout-dot" aria-hidden="true">
                  ·
                </span>
                <span>{result.value.formattedTempco}</span>
              </>
            ) : null}
          </p>
          {mode === 'encode' &&
          'exact' in result.value &&
          result.value.exact === false ? (
            <p className="readout-note">Nearest encodable value for this band count</p>
          ) : null}
        </>
      ) : (
        <p className="readout-error">{result.message}</p>
      )}
    </div>
  )
}

