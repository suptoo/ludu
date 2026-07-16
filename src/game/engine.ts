import { ENTRY, SAFE_CELLS, toAbsolute } from './constants'
import type { Color, PiecesState } from './types'
import { FINISHED, HOME_START, YARD } from './types'

const OPPONENT: Record<Color, Color> = {
  blue: 'green',
  green: 'blue',
}

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1
}

/** Classic Ludu: only a 6 lets a piece leave the yard. */
export function canLeaveYard(dice: number): boolean {
  return dice === 6
}

/**
 * Valid destination after moving `dice` from relative position.
 * Returns null if the move is illegal.
 */
export function getDestination(from: number, dice: number): number | null {
  if (from === FINISHED) return null

  if (from === YARD) {
    return canLeaveYard(dice) ? 0 : null
  }

  const next = from + dice

  // Must land exactly into finish
  if (from < HOME_START && next > FINISHED) return null
  if (from >= HOME_START && next > FINISHED) return null
  if (next > FINISHED) return null

  return next
}

export function getMovablePieces(
  pieces: PiecesState,
  color: Color,
  dice: number,
): number[] {
  const movable: number[] = []
  pieces[color].forEach((pos, index) => {
    if (getDestination(pos, dice) !== null) {
      movable.push(index)
    }
  })
  return movable
}

export function hasAnyMove(
  pieces: PiecesState,
  color: Color,
  dice: number,
): boolean {
  return getMovablePieces(pieces, color, dice).length > 0
}

/** True when this color still has at least one piece in the yard. */
export function hasPieceInYard(pieces: PiecesState, color: Color): boolean {
  return pieces[color].some((p) => p === YARD)
}

function occupiesAbsolute(
  pieces: PiecesState,
  color: Color,
  abs: number,
  ignoreIndex?: number,
): number[] {
  const hits: number[] = []
  pieces[color].forEach((rel, i) => {
    if (ignoreIndex !== undefined && i === ignoreIndex) return
    if (rel < 0 || rel >= FINISHED) return
    const a = toAbsolute(color, rel)
    if (a === abs) hits.push(i)
  })
  return hits
}

export type MoveResult = {
  pieces: PiecesState
  captured: boolean
  finishedPiece: boolean
  extraTurn: boolean
  leftYard: boolean
}

export function applyMove(
  pieces: PiecesState,
  color: Color,
  pieceIndex: number,
  dice: number,
): MoveResult | null {
  const from = pieces[color][pieceIndex]
  const dest = getDestination(from, dice)
  if (dest === null) return null

  const nextPieces: PiecesState = {
    blue: [...pieces.blue],
    green: [...pieces.green],
  }
  nextPieces[color][pieceIndex] = dest

  let captured = false
  const finishedPiece = dest === FINISHED
  const leftYard = from === YARD
  const abs = toAbsolute(color, dest)

  // Capture on shared ring only (not home stretch / finish / safe)
  if (
    abs !== null &&
    dest < HOME_START &&
    !SAFE_CELLS.has(abs) &&
    abs < 52
  ) {
    const foe = OPPONENT[color]
    const victims = occupiesAbsolute(nextPieces, foe, abs)
    if (victims.length === 1) {
      nextPieces[foe][victims[0]] = YARD
      captured = true
    }
  }

  // Extra turn on 6, capture, or finishing a piece
  const extraTurn = dice === 6 || captured || finishedPiece

  return { pieces: nextPieces, captured, finishedPiece, extraTurn, leftYard }
}

export function checkWinner(pieces: PiecesState, color: Color): boolean {
  return pieces[color].every((p) => p === FINISHED)
}

export function nextTurn(color: Color): Color {
  return OPPONENT[color]
}

export function playerColorFor(
  playerId: string,
  hostId: string,
  guestId: string | null,
): Color | null {
  if (playerId === hostId) return 'blue'
  if (guestId && playerId === guestId) return 'green'
  return null
}

export function makeRoomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

export function makePlayerId(): string {
  try {
    const existing = localStorage.getItem('ludu_player_id')
    if (existing) return existing
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `p-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem('ludu_player_id', id)
    return id
  } catch {
    return `p-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }
}

export function entryCell(color: Color): number {
  return ENTRY[color]
}
