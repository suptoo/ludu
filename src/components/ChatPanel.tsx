import { useEffect, useRef, useState, type FormEvent } from 'react'
import { REACTIONS, type ChatMessage } from '../game/chat'
import { COLOR_META } from '../game/constants'
import type { Color } from '../game/types'
import './ChatPanel.css'

type Props = {
  open: boolean
  onClose: () => void
  messages: ChatMessage[]
  sending: boolean
  myColor: Color | null
  onSend: (text: string) => void
  onReact: (emoji: string) => void
}

export function ChatPanel({
  open,
  onClose,
  messages,
  sending,
  myColor,
  onSend,
  onReact,
}: Props) {
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, open])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim() || sending || !myColor) return
    onSend(text)
    setText('')
  }

  return (
    <aside className={`chat-panel${open ? ' open' : ''}`} aria-hidden={!open}>
      <header className="chat-head">
        <h2>Chat</h2>
        <button type="button" className="chat-close" onClick={onClose} aria-label="Close chat">
          ✕
        </button>
      </header>

      <div className="reactions-row" aria-label="Quick reactions">
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="react-btn"
            disabled={!myColor || sending}
            onClick={() => onReact(emoji)}
            aria-label={`Send ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="chat-list" ref={listRef}>
        {messages.length === 0 && (
          <p className="chat-empty">Say hi or send a reaction</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`chat-bubble${m.color === myColor ? ' mine' : ''}`}
          >
            <span className="chat-name" style={{ color: COLOR_META[m.color].css }}>
              {m.sender_name}
            </span>
            <p>{m.body}</p>
          </div>
        ))}
      </div>

      <form className="chat-form" onSubmit={submit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={myColor ? 'Type a message…' : 'Join the game to chat'}
          maxLength={280}
          disabled={!myColor || sending}
          enterKeyHint="send"
          autoComplete="off"
        />
        <button type="submit" disabled={!myColor || sending || !text.trim()}>
          Send
        </button>
      </form>
    </aside>
  )
}
