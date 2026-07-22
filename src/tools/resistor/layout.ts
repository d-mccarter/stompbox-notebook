import type { BandCount } from './colors'

/** Shared geometry for the horizontal resistor SVG (viewBox 0 0 320 100). */
export const RESISTOR_VIEW = {
  width: 320,
  height: 100,
  bodyX: 48,
  bodyY: 28,
  bodyW: 224,
  bodyH: 44,
} as const

/** Band centers as % of the resistor body width. */
export function bandBodyPercents(count: BandCount): number[] {
  if (count === 4) return [18, 32, 46, 72]
  if (count === 5) return [14, 26, 38, 50, 72]
  return [12, 22, 32, 42, 62, 76]
}

/** Band center X as % of the full graphic width (including leads). */
export function bandCenterPercents(count: BandCount): number[] {
  const { width, bodyX, bodyW } = RESISTOR_VIEW
  return bandBodyPercents(count).map((p) => ((bodyX + (p / 100) * bodyW) / width) * 100)
}
