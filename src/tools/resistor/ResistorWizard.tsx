import { useMemo, useState } from 'react'
import {
  COLORS,
  defaultBands,
  slotsForBands,
  type BandColor,
  type BandCount,
} from './colors'
import { decodeResistor } from './decode'
import { ResistorGraphic } from './ResistorGraphic'
import './ResistorWizard.css'

const BAND_OPTIONS: BandCount[] = [4, 5, 6]

export function ResistorWizard() {
  const [bandCount, setBandCount] = useState<BandCount>(4)
  const [bands, setBands] = useState<BandColor[]>(() => defaultBands(4))

  const slots = useMemo(() => slotsForBands(bandCount), [bandCount])

  const result = useMemo(() => {
    try {
      return { ok: true as const, value: decodeResistor(bands, bandCount) }
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Invalid color combination',
      }
    }
  }, [bands, bandCount])

  function handleBandCountChange(next: BandCount) {
    setBandCount(next)
    setBands(defaultBands(next))
  }

  function handleBandChange(index: number, color: BandColor) {
    setBands((prev) => {
      const next = [...prev]
      next[index] = color
      return next
    })
  }

  return (
    <section className="wizard" aria-labelledby="wizard-title">
      <header className="wizard-header">
        <p className="wizard-kicker">Decode</p>
        <h1 id="wizard-title" className="wizard-title">
          Resistor color code
        </h1>
        <p className="wizard-lede">
          Pick band count, tap each stripe, read resistance and tolerance.
        </p>
      </header>

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

      <ResistorGraphic bands={bands} bandCount={bandCount} />

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
          </>
        ) : (
          <p className="readout-error">{result.message}</p>
        )}
      </div>

      <ol className="band-list">
        {slots.map((slot, index) => {
          const selected = bands[index]
          return (
            <li key={slot.key} className="band-row">
              <div className="band-row-label">
                <span className="band-index">{index + 1}</span>
                <span>
                  <span className="band-name">{slot.label}</span>
                  <span className="band-selected">{COLORS[selected].label}</span>
                </span>
              </div>
              <div
                className="swatch-row"
                role="radiogroup"
                aria-label={`${slot.label} color`}
              >
                {slot.options.map((color) => {
                  const def = COLORS[color]
                  const isSelected = selected === color
                  return (
                    <button
                      key={color}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={def.label}
                      title={def.label}
                      className={`swatch${isSelected ? ' is-selected' : ''}`}
                      style={{
                        backgroundColor: def.hex,
                        color: def.onHex,
                      }}
                      onClick={() => handleBandChange(index, color)}
                    />
                  )
                })}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
