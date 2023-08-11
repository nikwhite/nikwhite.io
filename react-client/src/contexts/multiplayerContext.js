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
  // RTCDataChannel ref
  dataChannel: null,
  // graceful shutdown
  shutdown: ()=>{},
})

export default MultiplayerContext