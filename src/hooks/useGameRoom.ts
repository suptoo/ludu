import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  applyMove,
  checkWinner,
  getMovablePieces,
  hasAnyMove,
  makePlayerId,
  makeRoomCode,
  nextTurn,
  playerColorFor,
  rollDice,
} from '../game/engine'
import type { Color, LuduRoom, PiecesState } from '../game/types'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const EMPTY_PIECES: PiecesState = {
  red: [-1, -1, -1, -1],
  yellow: [-1, -1, -1, -1],
}

function isLocalRoom(room: LuduRoom | null): boolean {
  return Boolean(room?.id.startsWith('local-'))
}

function normalizeRoom(row: Record<string, unknown>): LuduRoom {
  const pieces = (row.pieces as PiecesState) ?? EMPTY_PIECES
  return {
    id: row.id as string,
    code: row.code as string,
    status: row.status as LuduRoom['status'],
    host_id: row.host_id as string,
    host_name: row.host_name as string,
    guest_id: (row.guest_id as string | null) ?? null,
    guest_name: (row.guest_name as string | null) ?? null,
    current_turn: row.current_turn as Color,
    dice_value: (row.dice_value as number | null) ?? null,
    dice_rolled: Boolean(row.dice_rolled),
    consecutive_sixes: Number(row.consecutive_sixes ?? 0),
    winner: (row.winner as Color | null) ?? null,
    pieces: {
      red: pieces.red ?? [-1, -1, -1, -1],
      yellow: pieces.yellow ?? [-1, -1, -1, -1],
    },
    last_action: (row.last_action as string | null) ?? null,
    updated_at: row.updated_at as string,
    created_at: row.created_at as string,
  }
}

function makeLocalRoom(playerId: string, playerName: string): LuduRoom {
  const now = new Date().toISOString()
  const name = playerName.trim() || 'You'
  return {
    id: `local-${
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    }`,
    code: 'LOCAL',
    status: 'playing',
    host_id: playerId,
    host_name: name,
    guest_id: `${playerId}-yellow`,
    guest_name: 'Friend',
    current_turn: 'red',
    dice_value: null,
    dice_rolled: false,
    consecutive_sixes: 0,
    winner: null,
    pieces: { ...EMPTY_PIECES, red: [-1, -1, -1, -1], yellow: [-1, -1, -1, -1] },
    last_action: 'Ludu board ready — roll the dice! (Practice: play both sides)',
    updated_at: now,
    created_at: now,
  }
}

export function usePlayerIdentity() {
  const [playerId] = useState(() => makePlayerId())
  const [playerName, setPlayerName] = useState(() => {
    try {
      return localStorage.getItem('ludu_player_name') || 'Player'
    } catch {
      return 'Player'
    }
  })

  const saveName = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 20) || 'Player'
    try {
      localStorage.setItem('ludu_player_name', trimmed)
    } catch {
      /* ignore */
    }
    setPlayerName(trimmed)
  }, [])

  return { playerId, playerName, saveName }
}

export function useGameRoom(playerId: string, playerName: string) {
  // Home (lobby) first — Ludu board only after Play / Create / Join
  const [room, setRoom] = useState<LuduRoom | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [localRolling, setLocalRolling] = useState(false)

  const local = isLocalRoom(room)

  // Hotseat practice: you control whoever's turn it is
  const myColor = useMemo((): Color | null => {
    if (!room) return null
    if (local) return room.current_turn
    return playerColorFor(playerId, room.host_id, room.guest_id)
  }, [room, playerId, local])

  const isMyTurn = Boolean(
    room &&
      myColor &&
      room.current_turn === myColor &&
      (room.status === 'playing' ||
        // Host can practice-move while waiting for friend
        (room.status === 'waiting' && myColor === 'red')),
  )

  const movable = useMemo(() => {
    if (!room || !myColor || !isMyTurn || !room.dice_rolled || room.dice_value == null) {
      return [] as number[]
    }
    return getMovablePieces(room.pieces, myColor, room.dice_value)
  }, [room, myColor, isMyTurn])

  useEffect(() => {
    if (!room?.id || local) return

    const channel = supabase
      .channel(`ludu-room-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ludu_rooms',
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            setRoom(normalizeRoom(payload.new as Record<string, unknown>))
          }
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [room?.id, local])

  const refreshRoom = useCallback(async (id: string) => {
    if (id.startsWith('local-')) return
    const { data, error: err } = await supabase
      .from('ludu_rooms')
      .select('*')
      .eq('id', id)
      .single()
    if (err) throw err
    setRoom(normalizeRoom(data as Record<string, unknown>))
  }, [])

  const patchRoom = useCallback(
    async (patch: Partial<LuduRoom>) => {
      if (!room) return
      const next: LuduRoom = {
        ...room,
        ...patch,
        pieces: patch.pieces ?? room.pieces,
        updated_at: new Date().toISOString(),
      }

      if (isLocalRoom(room)) {
        setRoom(next)
        return
      }

      const { data, error: err } = await supabase
        .from('ludu_rooms')
        .update({
          ...patch,
          updated_at: next.updated_at,
        })
        .eq('id', room.id)
        .select('*')
        .single()
      if (err) throw err
      setRoom(normalizeRoom(data as Record<string, unknown>))
    },
    [room],
  )

  const setRoomInUrl = useCallback((code: string | null) => {
    try {
      const url = new URL(window.location.href)
      if (code) url.searchParams.set('room', code)
      else url.searchParams.delete('room')
      window.history.replaceState({}, '', url.toString())
    } catch {
      /* ignore */
    }
  }, [])

  const startPractice = useCallback(
    (nameOverride?: string) => {
      const name = (nameOverride ?? playerName).trim() || 'You'
      setError(null)
      setRoomInUrl(null)
      setRoom(makeLocalRoom(playerId, name))
    },
    [playerId, playerName, setRoomInUrl],
  )

  const createRoom = useCallback(
    async (nameOverride?: string) => {
      const name = (nameOverride ?? playerName).trim()
      if (!name) {
        setError('Enter your name first.')
        return
      }
      setBusy(true)
      setError(null)
      try {
        const code = makeRoomCode()
        const { data, error: err } = await supabase
          .from('ludu_rooms')
          .insert({
            code,
            host_id: playerId,
            host_name: name,
            status: 'waiting',
            pieces: EMPTY_PIECES,
            last_action: 'Room created — share the link. Practice as Red until friend joins.',
          })
          .select('*')
          .single()
        if (err) throw err
        const normalized = normalizeRoom(data as Record<string, unknown>)
        setRoomInUrl(normalized.code)
        setRoom(normalized)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not create room.')
      } finally {
        setBusy(false)
      }
    },
    [playerId, playerName, setRoomInUrl],
  )

  const joinRoom = useCallback(
    async (code: string, nameOverride?: string) => {
      const name = (nameOverride ?? playerName).trim()
      if (!name) {
        setError('Enter your name first.')
        return
      }
      setBusy(true)
      setError(null)
      try {
        const normalized = code.trim().toUpperCase()
        if (normalized.length < 4) throw new Error('Enter a valid room code.')

        const { data: existing, error: findErr } = await supabase
          .from('ludu_rooms')
          .select('*')
          .eq('code', normalized)
          .single()
        if (findErr || !existing) throw new Error('Room not found. Check the code.')

        const current = normalizeRoom(existing as Record<string, unknown>)

        if (current.host_id === playerId || current.guest_id === playerId) {
          setRoomInUrl(current.code)
          setRoom(current)
          return
        }
        if (current.guest_id && current.guest_id !== playerId) {
          throw new Error('This room already has 2 players.')
        }
        if (current.status !== 'waiting') {
          throw new Error('This game has already started.')
        }

        const { data, error: updErr } = await supabase
          .from('ludu_rooms')
          .update({
            guest_id: playerId,
            guest_name: name,
            status: 'playing',
            current_turn: 'red',
            dice_value: null,
            dice_rolled: false,
            consecutive_sixes: 0,
            winner: null,
            pieces: EMPTY_PIECES,
            last_action: `${name} joined! Fresh start — Red goes first.`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', current.id)
          .eq('status', 'waiting')
          .is('guest_id', null)
          .select('*')
          .single()

        if (updErr || !data) throw new Error('Could not join — room may be full.')
        const joined = normalizeRoom(data as Record<string, unknown>)
        setRoomInUrl(joined.code)
        setRoom(joined)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not join room.')
      } finally {
        setBusy(false)
      }
    },
    [playerId, playerName, setRoomInUrl],
  )

  const leaveRoom = useCallback(() => {
    setRoom(null)
    setError(null)
    setRoomInUrl(null)
  }, [setRoomInUrl])

  const doRoll = useCallback(async () => {
    if (!room || !myColor || !isMyTurn || room.dice_rolled || busy) return
    setLocalRolling(true)
    setBusy(true)
    setError(null)

    await new Promise((r) => setTimeout(r, 550))
    const value = rollDice()

    try {
      let consecutive = room.consecutive_sixes
      if (value === 6) consecutive += 1
      else consecutive = 0

      if (value === 6 && consecutive >= 3) {
        const passTo =
          room.status === 'waiting' ? myColor : nextTurn(myColor)
        await patchRoom({
          dice_value: value,
          dice_rolled: false,
          consecutive_sixes: 0,
          current_turn: passTo,
          last_action: `${myColor === 'red' ? room.host_name : room.guest_name} rolled three 6s — turn skipped!`,
        })
        return
      }

      if (!hasAnyMove(room.pieces, myColor, value)) {
        if (value === 6) {
          await patchRoom({
            dice_value: value,
            dice_rolled: false,
            consecutive_sixes: consecutive,
            last_action: `Rolled 6 but no move — roll again!`,
          })
        } else {
          const passTo =
            room.status === 'waiting' ? myColor : nextTurn(myColor)
          await patchRoom({
            dice_value: value,
            dice_rolled: false,
            consecutive_sixes: 0,
            current_turn: passTo,
            last_action:
              room.status === 'waiting'
                ? `Rolled ${value} — no moves. Keep practicing as Red.`
                : `Rolled ${value} — no moves. Turn passes.`,
          })
        }
        return
      }

      await patchRoom({
        dice_value: value,
        dice_rolled: true,
        consecutive_sixes: consecutive,
        last_action: `Rolled a ${value}. Tap a glowing pawn.`,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Roll failed.')
    } finally {
      setLocalRolling(false)
      setBusy(false)
    }
  }, [room, myColor, isMyTurn, busy, patchRoom])

  const doMove = useCallback(
    async (pieceIndex: number) => {
      if (
        !room ||
        !myColor ||
        !isMyTurn ||
        !room.dice_rolled ||
        room.dice_value == null ||
        busy
      ) {
        return
      }
      if (!movable.includes(pieceIndex)) return

      setBusy(true)
      setError(null)
      try {
        const result = applyMove(room.pieces, myColor, pieceIndex, room.dice_value)
        if (!result) throw new Error('Illegal move.')

        const won = checkWinner(result.pieces, myColor)
        const name = myColor === 'red' ? room.host_name : room.guest_name

        if (won) {
          await patchRoom({
            pieces: result.pieces,
            dice_value: room.dice_value,
            dice_rolled: false,
            consecutive_sixes: 0,
            status: 'finished',
            winner: myColor,
            last_action: `${name} wins the match!`,
          })
          return
        }

        const keepTurn = result.extraTurn || room.status === 'waiting'
        const next = keepTurn ? myColor : nextTurn(myColor)
        await patchRoom({
          pieces: result.pieces,
          dice_value: room.dice_value,
          dice_rolled: false,
          consecutive_sixes: keepTurn && room.dice_value === 6 ? room.consecutive_sixes : 0,
          current_turn: next,
          last_action: result.captured
            ? `${name} captured a token! Extra turn.`
            : result.finishedPiece
              ? `${name} got a token home! Extra turn.`
              : room.status === 'waiting'
                ? `${name} moved (waiting for friend).`
                : keepTurn
                  ? `${name} rolled 6 — roll again!`
                  : `${name} moved. ${next === 'red' ? room.host_name : room.guest_name}'s turn.`,
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Move failed.')
      } finally {
        setBusy(false)
      }
    },
    [room, myColor, isMyTurn, busy, movable, patchRoom],
  )

  const rematch = useCallback(async () => {
    if (!room) return
    setBusy(true)
    try {
      await patchRoom({
        status: 'playing',
        current_turn: 'red',
        dice_value: null,
        dice_rolled: false,
        consecutive_sixes: 0,
        winner: null,
        pieces: EMPTY_PIECES,
        last_action: 'Rematch! Red starts again.',
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Rematch failed.')
    } finally {
      setBusy(false)
    }
  }, [room, patchRoom])

  return {
    room,
    error,
    busy,
    localRolling,
    myColor,
    isMyTurn,
    movable,
    isPractice: local,
    configured: isSupabaseConfigured,
    startPractice,
    createRoom,
    joinRoom,
    leaveRoom,
    doRoll,
    doMove,
    rematch,
    refreshRoom,
    setError,
  }
}
