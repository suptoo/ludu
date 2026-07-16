/**
 * Classic 15×15 Ludu board (standard layout).
 * 2-player: Blue (bottom-left, Player 1) vs Green (top-right, Player 2).
 */
import type { Color } from './types'

export const BOARD_SIZE = 15

/** Safe cells: each color's start + star cells mid-path. */
export const SAFE_CELLS = new Set([0, 8, 13, 21, 26, 34, 39, 47])

/** Absolute ring entry for each playable color. */
export const ENTRY: Record<Color, number> = {
  blue: 0,
  green: 26,
}

export const HOME_STRETCH: Record<Color, number[]> = {
  blue: [100, 101, 102, 103, 104],
  green: [200, 201, 202, 203, 204],
}

export const COLOR_META: Record<
  Color,
  { label: string; css: string; yard: string; soft: string; deep: string; glow: string }
> = {
  blue: {
    label: 'Blue',
    css: '#1E88E5',
    yard: '#1976D2',
    soft: '#BBDEFB',
    deep: '#0D47A1',
    glow: 'rgba(30, 136, 229, 0.45)',
  },
  green: {
    label: 'Green',
    css: '#2E7D32',
    yard: '#388E3C',
    soft: '#C8E6C9',
    deep: '#1B5E20',
    glow: 'rgba(46, 125, 50, 0.45)',
  },
}

/** All four board corners (decorative + playable). */
export const CORNER_COLORS = {
  red: {
    css: '#E53935',
    yard: '#D32F2F',
    soft: '#FFCDD2',
    deep: '#B71C1C',
    glow: 'rgba(229, 57, 53, 0.4)',
  },
  green: COLOR_META.green,
  yellow: {
    css: '#FDD835',
    yard: '#FBC02D',
    soft: '#FFF9C4',
    deep: '#F9A825',
    glow: 'rgba(253, 216, 53, 0.45)',
  },
  blue: COLOR_META.blue,
} as const

export type Corner = keyof typeof CORNER_COLORS

export function toAbsolute(color: Color, relative: number): number | null {
  if (relative < 0) return null
  if (relative >= 56) return color === 'blue' ? 105 : 205
  if (relative >= 51) return HOME_STRETCH[color][relative - 51]
  return (ENTRY[color] + relative) % 52
}

/** Shared ring coordinates [row, col] — clockwise from blue entry (bottom). */
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
  // Blue up into center
  100: [13, 7],
  101: [12, 7],
  102: [11, 7],
  103: [10, 7],
  104: [9, 7],
  105: [8, 7],
  // Green down into center
  200: [1, 7],
  201: [2, 7],
  202: [3, 7],
  203: [4, 7],
  204: [5, 7],
  205: [6, 7],
}

export const PATH_BY_RC = new Map<string, number>()
Object.entries(PATH_COORDS).forEach(([id, [r, c]]) => {
  PATH_BY_RC.set(`${r},${c}`, Number(id))
})

export type CellKind =
  | 'yard-red'
  | 'yard-green'
  | 'yard-yellow'
  | 'yard-blue'
  | 'home-red'
  | 'home-green'
  | 'home-yellow'
  | 'home-blue'
  | 'center'
  | 'path'
  | 'empty'

/** Classic corners: Red TL, Green TR, Yellow BR, Blue BL. */
export function cellKind(r: number, c: number): CellKind {
  if (r <= 5 && c <= 5) return 'yard-red'
  if (r <= 5 && c >= 9) return 'yard-green'
  if (r >= 9 && c >= 9) return 'yard-yellow'
  if (r >= 9 && c <= 5) return 'yard-blue'

  if (r >= 6 && r <= 8 && c >= 6 && c <= 8) return 'center'

  if (r === 7 && c >= 1 && c <= 5) return 'home-red'
  if (c === 7 && r >= 1 && r <= 5) return 'home-green'
  if (r === 7 && c >= 9 && c <= 13) return 'home-yellow'
  if (c === 7 && r >= 9 && r <= 13) return 'home-blue'

  if ((c >= 6 && c <= 8) || (r >= 6 && r <= 8)) return 'path'

  return 'empty'
}

export const YARD_ORIGIN: Record<Corner, [number, number]> = {
  red: [0, 0],
  green: [0, 9],
  yellow: [9, 9],
  blue: [9, 0],
}

export function cellToPercent(row: number, col: number): { top: string; left: string } {
  return {
    top: `${((row + 0.5) / 15) * 100}%`,
    left: `${((col + 0.5) / 15) * 100}%`,
  }
}
