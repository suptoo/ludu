import { useState } from 'react'
import { COLOR_META } from '../game/constants'
import type { Color, LuduRoom } from '../game/types'
import type { ChatMessage } from '../game/chat'
import { Board } from './Board'
import { ChatPanel } from './ChatPanel'
import { Dice } from './Dice'
import { ReactionOverlay } from './ReactionOverlay'
import './Game.css'

type Props = {
  room: LuduRoom
  myColor: Color | null
  isMyTurn: boolean
  movable: number[]
  busy: boolean
  localRolling: boolean
  error: string | null
  messages: ChatMessage[]
  floatingReactions: ChatMessage[]
  chatSending: boolean
  chatError?: string | null
  onRoll: () => void
  onMove: (pieceIndex: number) => void
  onLeave: () => void
  onRematch: () => void
  onSendChat: (text: string) => void
  onReact: (emoji: string) => void
  forceChatOpen?: boolean
  isPractice?: boolean
  isDesktop?: boolean
}

export function Game({
  room,
  myColor,
  isMyTurn,
  movable,
  busy,
  localRolling,
  error,
  messages,
  floatingReactions,
  chatSending,
  chatError,
  onRoll,
  onMove,
  onLeave,
  onRematch,
  onSendChat,
  onReact,
  isPractice = false,
}: Props) {
  const [chatOpen, setChatOpen] = useState(false)
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  const waiting = room.status === 'waiting'
  const canPlay = room.status === 'playing' || room.status === 'waiting'

  const canRoll =
    isMyTurn && canPlay && !room.dice_rolled && !busy && !localRolling

  const redName = room.host_name
  const yellowName = room.guest_name ?? (waiting ? 'Waiting for friend…' : '—')

  const inviteLink = (() => {
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('room', room.code)
      return url.toString()
    } catch {
      return room.code
    }
  })()

  const statusText =
    room.status === 'finished' && room.winner
      ? `${room.winner === 'red' ? redName : yellowName} wins!`
      : waiting
        ? `Waiting for friend — share link or code ${room.code}`
        : room.last_action ?? 'Game ready'

  const copyText = async (value: string, kind: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
      window.setTimeout(() => setCopied(null), 1800)
    } catch {
      window.prompt('Copy this:', value)
    }
  }

  return (
    <div className="game-shell">
      <div className="game-atmosphere" aria-hidden />
      <ReactionOverlay items={floatingReactions} />

      <div className={`game-layout${isPractice ? ' practice' : ''}`}>
        <section className="board-column">
          <div className="board-stage">
            <Board
              pieces={room.pieces}
              highlight={movable}
              myColor={myColor}
              onSelectPiece={onMove}
              currentTurn={room.current_turn}
            />
          </div>
        </section>

        <aside className="side-column">
          <header className="game-top">
            <div className="brand-mini">LUDU</div>
            {isPractice ? (
              <div className="room-chip practice-chip">
                <strong>PRACTICE</strong>
              </div>
            ) : (
              <button
                type="button"
                className="room-chip"
                onClick={() => void copyText(room.code, 'code')}
                title="Copy room code"
              >
                <span className="room-label">Code</span>
                <strong>{room.code}</strong>
                <span className="copy-hint">{copied === 'code' ? '✓' : 'Copy'}</span>
              </button>
            )}
            <button type="button" className="leave-btn" onClick={onLeave}>
              {isPractice ? 'Menu' : 'Leave'}
            </button>
          </header>

          {waiting && (
            <div className="waiting-banner">
              <p>
                Share this link with your friend. You can practice as Red until they join.
              </p>
              <div className="share-row">
                <button
                  type="button"
                  className="copy-inline"
                  onClick={() => void copyText(inviteLink, 'link')}
                >
                  {copied === 'link' ? 'Link copied!' : 'Copy invite link'}
                </button>
                <button
                  type="button"
                  className="copy-inline ghost"
                  onClick={() => void copyText(room.code, 'code')}
                >
                  {copied === 'code' ? 'Code copied!' : `Code ${room.code}`}
                </button>
              </div>
            </div>
          )}

          <div className="players-bar">
            <PlayerCard
              color="red"
              name={redName}
              you={myColor === 'red'}
              active={
                room.current_turn === 'red' &&
                (room.status === 'playing' || waiting)
              }
            />
            <PlayerCard
              color="yellow"
              name={yellowName}
              you={myColor === 'yellow'}
              active={room.current_turn === 'yellow' && room.status === 'playing'}
            />
          </div>

          <p className="status-line" role="status">
            {statusText}
          </p>

          {error && <p className="game-error">{error}</p>}

          {room.status === 'finished' && (
            <button
              type="button"
              className="btn rematch"
              onClick={onRematch}
              disabled={busy}
            >
              Rematch
            </button>
          )}

          <div className="desktop-controls">
            <div className="quick-reacts" aria-label="Quick reactions">
              {['😂', '🔥', '👏', '😮', '🎉', '👍'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="quick-react"
                  disabled={!myColor || chatSending}
                  onClick={() => onReact(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {canPlay && (
              <Dice
                value={room.dice_value}
                rolling={localRolling}
                disabled={!canRoll}
                onRoll={onRoll}
              />
            )}
            <button
              type="button"
              className="dock-chat desktop-chat-btn"
              onClick={() => setChatOpen(true)}
            >
              Chat
            </button>
          </div>
        </aside>

        <div className="mobile-dock">
          <div className="dock-reacts" aria-label="Quick reactions">
            {['😂', '🔥', '👏', '😮', '🎉', '👍'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="quick-react"
                disabled={!myColor || chatSending}
                onClick={() => onReact(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="dock-main">
            {canPlay ? (
              <Dice
                value={room.dice_value}
                rolling={localRolling}
                disabled={!canRoll}
                onRoll={onRoll}
              />
            ) : (
              <div className="dock-spacer" />
            )}
            <button
              type="button"
              className="dock-chat"
              onClick={() => setChatOpen(true)}
              aria-label="Open chat"
            >
              Chat
            </button>
          </div>
        </div>
      </div>

      <ChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={messages}
        sending={chatSending}
        myColor={myColor}
        onSend={onSendChat}
        onReact={onReact}
        error={chatError}
      />
    </div>
  )
}

function PlayerCard({
  color,
  name,
  you,
  active,
}: {
  color: Color
  name: string
  you: boolean
  active: boolean
}) {
  return (
    <div className={`player-card${active ? ' active' : ''}`}>
      <span className="swatch" style={{ background: COLOR_META[color].css }} />
      <div className="player-meta">
        <div className="pname">
          {name}
          {you ? ' · you' : ''}
        </div>
        <div className="pcolor">{COLOR_META[color].label}</div>
      </div>
      {active && <span className="turn-dot" aria-label="Current turn" />}
    </div>
  )
}
