import { useState } from 'react'
import MultiplayerContext from '../contexts/multiplayerContext'

//TODO handle multiple games per session
const url = new URL(window.location.href)
const hash = url.hash?.[0] === '#' ? url.hash.substring(1) : url.hash
const [gameFromUrl, codeFromUrl] = hash.split(':')

function Game(props) {
  const gameHasCode = (props.name === gameFromUrl && !!codeFromUrl)
  const [isMultiplayer, setIsMultiplayer] = useState(gameHasCode ? true : false)
  const [gameCode, setGameCode] = useState(gameHasCode ? codeFromUrl : '')
  const [board, setBoard] = useState([[]])
  const [turn, setTurn] = useState(0)
  const [playerTurn, setPlayerTurn] = useState(0)
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
    playerTurn, setPlayerTurn,
    playerID, setPlayerID,
    gameData, setGameData,
    shutdown,
  }

  return (
    <section className={`game ${props.name}`}>
      <MultiplayerContext.Provider value={mpContext}>
        {props.children}
      </MultiplayerContext.Provider>
    </section>
  )
}

export default Game