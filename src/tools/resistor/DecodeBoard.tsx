import type { ReactNode } from 'react'
import { COLORS, type BandColor, type BandCount, type BandSlot } from './colors'
import { swatchAriaLabel, swatchValueLabel } from './encode'
import { bandCenterPercents } from './layout'
import { ResistorGraphic } from './ResistorGraphic'
import './DecodeBoard.css'

interface DecodeBoardProps {
  bands: BandColor[]
  bandCount: BandCount
  slots: BandSlot[]
  onBandChange: (index: number, color: BandColor) => void
  /** Rendered between leader lines and color columns (keeps value above tall stacks). */
  readout?: ReactNode
}

/** Evenly spaced column centers across the full board width. */
function columnCenterPercents(count: number): number[] {
  return Array.from({ length: count }, (_, i) => ((i + 0.5) / count) * 100)
}

export function DecodeBoard({
  bands,
  bandCount,
  slots,
  onBandChange,
  readout,
}: DecodeBoardProps) {
  const bandCenters = bandCenterPercents(bandCount)
  const columnCenters = columnCenterPercents(bandCount)

  return (
    <div className="decode-board">
      <ResistorGraphic bands={bands} bandCount={bandCount} withLeaderStubs />

      <svg
        className="leader-lines"
        viewBox="0 0 100 36"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {bandCenters.map((bandX, i) => (
          <line
            key={`leader-${i}`}
            className="leader-line"
            x1={bandX}
            y1="0"
            x2={columnCenters[i]}
            y2="36"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {readout ? <div className="decode-readout-slot">{readout}</div> : null}

      <div
        className="band-columns"
        style={{ ['--band-count' as string]: bandCount }}
      >
        {slots.map((slot, index) => {
          const selected = bands[index]
          return (
            <div key={slot.key} className="band-column">
              <div className="band-column-head">
                <span className="band-column-index">{index + 1}</span>
                <span className="band-column-role">{shortRole(slot.label)}</span>
              </div>
              <div
                className="swatch-column"
                role="radiogroup"
                aria-label={`${slot.label} color`}
              >
                {slot.options.map((color) => {
                  const def = COLORS[color]
                  const isSelected = selected === color
                  const valueLabel = swatchValueLabel(slot.role, color)
                  return (
                    <button
                      key={color}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={swatchAriaLabel(slot.role, color)}
                      title={`${def.label} (${valueLabel})`}
                      className={`swatch swatch-${slot.role}${isSelected ? ' is-selected' : ''}`}
                      style={{
                        backgroundColor: def.hex,
                        color: def.onHex,
                      }}
                      onClick={() => onBandChange(index, color)}
                    >
                      <span className="swatch-value">{valueLabel}</span>
                    </button>
                  )
                })}
              </div>
              <p className="band-column-selected">{COLORS[selected].label}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function shortRole(label: string): string {
  if (label.includes('digit')) return label.replace(' digit', '')
  if (label === 'Multiplier') return 'Mult'
  if (label === 'Tolerance') return 'Tol'
  if (label === 'Tempco') return 'TC'
  return label
}
