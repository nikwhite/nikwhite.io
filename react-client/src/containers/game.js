import { useState } from 'react'
import MultiplayerContext from '../contexts/multiplayerContext'

function Game(props) {
  const [isMultiplayer, setIsMultiplayer] = useState(false)
  const [gameCode, setGameCode] = useState('')
  const [board, setBoard] = useState([[]])
  const [turn, setTurn] = useState('')
  const [myTurn, setMyTurn] = useState('')
  const [playerID, setPlayerID] = useState('')
  const [gameData, setGameData] = useState({})

  function shutdown() {
    setIsMultiplayer(false)
    setGameCode('')
    setPlayerID('')
  }
  
  const mpContext = {
    game: props.name,
    isMultiplayer, setIsMultiplayer,
    gameCode, setGameCode,
    board, setBoard,
    turn, setTurn,
    myTurn, setMyTurn,
    playerID, setPlayerID,
    gameData, setGameData,
    shutdown,
  }



  return (
    <div className={`game ${props.name}`}>
      <MultiplayerContext.Provider value={mpContext}>
        {props.children}
      </MultiplayerContext.Provider>
    </div>
  )
}

export default Game