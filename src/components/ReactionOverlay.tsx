import type { ChatMessage } from '../game/chat'
import './ReactionOverlay.css'

type Props = {
  items: ChatMessage[]
}

export function ReactionOverlay({ items }: Props) {
  if (items.length === 0) return null

  return (
    <div className="reaction-overlay" aria-live="polite" aria-atomic="false">
      {items.map((item, i) => (
        <div
          key={item.id}
          className={`reaction-float lane-${i % 5}${item.color === 'yellow' ? ' from-right' : ''}`}
        >
          <span className="reaction-emoji">{item.body}</span>
          <span className="reaction-who">{item.sender_name}</span>
        </div>
      ))}
    </div>
  )
}
