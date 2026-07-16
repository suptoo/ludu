import { useCallback, useEffect, useRef, useState } from 'react'
import type { Color } from '../game/types'
import type { ChatMessage } from '../game/chat'
import { supabase } from '../lib/supabase'

function normalize(row: Record<string, unknown>): ChatMessage {
  return {
    id: row.id as string,
    room_id: row.room_id as string,
    sender_id: row.sender_id as string,
    sender_name: row.sender_name as string,
    color: row.color as Color,
    kind: row.kind as ChatMessage['kind'],
    body: row.body as string,
    created_at: row.created_at as string,
  }
}

export function useChat(
  roomId: string | undefined,
  playerId: string,
  playerName: string,
  color: Color | null,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [floating, setFloating] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const seenReactions = useRef(new Set<string>())

  useEffect(() => {
    if (!roomId || !supabase) return

    let cancelled = false

    ;(async () => {
      const { data, error: err } = await supabase
        .from('ludu_chat')
        .select('*')
        .eq('room_id', roomId)
        .eq('kind', 'chat')
        .order('created_at', { ascending: true })
        .limit(80)

      if (cancelled) return
      if (err) {
        setError(err.message)
        return
      }
      setMessages((data ?? []).map((r) => normalize(r as Record<string, unknown>)))
    })()

    const channel = supabase
      .channel(`ludu-chat-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ludu_chat',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const msg = normalize(payload.new as Record<string, unknown>)
          if (msg.kind === 'chat') {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev
              return [...prev.slice(-79), msg]
            })
            return
          }

          if (seenReactions.current.has(msg.id)) return
          seenReactions.current.add(msg.id)
          setFloating((prev) => [...prev, msg])
          window.setTimeout(() => {
            setFloating((prev) => prev.filter((m) => m.id !== msg.id))
          }, 2200)
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      void supabase!.removeChannel(channel)
    }
  }, [roomId])

  const send = useCallback(
    async (body: string, kind: 'chat' | 'reaction' = 'chat') => {
      if (!supabase || !roomId || !color) return
      const text = body.trim()
      if (!text) return
      setSending(true)
      setError(null)
      try {
        const { error: err } = await supabase.from('ludu_chat').insert({
          room_id: roomId,
          sender_id: playerId,
          sender_name: playerName || 'Player',
          color,
          kind,
          body: text.slice(0, 280),
        })
        if (err) throw err
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not send.')
      } finally {
        setSending(false)
      }
    },
    [roomId, playerId, playerName, color],
  )

  return { messages, floating, sending, error, send }
}
