import { createPortal } from 'react-dom'
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
  error?: string | null
}

export function ChatPanel({
  open,
  onClose,
  messages,
  sending,
  myColor,
  onSend,
  onReact,
  error,
}: Props) {
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = listRef.current
    if (!el || !open) return
    el.scrollTop = el.scrollHeight
  }, [messages, open])

  // Lock body scroll while chat sheet is open on mobile
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim() || sending || !myColor) return
    onSend(text)
    setText('')
  }

  const panel = (
    <>
      {open && (
        <button
          type="button"
          className="chat-scrim"
          aria-label="Close chat"
          onClick={onClose}
        />
      )}
      <aside
        className={`chat-panel${open ? ' open' : ''}`}
        aria-hidden={!open}
        role="dialog"
        aria-label="Chat"
      >
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

        {error && <p className="chat-error">{error}</p>}

        <form className="chat-form" onSubmit={submit}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={myColor ? 'Type a message…' : 'Waiting…'}
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
    </>
  )

  // Don't keep a fixed chat shell in the layout when closed (avoids mobile crush)
  if (!open) return null
  if (typeof document === 'undefined') return null
  return createPortal(panel, document.body)
}
