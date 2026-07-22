export interface LedColorPreset {
  id: string
  label: string
  /** Typical forward voltage (V) */
  vf: number
  vfRange: string
  /** Suggested series resistor at 9 V / 10 mA */
  rAt9v10mA: number
  note: string
  swatch: string
}

/** Common indicator LED forward voltages for pedal work. */
export const LED_COLOR_PRESETS: LedColorPreset[] = [
  {
    id: 'red',
    label: 'Red',
    vf: 2.0,
    vfRange: '1.8–2.2 V',
    rAt9v10mA: 680,
    note: 'Most common status LED on pedals.',
    swatch: '#c0392b',
  },
  {
    id: 'orange',
    label: 'Orange / amber',
    vf: 2.0,
    vfRange: '1.9–2.2 V',
    rAt9v10mA: 680,
    note: 'Similar drop to red.',
    swatch: '#e67e22',
  },
  {
    id: 'yellow',
    label: 'Yellow',
    vf: 2.1,
    vfRange: '2.0–2.2 V',
    rAt9v10mA: 680,
    note: 'Slightly higher Vf than red.',
    swatch: '#d4a017',
  },
  {
    id: 'green',
    label: 'Green (std)',
    vf: 2.2,
    vfRange: '2.0–2.4 V',
    rAt9v10mA: 680,
    note: 'Older GaP greens; bright “true green” is closer to blue.',
    swatch: '#1e8449',
  },
  {
    id: 'green-bright',
    label: 'Green (bright)',
    vf: 3.2,
    vfRange: '3.0–3.4 V',
    rAt9v10mA: 560,
    note: 'Modern InGaN greens need more headroom.',
    swatch: '#27ae60',
  },
  {
    id: 'blue',
    label: 'Blue',
    vf: 3.2,
    vfRange: '3.0–3.5 V',
    rAt9v10mA: 560,
    note: 'Needs higher Vf; check datasheet.',
    swatch: '#2471a3',
  },
  {
    id: 'white',
    label: 'White',
    vf: 3.2,
    vfRange: '3.0–3.6 V',
    rAt9v10mA: 560,
    note: 'Treated like blue for resistor math.',
    swatch: '#f5f5f0',
  },
  {
    id: 'ir',
    label: 'Infrared',
    vf: 1.3,
    vfRange: '1.2–1.5 V',
    rAt9v10mA: 820,
    note: 'Optocouplers / photocells — not a panel indicator.',
    swatch: '#6b3f2a',
  },
]

const E24 = [
  1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3,
  4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1,
]

export interface LimiterResult {
  ohmsExact: number
  ohmsNearestE24: number
  powerWatts: number
  valid: boolean
  message: string | null
}

/** R = (Vs − Vf) / I  — series current-limiting resistor. */
export function calculateLimiterResistor(
  supplyVolts: number,
  forwardVolts: number,
  currentMa: number,
): LimiterResult {
  if (![supplyVolts, forwardVolts, currentMa].every(Number.isFinite)) {
    return invalid('Enter numeric supply, Vf, and current values')
  }
  if (supplyVolts <= 0 || currentMa <= 0) {
    return invalid('Supply voltage and LED current must be greater than zero')
  }
  if (forwardVolts < 0) {
    return invalid('Forward voltage cannot be negative')
  }
  if (forwardVolts >= supplyVolts) {
    return invalid('Vf must be lower than the supply voltage for current to flow')
  }

  const currentA = currentMa / 1000
  const ohmsExact = (supplyVolts - forwardVolts) / currentA
  const ohmsNearestE24 = nearestE24AtOrAbove(ohmsExact)
  const powerWatts = (supplyVolts - forwardVolts) * currentA

  return {
    ohmsExact,
    ohmsNearestE24,
    powerWatts,
    valid: true,
    message: null,
  }
}

function invalid(message: string): LimiterResult {
  return {
    ohmsExact: 0,
    ohmsNearestE24: 0,
    powerWatts: 0,
    valid: false,
    message,
  }
}

/** Prefer the next E24 value at or above the exact ohms (slightly less LED current). */
export function nearestE24AtOrAbove(ohms: number): number {
  if (!Number.isFinite(ohms) || ohms <= 0) return 0

  let bestAbove = Infinity
  let bestNear = ohms
  let bestNearErr = Infinity

  for (let exp = -1; exp <= 6; exp++) {
    const decade = 10 ** exp
    for (const mant of E24) {
      const candidate = mant * decade
      const err = Math.abs(candidate - ohms)
      if (err < bestNearErr) {
        bestNearErr = err
        bestNear = candidate
      }
      if (candidate >= ohms && candidate < bestAbove) {
        bestAbove = candidate
      }
    }
  }

  if (!Number.isFinite(bestAbove)) return bestNear
  // If the next-up value is extreme, fall back to absolute nearest.
  if (bestAbove > ohms * 1.5) return bestNear
  return bestAbove
}

export function formatOhms(ohms: number): string {
  if (!Number.isFinite(ohms) || ohms <= 0) return '—'
  if (ohms >= 1_000_000) return trim(ohms / 1_000_000) + ' MΩ'
  if (ohms >= 1_000) return trim(ohms / 1_000) + ' kΩ'
  return trim(ohms) + ' Ω'
}

export function formatWatts(watts: number): string {
  if (!Number.isFinite(watts) || watts < 0) return '—'
  if (watts < 0.001) return `${(watts * 1_000_000).toFixed(0)} µW`
  if (watts < 1) return `${(watts * 1000).toFixed(0)} mW`
  return `${watts.toFixed(2)} W`
}

function trim(n: number): string {
  const rounded = Number(n.toPrecision(3))
  return Number.isInteger(rounded)
    ? String(rounded)
    : String(rounded).replace(/\.?0+$/, '')
}
