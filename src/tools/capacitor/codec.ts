export type CapUnit = 'pF' | 'nF' | 'uF' | 'mF'

export interface CapDecodeResult {
  picofarads: number
  code: string
  formattedValue: string
  toleranceLabel: string | null
  multiplierDigit: number | null
}

export interface CapEncodeResult {
  code: string
  picofarads: number
  formattedValue: string
  exact: boolean
}

const TOLERANCE_LETTERS: Record<string, string> = {
  B: '±0.1 pF',
  C: '±0.25 pF',
  D: '±0.5 pF',
  F: '±1%',
  G: '±2%',
  H: '±3%',
  J: '±5%',
  K: '±10%',
  M: '±20%',
  Z: '+80%/−20%',
}

export function formatCapacitance(picofarads: number): string {
  const abs = Math.abs(picofarads)
  if (abs === 0) return '0 pF'

  const fmt = (n: number, unit: string) => {
    const rounded = Number(n.toPrecision(6))
    const text = Number.isInteger(rounded)
      ? String(rounded)
      : String(rounded).replace(/\.?0+$/, '')
    return `${text} ${unit}`
  }

  if (abs >= 1_000_000_000) return fmt(picofarads / 1_000_000_000, 'mF')
  if (abs >= 1_000_000) return fmt(picofarads / 1_000_000, 'µF')
  if (abs >= 1_000) return fmt(picofarads / 1_000, 'nF')
  return fmt(picofarads, 'pF')
}

export function unitToPicofarads(value: number, unit: CapUnit): number {
  switch (unit) {
    case 'pF':
      return value
    case 'nF':
      return value * 1_000
    case 'uF':
      return value * 1_000_000
    case 'mF':
      return value * 1_000_000_000
  }
}

/**
 * Decode EIA numeric capacitor markings.
 * Examples: 105 → 1 µF, 104 → 100 nF, 473 → 47 nF, 47 → 47 pF, 4R7 → 4.7 pF
 * Optional trailing tolerance letter: 105K → 1 µF ±10%
 */
export function decodeCapCode(raw: string): CapDecodeResult {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, '')
  if (!cleaned) throw new Error('Enter a capacitor code like 105 or 473J')

  let body = cleaned
  let toleranceLabel: string | null = null
  const last = body.slice(-1)
  if (/[A-Z]/.test(last) && TOLERANCE_LETTERS[last]) {
    toleranceLabel = TOLERANCE_LETTERS[last]
    body = body.slice(0, -1)
  }

  // Decimal marker form: 4R7 = 4.7 pF
  if (/^\d+R\d+$/.test(body)) {
    const picofarads = Number(body.replace('R', '.'))
    if (!Number.isFinite(picofarads) || picofarads < 0) {
      throw new Error('Invalid decimal capacitor code')
    }
    return {
      picofarads,
      code: cleaned,
      formattedValue: formatCapacitance(picofarads),
      toleranceLabel,
      multiplierDigit: null,
    }
  }

  if (!/^\d{1,3}$/.test(body)) {
    throw new Error('Use 2–3 digits (optionally + tolerance letter), e.g. 105 or 473J')
  }

  let picofarads: number
  let multiplierDigit: number | null = null

  if (body.length <= 2) {
    picofarads = Number(body)
  } else {
    const signif = Number(body.slice(0, 2))
    multiplierDigit = Number(body.slice(2))
    picofarads = signif * 10 ** multiplierDigit
  }

  if (!Number.isFinite(picofarads) || picofarads < 0) {
    throw new Error('Invalid capacitor code')
  }

  return {
    picofarads,
    code: cleaned,
    formattedValue: formatCapacitance(picofarads),
    toleranceLabel,
    multiplierDigit,
  }
}

/** Encode capacitance (in pF) to a standard 2- or 3-digit EIA code. */
export function encodeCapValue(picofarads: number): CapEncodeResult {
  if (!Number.isFinite(picofarads) || picofarads < 0) {
    throw new Error('Capacitance must be a non-negative number')
  }

  if (picofarads === 0) {
    return {
      code: '0',
      picofarads: 0,
      formattedValue: '0 pF',
      exact: true,
    }
  }

  // Tiny values often use R notation when not an integer pF.
  if (picofarads < 10 && !Number.isInteger(picofarads)) {
    const rounded = Number(picofarads.toPrecision(2))
    const text = String(rounded).replace('.', 'R')
    return {
      code: text,
      picofarads: rounded,
      formattedValue: formatCapacitance(rounded),
      exact: Math.abs(rounded - picofarads) <= picofarads * 1e-9,
    }
  }

  if (picofarads < 100 && Number.isInteger(picofarads)) {
    return {
      code: String(picofarads),
      picofarads,
      formattedValue: formatCapacitance(picofarads),
      exact: true,
    }
  }

  // Prefer 2 significant digits + decade multiplier (0–9) in pF.
  let best: { code: string; value: number; error: number } | null = null

  for (let mult = 0; mult <= 9; mult++) {
    const scale = 10 ** mult
    const signif = Math.round(picofarads / scale)
    if (signif < 10 || signif > 99) continue
    const encoded = signif * scale
    const error =
      picofarads === 0 ? Math.abs(encoded) : Math.abs(encoded - picofarads) / picofarads
    const code = `${String(signif).padStart(2, '0')}${mult}`
    if (!best || error < best.error - 1e-15) {
      best = { code, value: encoded, error }
    }
  }

  if (!best) {
    throw new Error('Value is outside the range of standard 3-digit capacitor codes')
  }

  return {
    code: best.code,
    picofarads: best.value,
    formattedValue: formatCapacitance(best.value),
    exact: best.error <= 1e-12,
  }
}

export const CAP_UNIT_OPTIONS: { id: CapUnit; label: string }[] = [
  { id: 'pF', label: 'pF' },
  { id: 'nF', label: 'nF' },
  { id: 'uF', label: 'µF' },
  { id: 'mF', label: 'mF' },
]
