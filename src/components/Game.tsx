import { useState, type CSSProperties } from 'react'
import { COLOR_META } from '../game/constants'
import { hasPieceInYard } from '../game/engine'
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

  const blueName = room.host_name
  const greenName = room.guest_name ?? (waiting ? 'Waiting…' : '—')

  const rolledSix = room.dice_value === 6
  const needSixHint =
    Boolean(isMyTurn && myColor && canPlay && !room.dice_rolled) &&
    Boolean(myColor && hasPieceInYard(room.pieces, myColor))

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
      ? `${room.winner === 'blue' ? blueName : greenName} wins!`
      : waiting
        ? `Waiting for friend — share link or code ${room.code}`
        : room.last_action ?? 'Need a 6 to leave base!'

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
        <aside className="side-column">
          <header className="game-top">
            <button type="button" className="menu-btn" onClick={onLeave} aria-label="Menu">
              ☰
            </button>
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
          </header>

          {waiting && (
            <div className="waiting-banner">
              <p>Share the link. Practice as Blue until they join. Need a 6 to leave base.</p>
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
        </aside>

        <section className="board-column">
          <div className="board-stage">
            <div
              className={`corner-dice top-right${
                room.current_turn === 'green' && canPlay ? ' active' : ''
              }${rolledSix && room.current_turn === 'green' ? ' six' : ''}`}
            >
              <DiceFace
                value={room.current_turn === 'green' ? room.dice_value : null}
                rolling={localRolling && room.current_turn === 'green'}
                color="green"
              />
              {room.current_turn === 'green' && canPlay && (
                <span className="turn-arrow" aria-hidden>
                  ▶
                </span>
              )}
            </div>

            <Board
              pieces={room.pieces}
              highlight={movable}
              myColor={myColor}
              onSelectPiece={onMove}
              currentTurn={room.current_turn}
              blueName={blueName}
              greenName={greenName}
            />

            <div
              className={`corner-dice bottom-left${
                room.current_turn === 'blue' && canPlay ? ' active' : ''
              }${rolledSix && room.current_turn === 'blue' ? ' six' : ''}`}
            >
              {room.current_turn === 'blue' && canPlay && (
                <span className="turn-arrow" aria-hidden>
                  ▶
                </span>
              )}
              <DiceFace
                value={room.current_turn === 'blue' ? room.dice_value : null}
                rolling={localRolling && room.current_turn === 'blue'}
                color="blue"
              />
            </div>
          </div>
        </section>

        <div className="game-footer">
          {needSixHint && (
            <p className="six-banner" role="status">
              Need a <strong>6</strong> to leave base
            </p>
          )}
          {rolledSix && room.dice_rolled && (
            <p className="six-banner six-hit" role="status">
              SIX! Move a piece
            </p>
          )}

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
                  highlightSix={rolledSix}
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

const FACES: Record<number, number[][]> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],
  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],
  6: [
    [0, 0],
    [0, 2],
    [1, 0],
    [1, 2],
    [2, 0],
    [2, 2],
  ],
}

function DiceFace({
  value,
  rolling,
  color,
}: {
  value: number | null
  rolling: boolean
  color: Color
}) {
  const show = value && value >= 1 && value <= 6 ? value : null
  const pips = show ? FACES[show] : []
  return (
    <div
      className={`dice-tray${rolling ? ' rolling' : ''}${show === 6 ? ' is-six' : ''}`}
      style={{ '--tray': COLOR_META[color].css } as CSSProperties}
    >
      <span className="tray-token" aria-hidden>
        <svg viewBox="0 0 48 64" width="22" height="28">
          <path
            d="M24 4c-9.4 0-17 7.6-17 17 0 12.8 17 35 17 35s17-22.2 17-35c0-9.4-7.6-17-17-17z"
            fill={COLOR_META[color].css}
            stroke="#111"
            strokeWidth="2"
          />
          <circle cx="24" cy="20" r="8" fill="#fff" />
          <circle cx="24" cy="20" r="5" fill={COLOR_META[color].css} />
        </svg>
      </span>
      <span className="tray-die">
        {show ? (
          <span className="mini-face">
            {pips.map(([r, c], i) => (
              <span
                key={i}
                className="mini-pip"
                style={{ gridRow: r + 1, gridColumn: c + 1 }}
              />
            ))}
          </span>
        ) : (
          <span className="tray-empty" />
        )}
      </span>
    </div>
  )
}
