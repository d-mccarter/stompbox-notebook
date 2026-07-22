export interface LedColorPreset {
  id: string
  label: string
  /** Typical forward voltage (V) */
  vf: number
  vfRange: string
  swatch: string
}

/** Common indicator LED forward voltages for pedal work. */
export const LED_COLOR_PRESETS: LedColorPreset[] = [
  {
    id: 'red',
    label: 'Red',
    vf: 2.0,
    vfRange: '1.8–2.2 V',
    swatch: '#ff0000',
  },
  {
    id: 'orange',
    label: 'Orange',
    vf: 2.1,
    vfRange: '2.0–2.2 V',
    swatch: '#ff8c00',
  },
  {
    id: 'yellow',
    label: 'Yellow',
    vf: 2.1,
    vfRange: '2.0–2.2 V',
    swatch: '#ffd700',
  },
  {
    id: 'green',
    label: 'Green',
    vf: 2.1,
    vfRange: '2.0–2.2 V',
    swatch: '#00cc00',
  },
  {
    id: 'green-bright',
    label: 'Green (bright)',
    vf: 3.3,
    vfRange: '3.0–3.5 V',
    swatch: '#00ff44',
  },
  {
    id: 'blue',
    label: 'Blue',
    vf: 3.2,
    vfRange: '3.0–3.4 V',
    swatch: '#0066ff',
  },
  {
    id: 'white',
    label: 'White',
    vf: 3.2,
    vfRange: '3.0–3.4 V',
    swatch: '#ffffff',
  },
]

export interface BrightnessPreset {
  id: string
  label: string
  mcd: number
}

/** Typical datasheet luminous-intensity ballparks. */
export const RATED_BRIGHTNESS_PRESETS: BrightnessPreset[] = [
  { id: 'diffused', label: 'Standard diffused · ~50 mcd', mcd: 50 },
  { id: 'high', label: 'High-brightness · ~1000 mcd', mcd: 1000 },
  { id: 'ultra', label: 'Waterclear ultrabright · ~8000 mcd', mcd: 8000 },
]

export interface TargetBrightnessPreset {
  id: string
  label: string
  /** Target mcd, or null for custom / set-current modes */
  mcd: number | null
  mode: 'preset' | 'custom' | 'current'
}

export const TARGET_BRIGHTNESS_PRESETS: TargetBrightnessPreset[] = [
  { id: 'bright', label: 'Bright · lit room', mcd: 800, mode: 'preset' },
  { id: 'normal', label: 'Normal indicator', mcd: 250, mode: 'preset' },
  { id: 'dim', label: 'Dim · dark stage', mcd: 60, mode: 'preset' },
  { id: 'custom', label: 'Custom mcd…', mcd: null, mode: 'custom' },
  { id: 'current', label: 'Set current…', mcd: null, mode: 'current' },
]

const E24_BASE = [
  10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56,
  62, 68, 75, 82, 91,
]

const E24: number[] = (() => {
  const values: number[] = []
  for (let exp = 0; exp <= 6; exp++) {
    const mult = 10 ** exp
    for (const base of E24_BASE) values.push(base * mult)
  }
  return values
})()

/** Floor / ceiling for derived drive current (standard 5mm LED). */
export const CURRENT_FLOOR_MA = 0.3
export const CURRENT_CEIL_MA = 20

export interface DriveCurrent {
  ma: number
  rawMa: number
  clampLo: boolean
  clampHi: boolean
  valid: boolean
}

/**
 * Luminous intensity scales ~linearly with forward current:
 * I = I_test × (mcd_target / mcd_rated), clamped to a sane floor and 20 mA.
 */
export function calculateDriveCurrent(
  ratedMcd: number,
  testCurrentMa: number,
  targetMcd: number,
): DriveCurrent {
  if (
    ![ratedMcd, testCurrentMa, targetMcd].every(Number.isFinite) ||
    ratedMcd <= 0 ||
    testCurrentMa <= 0 ||
    targetMcd <= 0
  ) {
    return { ma: NaN, rawMa: NaN, clampLo: false, clampHi: false, valid: false }
  }

  const rawMa = testCurrentMa * (targetMcd / ratedMcd)
  const ma = clamp(rawMa, CURRENT_FLOOR_MA, CURRENT_CEIL_MA)
  return {
    ma,
    rawMa,
    clampLo: rawMa < CURRENT_FLOOR_MA,
    clampHi: rawMa > CURRENT_CEIL_MA,
    valid: true,
  }
}

export interface LimiterResult {
  ohmsExact: number
  ohmsNearestE24: number
  ohmsBelowE24: number
  nearbyE24: number[]
  voltageDrop: number
  powerWatts: number
  driveMa: number
  totalVf: number
  numLeds: number
  valid: boolean
  message: string | null
}

export interface LimiterOptions {
  supplyVolts: number
  forwardVolts: number
  currentMa: number
  numLeds?: number
}

/** R = (Vs − n·Vf) / I — series current-limiting resistor. */
export function calculateLimiterResistor(options: LimiterOptions): LimiterResult {
  const { supplyVolts, forwardVolts, currentMa } = options
  const numLeds = Math.max(1, Math.floor(options.numLeds ?? 1))
  const totalVf = forwardVolts * numLeds

  if (![supplyVolts, forwardVolts, currentMa].every(Number.isFinite)) {
    return invalid('Enter numeric supply, Vf, and current values')
  }
  if (supplyVolts <= 0 || currentMa <= 0) {
    return invalid('Supply voltage and LED current must be greater than zero')
  }
  if (forwardVolts <= 0) {
    return invalid('Forward voltage must be greater than zero')
  }
  if (totalVf >= supplyVolts) {
    return invalid(
      numLeds > 1
        ? `Not enough voltage — ${numLeds} × ${trim(forwardVolts)} V = ${trim(totalVf)} V meets or exceeds the ${trim(supplyVolts)} V supply`
        : 'Vf must be lower than the supply voltage for current to flow',
    )
  }

  const currentA = currentMa / 1000
  const voltageDrop = supplyVolts - totalVf
  const ohmsExact = voltageDrop / currentA
  const ohmsNearestE24 = nearestE24Above(ohmsExact)
  const ohmsBelowE24 = nearestE24Below(ohmsExact)
  const nearbyE24 = nearbyE24Around(ohmsNearestE24)
  const powerWatts = voltageDrop * currentA

  return {
    ohmsExact,
    ohmsNearestE24,
    ohmsBelowE24,
    nearbyE24,
    voltageDrop,
    powerWatts,
    driveMa: currentMa,
    totalVf,
    numLeds,
    valid: true,
    message: null,
  }
}

/** Actual current / power / estimated mcd for a chosen resistor. */
export function evaluateChosenResistor(
  voltageDrop: number,
  ohms: number,
  ratedMcd: number,
  testCurrentMa: number,
): {
  actualCurrentA: number
  powerWatts: number
  emittedMcd: number | null
} {
  const actualCurrentA = voltageDrop / ohms
  const powerWatts = voltageDrop * actualCurrentA
  let emittedMcd: number | null = null
  if (
    Number.isFinite(ratedMcd) &&
    ratedMcd > 0 &&
    Number.isFinite(testCurrentMa) &&
    testCurrentMa > 0
  ) {
    emittedMcd = (ratedMcd * (actualCurrentA * 1000)) / testCurrentMa
  }
  return { actualCurrentA, powerWatts, emittedMcd }
}

function invalid(message: string): LimiterResult {
  return {
    ohmsExact: 0,
    ohmsNearestE24: 0,
    ohmsBelowE24: 0,
    nearbyE24: [],
    voltageDrop: 0,
    powerWatts: 0,
    driveMa: 0,
    totalVf: 0,
    numLeds: 1,
    valid: false,
    message,
  }
}

export function nearestE24Above(ohms: number): number {
  if (!Number.isFinite(ohms) || ohms <= 0) return 0
  for (const candidate of E24) {
    if (candidate >= ohms - 0.5) return candidate
  }
  return E24[E24.length - 1]
}

export function nearestE24Below(ohms: number): number {
  if (!Number.isFinite(ohms) || ohms <= 0) return 0
  for (let i = E24.length - 1; i >= 0; i--) {
    if (E24[i] <= ohms + 0.5) return E24[i]
  }
  return E24[0]
}

/** Prefer the next E24 value at or above the exact ohms (slightly less LED current). */
export function nearestE24AtOrAbove(ohms: number): number {
  return nearestE24Above(ohms)
}

export function nearbyE24Around(ohms: number, before = 2, after = 3): number[] {
  const idx = E24.indexOf(ohms)
  if (idx < 0) {
    const above = nearestE24Above(ohms)
    return nearbyE24Around(above, before, after)
  }
  const start = Math.max(0, idx - before)
  const end = Math.min(E24.length - 1, idx + after)
  return E24.slice(start, end + 1)
}

/** Size for ~2× dissipation so the part isn't run near its limit. */
export function recommendedWattage(watts: number): string {
  if (!Number.isFinite(watts) || watts < 0) return '—'
  if (watts <= 0.125) return '⅛ W (0.125 W)'
  if (watts <= 0.25) return '¼ W (0.25 W)'
  if (watts <= 0.5) return '½ W (0.5 W)'
  if (watts <= 1) return '1 W'
  return `${Math.ceil(watts)} W`
}

export function formatOhms(ohms: number): string {
  if (!Number.isFinite(ohms) || ohms <= 0) return '—'
  if (ohms >= 1_000_000) return trim(ohms / 1_000_000) + ' MΩ'
  if (ohms >= 1_000) return trim(ohms / 1_000) + ' kΩ'
  return trim(ohms) + ' Ω'
}

export function formatCurrent(amps: number): string {
  if (!Number.isFinite(amps) || amps < 0) return '—'
  if (amps >= 1) return `${amps.toFixed(2)} A`
  if (amps >= 0.001) return `${(amps * 1000).toFixed(1)} mA`
  return `${(amps * 1_000_000).toFixed(0)} µA`
}

export function formatCurrentMa(ma: number): string {
  if (!Number.isFinite(ma) || ma < 0) return '—'
  return formatCurrent(ma / 1000)
}

export function formatWatts(watts: number): string {
  if (!Number.isFinite(watts) || watts < 0) return '—'
  if (watts >= 1) return `${watts.toFixed(2)} W`
  return `${(watts * 1000).toFixed(1)} mW`
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

function trim(n: number): string {
  const rounded = Number(n.toPrecision(3))
  return Number.isInteger(rounded)
    ? String(rounded)
    : String(rounded).replace(/\.?0+$/, '')
}
