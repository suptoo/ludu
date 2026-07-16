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
  onRoll: () => void
  onMove: (pieceIndex: number) => void
  onLeave: () => void
  onRematch: () => void
  onSendChat: (text: string) => void
  onReact: (emoji: string) => void
  forceChatOpen?: boolean
  isPractice?: boolean
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
  onRoll,
  onMove,
  onLeave,
  onRematch,
  onSendChat,
  onReact,
  forceChatOpen = false,
  isPractice = false,
}: Props) {
  const [chatOpen, setChatOpen] = useState(false)
  const panelOpen = forceChatOpen || chatOpen
  const [copied, setCopied] = useState(false)

  const waiting = room.status === 'waiting'
  const canPlay =
    room.status === 'playing' || room.status === 'waiting'

  const canRoll =
    isMyTurn &&
    canPlay &&
    !room.dice_rolled &&
    !busy &&
    !localRolling

  const redName = room.host_name
  const yellowName = room.guest_name ?? (waiting ? 'Waiting for friend…' : '—')

  const statusText =
    room.status === 'finished' && room.winner
      ? `${room.winner === 'red' ? redName : yellowName} wins!`
      : waiting
        ? room.last_action ??
          `Waiting for friend — you can practice with Red. Code: ${room.code}`
        : room.last_action ?? 'Game ready'

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* ignore */
    }
  }

  const diceBlock = canPlay && (
    <Dice
      value={room.dice_value}
      rolling={localRolling}
      disabled={!canRoll}
      onRoll={onRoll}
    />
  )

  const reacts = (
    <div className="quick-reacts" aria-label="Quick reactions">
      {['😂', '🔥', '👏', '😮', '🎉', '👍'].map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="quick-react"
          disabled={!myColor || chatSending || waiting}
          onClick={() => onReact(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  )

  return (
    <div className="game-shell">
      <div className="game-atmosphere" aria-hidden />
      <ReactionOverlay items={floatingReactions} />

      {chatOpen && !forceChatOpen && (
        <button
          type="button"
          className="chat-backdrop"
          aria-label="Close chat"
          onClick={() => setChatOpen(false)}
        />
      )}

      <div className={`game-layout${isPractice ? ' practice' : ''}`}>
        {/* LEFT on desktop: the Ludu board */}
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

        {/* RIGHT on desktop / below on mobile: controls */}
        <aside className="side-column">
          <header className="game-top">
            <div className="brand-mini">LUDU</div>
            {isPractice ? (
              <div className="room-chip practice-chip">
                <strong>PRACTICE</strong>
                <span className="copy-hint">Both sides</span>
              </div>
            ) : (
              <button
                type="button"
                className="room-chip"
                onClick={copyCode}
                title="Copy room code"
              >
                <span className="room-label">Code</span>
                <strong>{room.code}</strong>
                <span className="copy-hint">{copied ? '✓' : 'Copy'}</span>
              </button>
            )}
            <button type="button" className="leave-btn" onClick={onLeave}>
              {isPractice ? 'Menu' : 'Leave'}
            </button>
          </header>

          {waiting && (
            <div className="waiting-banner">
              <p>
                Share <strong>{room.code}</strong> — practice as Red until they join.
                Game resets when friend joins.
              </p>
              <button type="button" className="copy-inline" onClick={copyCode}>
                {copied ? 'Copied!' : 'Copy code'}
              </button>
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
            {reacts}
            {diceBlock}
            {!isPractice && (
              <button
                type="button"
                className="dock-chat desktop-chat-btn"
                onClick={() => setChatOpen(true)}
              >
                Open chat
              </button>
            )}
          </div>
        </aside>

        {/* Mobile thumb dock */}
        <div className="mobile-dock">
          <div className="dock-reacts" aria-label="Quick reactions">
            {['😂', '🔥', '👏', '😮', '🎉', '👍'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="quick-react"
                disabled={!myColor || chatSending || waiting}
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

        <ChatPanel
          open={panelOpen}
          onClose={() => setChatOpen(false)}
          messages={messages}
          sending={chatSending}
          myColor={myColor}
          onSend={onSendChat}
          onReact={onReact}
        />
      </div>
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
