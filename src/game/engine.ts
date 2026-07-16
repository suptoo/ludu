import { ENTRY, SAFE_CELLS, toAbsolute } from './constants'
import type { Color, PiecesState } from './types'
import { FINISHED, HOME_START, YARD } from './types'

const OPPONENT: Record<Color, Color> = {
  red: 'yellow',
  yellow: 'red',
}

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1
}

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
      // Extra: if leaving yard, only one token can leave per 6 (all eligible ok)
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
    red: [...pieces.red],
    yellow: [...pieces.yellow],
  }
  nextPieces[color][pieceIndex] = dest

  let captured = false
  const finishedPiece = dest === FINISHED
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
      // Only capture a single token (block of 2+ is safe in classic house rules)
      nextPieces[foe][victims[0]] = YARD
      captured = true
    }
  }

  const extraTurn = dice === 6 || captured || finishedPiece

  return { pieces: nextPieces, captured, finishedPiece, extraTurn }
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
  if (playerId === hostId) return 'red'
  if (guestId && playerId === guestId) return 'yellow'
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
  const existing = localStorage.getItem('ludu_player_id')
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem('ludu_player_id', id)
  return id
}

/** Debug helper: absolute entry cell for a color */
export function entryCell(color: Color): number {
  return ENTRY[color]
}
