import { useEffect, useRef, useState } from 'react'
import { Game } from './components/Game'
import { Lobby } from './components/Lobby'
import { useChat } from './hooks/useChat'
import { useGameRoom, usePlayerIdentity } from './hooks/useGameRoom'
import './App.css'

function readRoomFromUrl(): string | null {
  try {
    const code = new URLSearchParams(window.location.search).get('room')
    return code ? code.trim().toUpperCase() : null
  } catch {
    return null
  }
}

export default function App() {
  const { playerId, playerName, saveName } = usePlayerIdentity()
  const game = useGameRoom(playerId, playerName)
  const chat = useChat(game.room?.id, playerId, playerName, game.myColor)
  const autoJoinTried = useRef(false)

  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 900px)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)')
    const onChange = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Open invite link: https://yoursite.com/?room=ABC123
  useEffect(() => {
    if (autoJoinTried.current || game.room) return
    const code = readRoomFromUrl()
    if (!code) return
    autoJoinTried.current = true
    void game.joinRoom(code)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- join once on load
  }, [game.room, game.joinRoom])

  if (!game.room) {
    return (
      <Lobby
        playerName={playerName}
        onSaveName={saveName}
        busy={game.busy}
        error={game.error}
        onCreate={(name) => void game.createRoom(name)}
        onJoin={(code, name) => void game.joinRoom(code, name)}
        onPractice={(name) => game.startPractice(name)}
      />
    )
  }

  return (
    <Game
      room={game.room}
      myColor={game.myColor}
      isMyTurn={game.isMyTurn}
      movable={game.movable}
      busy={game.busy}
      localRolling={game.localRolling}
      error={game.error}
      messages={chat.messages}
      floatingReactions={chat.floating}
      chatSending={chat.sending}
      chatError={chat.error}
      isPractice={game.isPractice}
      onRoll={game.doRoll}
      onMove={game.doMove}
      onLeave={game.leaveRoom}
      onRematch={game.rematch}
      onSendChat={(text) => void chat.send(text, 'chat')}
      onReact={(emoji) => void chat.send(emoji, 'reaction')}
      forceChatOpen={false}
      isDesktop={isDesktop}
    />
  )
}
