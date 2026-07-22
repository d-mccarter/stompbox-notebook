import { COLORS, type BandColor, type BandCount } from './colors'

export interface DecodeResult {
  ohms: number
  tolerancePercent: number
  tempcoPpm: number | null
  formattedValue: string
  formattedTolerance: string
  formattedTempco: string | null
}

function significantDigits(bands: BandColor[], count: BandCount): number {
  const digitCount = count === 4 ? 2 : 3
  let value = 0
  for (let i = 0; i < digitCount; i++) {
    const digit = COLORS[bands[i]].digit
    if (digit === undefined) {
      throw new Error(`Band ${i + 1} (${bands[i]}) is not a valid digit color`)
    }
    value = value * 10 + digit
  }
  return value
}

export function formatResistance(ohms: number): string {
  const abs = Math.abs(ohms)
  if (abs === 0) return '0 Ω'

  const format = (n: number, unit: string) => {
    const rounded = Number(n.toPrecision(6))
    const text = Number.isInteger(rounded)
      ? String(rounded)
      : String(rounded).replace(/\.?0+$/, '')
    return `${text} ${unit}`
  }

  if (abs >= 1_000_000) return format(ohms / 1_000_000, 'MΩ')
  if (abs >= 1_000) return format(ohms / 1_000, 'kΩ')
  if (abs >= 1) return format(ohms, 'Ω')
  if (abs >= 0.001) return format(ohms * 1_000, 'mΩ')
  return format(ohms, 'Ω')
}

export function decodeResistor(bands: BandColor[], count: BandCount): DecodeResult {
  if (bands.length !== count) {
    throw new Error(`Expected ${count} bands, got ${bands.length}`)
  }

  const digits = significantDigits(bands, count)
  const multIndex = count === 4 ? 2 : 3
  const tolIndex = count === 4 ? 3 : 4

  const multiplier = COLORS[bands[multIndex]].multiplier
  if (multiplier === undefined) {
    throw new Error(`Band ${multIndex + 1} (${bands[multIndex]}) is not a valid multiplier`)
  }

  const tolerance = COLORS[bands[tolIndex]].tolerance
  if (tolerance === undefined) {
    throw new Error(`Band ${tolIndex + 1} (${bands[tolIndex]}) is not a valid tolerance`)
  }

  let tempcoPpm: number | null = null
  if (count === 6) {
    const tempco = COLORS[bands[5]].tempco
    if (tempco === undefined) {
      throw new Error(`Band 6 (${bands[5]}) is not a valid temperature coefficient`)
    }
    tempcoPpm = tempco
  }

  const ohms = digits * multiplier

  return {
    ohms,
    tolerancePercent: tolerance,
    tempcoPpm,
    formattedValue: formatResistance(ohms),
    formattedTolerance: `±${tolerance}%`,
    formattedTempco: tempcoPpm === null ? null : `${tempcoPpm} ppm/K`,
  }
}
