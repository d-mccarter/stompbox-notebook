import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { COLORS, type BandColor, type BandCount, type BandSlot } from './colors'
import { swatchAriaLabel, swatchValueLabel } from './encode'
import { bandCenterPercents, RESISTOR_VIEW } from './layout'
import { ResistorGraphic } from './ResistorGraphic'
import './DecodeBoard.css'

interface DecodeBoardProps {
  bands: BandColor[]
  bandCount: BandCount
  slots: BandSlot[]
  onBandChange: (index: number, color: BandColor) => void
  /** Rendered above the resistor image. */
  readout?: ReactNode
}

interface LeaderSeg {
  x1: number
  y1: number
  x2: number
  y2: number
}

export function DecodeBoard({
  bands,
  bandCount,
  slots,
  onBandChange,
  readout,
}: DecodeBoardProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const resistorRef = useRef<HTMLDivElement>(null)
  const columnHeadRefs = useRef<(HTMLDivElement | null)[]>([])
  const [leaders, setLeaders] = useState<LeaderSeg[]>([])
  const [stageSize, setStageSize] = useState({ w: 1, h: 1 })

  const bandCenters = useMemo(() => bandCenterPercents(bandCount), [bandCount])

  useLayoutEffect(() => {
    const stage = stageRef.current
    const resistor = resistorRef.current
    if (!stage || !resistor) return

    const update = () => {
      const stageBox = stage.getBoundingClientRect()
      const resistorBox = resistor.getBoundingClientRect()
      if (stageBox.width < 1 || stageBox.height < 1) return

      const { bodyY, bodyH, height: viewH } = RESISTOR_VIEW
      const bandBottomRatio = (bodyY + bodyH - 2) / viewH
      const y1 = resistorBox.top - stageBox.top + resistorBox.height * bandBottomRatio

      const next: LeaderSeg[] = bandCenters.map((bandXPercent, i) => {
        const head = columnHeadRefs.current[i]
        const x1 =
          resistorBox.left -
          stageBox.left +
          (bandXPercent / 100) * resistorBox.width

        if (!head) {
          return { x1, y1, x2: x1, y2: y1 }
        }

        const headBox = head.getBoundingClientRect()
        return {
          x1,
          y1,
          x2: headBox.left - stageBox.left + headBox.width / 2,
          y2: headBox.top - stageBox.top,
        }
      })

      setStageSize({ w: stageBox.width, h: stageBox.height })
      setLeaders(next)
    }

    update()
    const frame = requestAnimationFrame(update)
    const timeout = window.setTimeout(update, 50)

    const ro = new ResizeObserver(update)
    ro.observe(stage)
    ro.observe(resistor)
    columnHeadRefs.current.forEach((el) => {
      if (el) ro.observe(el)
    })

    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [bandCenters, bandCount, slots.length])

  return (
    <div className="decode-board">
      {readout ? <div className="decode-readout-slot">{readout}</div> : null}

      <div className="decode-link-stage" ref={stageRef}>
        <svg
          className="leader-overlay"
          width={stageSize.w}
          height={stageSize.h}
          viewBox={`0 0 ${stageSize.w} ${stageSize.h}`}
          aria-hidden="true"
        >
          {leaders.map((seg, i) => (
            <line
              key={`leader-${i}`}
              className="leader-line"
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
            />
          ))}
        </svg>

        <div className="resistor-wrap" ref={resistorRef}>
          <ResistorGraphic bands={bands} bandCount={bandCount} />
        </div>

        <div
          className="band-columns"
          style={{ ['--band-count' as string]: bandCount }}
        >
          {slots.map((slot, index) => {
            const selected = bands[index]
            return (
              <div key={slot.key} className="band-column">
                <div
                  className="band-column-head"
                  ref={(el) => {
                    columnHeadRefs.current[index] = el
                  }}
                >
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
