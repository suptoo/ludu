import { useState } from 'react'
import { Board } from './Board'
import './Lobby.css'

type Props = {
  playerName: string
  onSaveName: (name: string) => void
  configured: boolean
  busy: boolean
  error: string | null
  onCreate: () => void
  onJoin: (code: string) => void
  onPractice: () => void
}

/** Preview: Red + Yellow pawns in yards (looks like a real Ludu board). */
const PREVIEW_PIECES = {
  red: [-1, -1, -1, -1] as number[],
  yellow: [-1, -1, -1, -1] as number[],
}

export function Lobby({
  playerName,
  onSaveName,
  configured,
  busy,
  error,
  onCreate,
  onJoin,
  onPractice,
}: Props) {
  const [name, setName] = useState(playerName)
  const [code, setCode] = useState('')
  const [mode, setMode] = useState<'home' | 'join'>('home')

  const commitName = () => {
    if (name.trim()) onSaveName(name.trim())
  }

  return (
    <div className="lobby">
      <div className="lobby-atmosphere" aria-hidden />

      <header className="lobby-hero">
        <p className="lobby-kicker">Classic Ludu board · 2 players</p>
        <h1 className="brand">LUDU</h1>
      </header>

      <div className="lobby-board-preview" aria-hidden>
        <Board
          pieces={PREVIEW_PIECES}
          highlight={[]}
          myColor={null}
          onSelectPiece={() => {}}
          currentTurn="red"
        />
      </div>

      <section className="lobby-panel">
        <button
          type="button"
          className="btn primary btn-play"
          disabled={busy}
          onClick={() => {
            commitName()
            onPractice()
          }}
        >
          ▶ Play Ludu now
        </button>

        <label className="field">
          <span>Your name (for online)</span>
          <input
            value={name}
            maxLength={20}
            placeholder="Player"
            autoComplete="nickname"
            enterKeyHint="done"
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
          />
        </label>

        {mode === 'home' ? (
          <div className="lobby-actions">
            <button
              type="button"
              className="btn ghost"
              disabled={busy || !configured || !name.trim()}
              onClick={() => {
                commitName()
                onCreate()
              }}
            >
              Online: create room
            </button>
            <button
              type="button"
              className="btn ghost"
              disabled={busy || !configured || !name.trim()}
              onClick={() => {
                commitName()
                setMode('join')
              }}
            >
              Online: join with code
            </button>
          </div>
        ) : (
          <div className="join-stack">
            <label className="field">
              <span>Enter room code</span>
              <input
                value={code}
                maxLength={6}
                placeholder="ABC123"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                inputMode="text"
                enterKeyHint="go"
                onChange={(e) =>
                  setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && code.trim().length >= 4) {
                    commitName()
                    onJoin(code)
                  }
                }}
              />
            </label>
            <button
              type="button"
              className="btn primary"
              disabled={busy || code.trim().length < 4}
              onClick={() => {
                commitName()
                onJoin(code)
              }}
            >
              Join game
            </button>
            <button type="button" className="btn ghost" onClick={() => setMode('home')}>
              Back
            </button>
          </div>
        )}

        {error && <p className="lobby-error">{error}</p>}
      </section>
    </div>
  )
}
