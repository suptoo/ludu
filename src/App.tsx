import { useEffect, useState } from 'react'
import { Game } from './components/Game'
import { Lobby } from './components/Lobby'
import { useChat } from './hooks/useChat'
import { useGameRoom, usePlayerIdentity } from './hooks/useGameRoom'
import './App.css'

export default function App() {
  const { playerId, playerName, saveName } = usePlayerIdentity()
  const game = useGameRoom(playerId, playerName)
  const chat = useChat(
    game.isPractice ? undefined : game.room?.id,
    playerId,
    playerName,
    game.myColor,
  )

  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 900px)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)')
    const onChange = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  if (!game.room) {
    return (
      <Lobby
        playerName={playerName}
        onSaveName={saveName}
        configured={game.configured}
        busy={game.busy}
        error={game.error}
        onCreate={game.createRoom}
        onJoin={game.joinRoom}
        onPractice={game.startPractice}
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
      isPractice={game.isPractice}
      onRoll={game.doRoll}
      onMove={game.doMove}
      onLeave={game.leaveRoom}
      onRematch={game.rematch}
      onSendChat={(text) => void chat.send(text, 'chat')}
      onReact={(emoji) => void chat.send(emoji, 'reaction')}
      forceChatOpen={isDesktop && !game.isPractice}
    />
  )
}
