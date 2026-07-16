export type Color = 'blue' | 'green'
export type RoomStatus = 'waiting' | 'playing' | 'finished'

export type PiecesState = {
  blue: number[]
  green: number[]
}

export type LuduRoom = {
  id: string
  code: string
  status: RoomStatus
  host_id: string
  host_name: string
  guest_id: string | null
  guest_name: string | null
  current_turn: Color
  dice_value: number | null
  dice_rolled: boolean
  consecutive_sixes: number
  winner: Color | null
  pieces: PiecesState
  last_action: string | null
  updated_at: string
  created_at: string
}

export type PlayerSlot = {
  color: Color
  name: string
  id: string
  isYou: boolean
}

/** Piece path index:
 *  -1  = still in yard (need a 6 to leave)
 *  0–50 = on main ring (relative to that color's entry)
 *  51–55 = home stretch
 *  56 = finished / home triangle
 */
export const YARD = -1
export const FINISHED = 56
export const HOME_START = 51
