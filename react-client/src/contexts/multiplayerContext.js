import { createContext } from 'react'

const MultiplayerContext = createContext({
  game: '',
  isMultiplayer: false,
  setIsMultiplayer: ()=>{},
  gameCode: '',
  setGameCode: ()=>{},
  // board data 2d array
  board: [[]],
  setGameBoard: ()=>{},
  // the current turn
  turn: '',
  setTurn: ()=>{},
  // if (turn !== playerTurn) {prevent board updates}
  playerTurn: '',
  setPlayerTurn: ()=>{},
  playerID: '',
  setPlayerID: ()=>{},
  // arbitrary game data, like go captures or connect4 wins
  gameData: {},
  setGameData: ()=>{},
  // graceful shutdown
  shutdown: ()=>{},
})

export default MultiplayerContext