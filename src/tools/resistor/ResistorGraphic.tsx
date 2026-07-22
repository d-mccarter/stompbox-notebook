import { COLORS, type BandColor, type BandCount } from './colors'
import './ResistorGraphic.css'

interface ResistorGraphicProps {
  bands: BandColor[]
  bandCount: BandCount
}

/** Band x positions as percentages of the body width (after lead inset). */
function bandPositions(count: BandCount): number[] {
  if (count === 4) return [18, 32, 46, 72]
  if (count === 5) return [14, 26, 38, 50, 72]
  return [12, 22, 32, 42, 62, 76]
}

export function ResistorGraphic({ bands, bandCount }: ResistorGraphicProps) {
  const positions = bandPositions(bandCount)
  const bodyY = 28
  const bodyH = 44
  const bandW = bandCount === 6 ? 7 : 8

  return (
    <div className="resistor-graphic" aria-hidden="true">
      <svg viewBox="0 0 320 100" role="img" className="resistor-svg">
        <defs>
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d8c4a0" />
            <stop offset="45%" stopColor="#c4a574" />
            <stop offset="100%" stopColor="#a88758" />
          </linearGradient>
          <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d0d4d8" />
            <stop offset="100%" stopColor="#8a9299" />
          </linearGradient>
        </defs>

        {/* Leads */}
        <rect x="8" y="46" width="42" height="8" rx="2" fill="url(#leadGrad)" />
        <rect x="270" y="46" width="42" height="8" rx="2" fill="url(#leadGrad)" />

        {/* Body */}
        <rect x="48" y={bodyY} width="224" height={bodyH} rx="18" fill="url(#bodyGrad)" />
        <rect
          x="48"
          y={bodyY}
          width="224"
          height={bodyH}
          rx="18"
          fill="none"
          stroke="rgba(60,40,20,0.25)"
          strokeWidth="1"
        />

        {/* Color bands */}
        {bands.slice(0, bandCount).map((color, i) => {
          const x = 48 + (positions[i] / 100) * 224
          return (
            <rect
              key={`${i}-${color}`}
              x={x - bandW / 2}
              y={bodyY + 2}
              width={bandW}
              height={bodyH - 4}
              rx="1.5"
              fill={COLORS[color].hex}
              stroke="rgba(0,0,0,0.18)"
              strokeWidth="0.5"
            >
              <title>{COLORS[color].label}</title>
            </rect>
          )
        })}
      </svg>
    </div>
  )
}
