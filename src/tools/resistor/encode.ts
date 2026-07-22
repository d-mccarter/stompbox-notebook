import {
  COLORS,
  MULTIPLIER_COLORS,
  TEMPCO_COLORS,
  TOLERANCE_COLORS,
  type BandColor,
  type BandCount,
  type BandRole,
} from './colors'
import { formatResistance } from './decode'

export interface EncodeInput {
  ohms: number
  tolerancePercent: number
  tempcoPpm: number | null
}

export interface EncodeResult {
  bands: BandColor[]
  ohms: number
  tolerancePercent: number
  tempcoPpm: number | null
  formattedValue: string
  formattedTolerance: string
  formattedTempco: string | null
  exact: boolean
}

type EncodeCandidate = {
  digits: number
  multiplier: number
  multColor: BandColor
  error: number
}

function colorForDigit(digit: number): BandColor {
  const match = (Object.keys(COLORS) as BandColor[]).find(
    (id) => COLORS[id].digit === digit,
  )
  if (!match) throw new Error(`No color for digit ${digit}`)
  return match
}

function colorForTolerance(tolerancePercent: number): BandColor {
  const match = TOLERANCE_COLORS.find(
    (id) => COLORS[id].tolerance === tolerancePercent,
  )
  if (!match) throw new Error(`No color for tolerance ±${tolerancePercent}%`)
  return match
}

function colorForTempco(tempcoPpm: number): BandColor {
  const match = TEMPCO_COLORS.find((id) => COLORS[id].tempco === tempcoPpm)
  if (!match) throw new Error(`No color for tempco ${tempcoPpm} ppm/K`)
  return match
}

function formatCompactMultiplier(multiplier: number): string {
  if (multiplier >= 1_000_000_000) return `${multiplier / 1_000_000_000}G`
  if (multiplier >= 1_000_000) return `${multiplier / 1_000_000}M`
  if (multiplier >= 1_000) return `${multiplier / 1_000}k`
  if (multiplier < 1) return String(multiplier)
  return String(multiplier)
}

/** Numeric / code label shown on a color swatch for a given band role. */
export function swatchValueLabel(role: BandRole, color: BandColor): string {
  const def = COLORS[color]
  switch (role) {
    case 'digit':
      return def.digit === undefined ? '—' : String(def.digit)
    case 'multiplier':
      return def.multiplier === undefined
        ? '—'
        : `×${formatCompactMultiplier(def.multiplier)}`
    case 'tolerance':
      return def.tolerance === undefined ? '—' : `±${def.tolerance}%`
    case 'tempco':
      return def.tempco === undefined ? '—' : `${def.tempco}`
  }
}

export function swatchAriaLabel(role: BandRole, color: BandColor): string {
  const def = COLORS[color]
  const value = swatchValueLabel(role, color)
  switch (role) {
    case 'digit':
      return `${def.label}, digit ${value}`
    case 'multiplier':
      return `${def.label}, multiplier ${value}`
    case 'tolerance':
      return `${def.label}, tolerance ${value}`
    case 'tempco':
      return `${def.label}, ${value} ppm per kelvin`
  }
}

/**
 * Parse resistance text like "4.7k", "4700", "1M", "0.47", "4.7 kΩ".
 * Returns ohms, or null if invalid.
 */
export function parseResistanceInput(raw: string): number | null {
  const cleaned = raw.trim().replace(/\s+/g, '').replace(/Ω/gi, '')
  if (!cleaned) return null

  const match = cleaned.match(/^([+-]?\d*\.?\d+(?:e[+-]?\d+)?)([a-zA-Zµu]*)$/i)
  if (!match) return null

  const magnitude = Number(match[1])
  if (!Number.isFinite(magnitude) || magnitude < 0) return null

  const unit = match[2].toLowerCase()
  const factors: Record<string, number> = {
    '': 1,
    r: 1,
    ohm: 1,
    ohms: 1,
    k: 1_000,
    kohm: 1_000,
    kohms: 1_000,
    m: 1_000_000,
    mohm: 1_000_000,
    mohms: 1_000_000,
    g: 1_000_000_000,
    gohm: 1_000_000_000,
    // milliohms if explicitly "mohm" is mega above; use "mill" / "mΩ" variants:
    mill: 0.001,
    milli: 0.001,
  }

  // Ambiguity: bare "m" usually means mega in resistor notation (1M).
  // Support "mohm" as mega, and "mill" for milliohms.
  if (!(unit in factors)) return null

  return magnitude * factors[unit]
}

export function encodeResistor(
  input: EncodeInput,
  count: BandCount,
): EncodeResult {
  if (!Number.isFinite(input.ohms) || input.ohms < 0) {
    throw new Error('Resistance must be a non-negative number')
  }

  const digitCount = count === 4 ? 2 : 3
  const maxSig = 10 ** digitCount - 1

  let best: EncodeCandidate | null = null

  for (const multColor of MULTIPLIER_COLORS) {
    const multiplier = COLORS[multColor].multiplier
    if (multiplier === undefined || multiplier <= 0) continue

    const rawDigits = input.ohms / multiplier
    if (rawDigits < 0 || rawDigits > maxSig + 0.5) continue

    const digits = Math.round(rawDigits)
    if (digits < 0 || digits > maxSig) continue

    // Prefer representations that use the expected significant-figure width
    // when the value is large enough (e.g. 470 not 047 for 5-band when possible).
    const encoded = digits * multiplier
    const error = Math.abs(encoded - input.ohms)
    const relative = input.ohms === 0 ? error : error / input.ohms

    const candidate: EncodeCandidate = { digits, multiplier, multColor, error: relative }

    if (
      !best ||
      candidate.error < best.error - 1e-15 ||
      (Math.abs(candidate.error - best.error) <= 1e-15 &&
        preferCandidate(candidate, best, digitCount))
    ) {
      best = candidate
    }
  }

  if (!best) {
    throw new Error('Value is outside the range that this band count can encode')
  }

  const digitColors: BandColor[] = []
  let remaining = best.digits
  for (let i = digitCount - 1; i >= 0; i--) {
    const place = 10 ** i
    const d = Math.floor(remaining / place)
    digitColors.push(colorForDigit(d))
    remaining -= d * place
  }

  const tolColor = colorForTolerance(input.tolerancePercent)
  const bands: BandColor[] = [...digitColors, best.multColor, tolColor]

  let tempcoPpm: number | null = null
  if (count === 6) {
    if (input.tempcoPpm === null) {
      throw new Error('Temperature coefficient is required for 6-band encoding')
    }
    bands.push(colorForTempco(input.tempcoPpm))
    tempcoPpm = input.tempcoPpm
  }

  const exactOhms = best.digits * best.multiplier

  return {
    bands,
    ohms: exactOhms,
    tolerancePercent: input.tolerancePercent,
    tempcoPpm,
    formattedValue: formatResistance(exactOhms),
    formattedTolerance: `±${input.tolerancePercent}%`,
    formattedTempco: tempcoPpm === null ? null : `${tempcoPpm} ppm/K`,
    exact: Math.abs(exactOhms - input.ohms) <= Math.max(1e-12, input.ohms * 1e-12),
  }
}

function preferCandidate(a: EncodeCandidate, b: EncodeCandidate, digitCount: number): boolean {
  // Prefer fewer leading zeros when both are equally accurate.
  const aWidth = a.digits === 0 ? 1 : Math.floor(Math.log10(a.digits)) + 1
  const bWidth = b.digits === 0 ? 1 : Math.floor(Math.log10(b.digits)) + 1
  const aScore = Math.abs(aWidth - digitCount)
  const bScore = Math.abs(bWidth - digitCount)
  if (aScore !== bScore) return aScore < bScore
  // Prefer larger multiplier (fewer significant trailing conceptual zeros via digits)
  return a.multiplier > b.multiplier
}

export const TOLERANCE_OPTIONS = TOLERANCE_COLORS.map((id) => ({
  color: id,
  value: COLORS[id].tolerance!,
  label: `±${COLORS[id].tolerance}%`,
}))

export const TEMPCO_OPTIONS = TEMPCO_COLORS.map((id) => ({
  color: id,
  value: COLORS[id].tempco!,
  label: `${COLORS[id].tempco} ppm/K`,
}))
