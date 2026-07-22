export type BandColor =
  | 'black'
  | 'brown'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'violet'
  | 'gray'
  | 'white'
  | 'gold'
  | 'silver'

export type BandRole = 'digit' | 'multiplier' | 'tolerance' | 'tempco'

export interface ColorDef {
  id: BandColor
  label: string
  hex: string
  /** Text color for chips on this swatch */
  onHex: string
  digit?: number
  multiplier?: number
  tolerance?: number
  tempco?: number
}

export const COLORS: Record<BandColor, ColorDef> = {
  black: {
    id: 'black',
    label: 'Black',
    hex: '#1c1c1c',
    onHex: '#f4f0e8',
    digit: 0,
    multiplier: 1,
  },
  brown: {
    id: 'brown',
    label: 'Brown',
    hex: '#6b3f2a',
    onHex: '#f4f0e8',
    digit: 1,
    multiplier: 10,
    tolerance: 1,
    tempco: 100,
  },
  red: {
    id: 'red',
    label: 'Red',
    hex: '#c0392b',
    onHex: '#fff7f5',
    digit: 2,
    multiplier: 100,
    tolerance: 2,
    tempco: 50,
  },
  orange: {
    id: 'orange',
    label: 'Orange',
    hex: '#e67e22',
    onHex: '#1c1208',
    digit: 3,
    multiplier: 1_000,
    tempco: 15,
  },
  yellow: {
    id: 'yellow',
    label: 'Yellow',
    hex: '#f1c40f',
    onHex: '#1c1600',
    digit: 4,
    multiplier: 10_000,
    tempco: 25,
  },
  green: {
    id: 'green',
    label: 'Green',
    hex: '#1e8449',
    onHex: '#f3fff6',
    digit: 5,
    multiplier: 100_000,
    tolerance: 0.5,
    tempco: 20,
  },
  blue: {
    id: 'blue',
    label: 'Blue',
    hex: '#2471a3',
    onHex: '#f2f8ff',
    digit: 6,
    multiplier: 1_000_000,
    tolerance: 0.25,
    tempco: 10,
  },
  violet: {
    id: 'violet',
    label: 'Violet',
    hex: '#6c3483',
    onHex: '#faf5ff',
    digit: 7,
    multiplier: 10_000_000,
    tolerance: 0.1,
    tempco: 5,
  },
  gray: {
    id: 'gray',
    label: 'Gray',
    hex: '#7f8c8d',
    onHex: '#0f1212',
    digit: 8,
    multiplier: 100_000_000,
    tolerance: 0.05,
    tempco: 1,
  },
  white: {
    id: 'white',
    label: 'White',
    hex: '#f5f5f0',
    onHex: '#1a1a18',
    digit: 9,
    multiplier: 1_000_000_000,
  },
  gold: {
    id: 'gold',
    label: 'Gold',
    hex: '#c9a227',
    onHex: '#1a1400',
    multiplier: 0.1,
    tolerance: 5,
  },
  silver: {
    id: 'silver',
    label: 'Silver',
    hex: '#b0b6bf',
    onHex: '#15171a',
    multiplier: 0.01,
    tolerance: 10,
  },
}

export const DIGIT_COLORS: BandColor[] = [
  'black',
  'brown',
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'violet',
  'gray',
  'white',
]

export const MULTIPLIER_COLORS: BandColor[] = [
  'black',
  'brown',
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'violet',
  'gray',
  'white',
  'gold',
  'silver',
]

export const TOLERANCE_COLORS: BandColor[] = [
  'brown',
  'red',
  'green',
  'blue',
  'violet',
  'gray',
  'gold',
  'silver',
]

export const TEMPCO_COLORS: BandColor[] = [
  'brown',
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'violet',
  'gray',
]

export type BandCount = 4 | 5 | 6

export interface BandSlot {
  key: string
  label: string
  role: BandRole
  options: BandColor[]
}

export function slotsForBands(count: BandCount): BandSlot[] {
  if (count === 4) {
    return [
      { key: 'd1', label: '1st digit', role: 'digit', options: DIGIT_COLORS },
      { key: 'd2', label: '2nd digit', role: 'digit', options: DIGIT_COLORS },
      { key: 'mult', label: 'Multiplier', role: 'multiplier', options: MULTIPLIER_COLORS },
      { key: 'tol', label: 'Tolerance', role: 'tolerance', options: TOLERANCE_COLORS },
    ]
  }

  if (count === 5) {
    return [
      { key: 'd1', label: '1st digit', role: 'digit', options: DIGIT_COLORS },
      { key: 'd2', label: '2nd digit', role: 'digit', options: DIGIT_COLORS },
      { key: 'd3', label: '3rd digit', role: 'digit', options: DIGIT_COLORS },
      { key: 'mult', label: 'Multiplier', role: 'multiplier', options: MULTIPLIER_COLORS },
      { key: 'tol', label: 'Tolerance', role: 'tolerance', options: TOLERANCE_COLORS },
    ]
  }

  return [
    { key: 'd1', label: '1st digit', role: 'digit', options: DIGIT_COLORS },
    { key: 'd2', label: '2nd digit', role: 'digit', options: DIGIT_COLORS },
    { key: 'd3', label: '3rd digit', role: 'digit', options: DIGIT_COLORS },
    { key: 'mult', label: 'Multiplier', role: 'multiplier', options: MULTIPLIER_COLORS },
    { key: 'tol', label: 'Tolerance', role: 'tolerance', options: TOLERANCE_COLORS },
    { key: 'tc', label: 'Tempco', role: 'tempco', options: TEMPCO_COLORS },
  ]
}

export function defaultBands(count: BandCount): BandColor[] {
  if (count === 4) return ['yellow', 'violet', 'red', 'gold'] // 4.7k ±5%
  if (count === 5) return ['yellow', 'violet', 'black', 'brown', 'gold'] // 470 × 10 = 4.7k ±5%
  return ['yellow', 'violet', 'black', 'brown', 'gold', 'brown'] // 4.7k ±5% 100ppm
}
