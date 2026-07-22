import { COLORS, type BandColor, type BandCount } from './colors'
import { bandBodyPercents, RESISTOR_VIEW } from './layout'
import './ResistorGraphic.css'

interface ResistorGraphicProps {
  bands: BandColor[]
  bandCount: BandCount
}

export function ResistorGraphic({ bands, bandCount }: ResistorGraphicProps) {
  const positions = bandBodyPercents(bandCount)
  const { width, height, bodyX, bodyY, bodyW, bodyH } = RESISTOR_VIEW
  const bandW = bandCount === 6 ? 7 : 8

  return (
    <div className="resistor-graphic" aria-hidden="true">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" className="resistor-svg">
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

        <rect x="8" y="46" width="42" height="8" rx="2" fill="url(#leadGrad)" />
        <rect x="270" y="46" width="42" height="8" rx="2" fill="url(#leadGrad)" />

        <rect x={bodyX} y={bodyY} width={bodyW} height={bodyH} rx="18" fill="url(#bodyGrad)" />
        <rect
          x={bodyX}
          y={bodyY}
          width={bodyW}
          height={bodyH}
          rx="18"
          fill="none"
          stroke="rgba(60,40,20,0.25)"
          strokeWidth="1"
        />

        {bands.slice(0, bandCount).map((color, i) => {
          const x = bodyX + (positions[i] / 100) * bodyW
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
