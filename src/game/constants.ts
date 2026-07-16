/**
 * Classic 15×15 Ludu board geometry (standard Indian/Bangladeshi layout).
 * Red (bottom-left) vs Yellow (top-right) for 2-player.
 */
import type { Color } from './types'

export const BOARD_SIZE = 15

export const SAFE_CELLS = new Set([0, 8, 13, 21, 26, 34, 39, 47])

export const ENTRY: Record<Color, number> = {
  red: 0,
  yellow: 26,
}

export const HOME_STRETCH: Record<Color, number[]> = {
  red: [100, 101, 102, 103, 104],
  yellow: [200, 201, 202, 203, 204],
}

export const COLOR_META: Record<
  Color,
  { label: string; css: string; yard: string; soft: string; deep: string; glow: string }
> = {
  red: {
    label: 'Red',
    css: '#e53935',
    yard: '#c62828',
    soft: '#ffcdd2',
    deep: '#8e0000',
    glow: 'rgba(229, 57, 53, 0.4)',
  },
  yellow: {
    label: 'Yellow',
    css: '#fdd835',
    yard: '#fbc02d',
    soft: '#fff9c4',
    deep: '#c49000',
    glow: 'rgba(253, 216, 53, 0.45)',
  },
}

export const CORNER_COLORS = {
  green: {
    css: '#43a047',
    yard: '#2e7d32',
    soft: '#c8e6c9',
    deep: '#1b5e20',
    glow: 'rgba(67, 160, 71, 0.4)',
  },
  blue: {
    css: '#1e88e5',
    yard: '#1565c0',
    soft: '#bbdefb',
    deep: '#0d47a1',
    glow: 'rgba(30, 136, 229, 0.4)',
  },
  red: COLOR_META.red,
  yellow: COLOR_META.yellow,
} as const

export function toAbsolute(color: Color, relative: number): number | null {
  if (relative < 0) return null
  if (relative >= 56) return color === 'red' ? 105 : 205
  if (relative >= 51) return HOME_STRETCH[color][relative - 51]
  return (ENTRY[color] + relative) % 52
}

/** Shared ring coordinates [row, col] — clockwise from red entry. */
export const PATH_COORDS: Record<number, [number, number]> = {
  0: [13, 6],
  1: [12, 6],
  2: [11, 6],
  3: [10, 6],
  4: [9, 6],
  5: [8, 5],
  6: [8, 4],
  7: [8, 3],
  8: [8, 2],
  9: [8, 1],
  10: [8, 0],
  11: [7, 0],
  12: [6, 0],
  13: [6, 1],
  14: [6, 2],
  15: [6, 3],
  16: [6, 4],
  17: [6, 5],
  18: [5, 6],
  19: [4, 6],
  20: [3, 6],
  21: [2, 6],
  22: [1, 6],
  23: [0, 6],
  24: [0, 7],
  25: [0, 8],
  26: [1, 8],
  27: [2, 8],
  28: [3, 8],
  29: [4, 8],
  30: [5, 8],
  31: [6, 9],
  32: [6, 10],
  33: [6, 11],
  34: [6, 12],
  35: [6, 13],
  36: [6, 14],
  37: [7, 14],
  38: [8, 14],
  39: [8, 13],
  40: [8, 12],
  41: [8, 11],
  42: [8, 10],
  43: [8, 9],
  44: [9, 8],
  45: [10, 8],
  46: [11, 8],
  47: [12, 8],
  48: [13, 8],
  49: [14, 8],
  50: [14, 7],
  51: [14, 6],
}

export const HOME_COORDS: Record<number, [number, number]> = {
  // Red up into center
  100: [13, 7],
  101: [12, 7],
  102: [11, 7],
  103: [10, 7],
  104: [9, 7],
  105: [8, 7],
  // Yellow down into center
  200: [1, 7],
  201: [2, 7],
  202: [3, 7],
  203: [4, 7],
  204: [5, 7],
  205: [6, 7],
}

/** Map path absolute id → grid, for quick lookup */
export const PATH_BY_RC = new Map<string, number>()
Object.entries(PATH_COORDS).forEach(([id, [r, c]]) => {
  PATH_BY_RC.set(`${r},${c}`, Number(id))
})

export type CellKind =
  | 'yard-green'
  | 'yard-yellow'
  | 'yard-red'
  | 'yard-blue'
  | 'home-red'
  | 'home-yellow'
  | 'home-green'
  | 'home-blue'
  | 'center'
  | 'path'
  | 'empty'

export function cellKind(r: number, c: number): CellKind {
  if (r <= 5 && c <= 5) return 'yard-green'
  if (r <= 5 && c >= 9) return 'yard-yellow'
  if (r >= 9 && c <= 5) return 'yard-red'
  if (r >= 9 && c >= 9) return 'yard-blue'

  if (r >= 6 && r <= 8 && c >= 6 && c <= 8) return 'center'

  if (c === 7 && r >= 9 && r <= 13) return 'home-red'
  if (c === 7 && r >= 1 && r <= 5) return 'home-yellow'
  if (r === 7 && c >= 1 && c <= 5) return 'home-green'
  if (r === 7 && c >= 9 && c <= 13) return 'home-blue'

  if ((c >= 6 && c <= 8) || (r >= 6 && r <= 8)) return 'path'

  return 'empty'
}

/** Yard circle seats inside each 6×6 corner (local 0–5 coords → board). */
export const YARD_CIRCLE_LOCAL: [number, number][] = [
  [1.5, 1.5],
  [1.5, 3.5],
  [3.5, 1.5],
  [3.5, 3.5],
]

export const YARD_ORIGIN = {
  green: [0, 0],
  yellow: [0, 9],
  red: [9, 0],
  blue: [9, 9],
} as const

export function cellToPercent(row: number, col: number): { top: string; left: string } {
  return {
    top: `${((row + 0.5) / 15) * 100}%`,
    left: `${((col + 0.5) / 15) * 100}%`,
  }
}
