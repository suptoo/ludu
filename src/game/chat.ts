export type ChatKind = 'chat' | 'reaction'

export type ChatMessage = {
  id: string
  room_id: string
  sender_id: string
  sender_name: string
  color: 'red' | 'yellow'
  kind: ChatKind
  body: string
  created_at: string
}

export const REACTIONS = ['😂', '🔥', '👏', '😮', '😤', '🎉', '❤️', '👍'] as const
