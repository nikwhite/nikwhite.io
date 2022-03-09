import { useState, useContext, useRef } from 'react'
import Button from './button'
import MultiplayerContext from '../contexts/multiplayerContext'
import useGameCode from '../hooks/useGameCode'
import useP2PMultiplayer from '../hooks/useP2PMultiplayer'
import './multiplayerControl.css'
/**
 * MultiplayerControl implements hooks to start/stop a multiplayer
 * session via the parent MultiplayerContext.Provider (implemented 
 * in the <Game> container) in response to user actions
 * @returns <ReactComponent>
 */
function MultiplayerControl() {
  const [hasCopied, setHasCopied] = useState(false)
  const {
    isMultiplayer, setIsMultiplayer, 
    gameCode, game, playerID, playerTurn,
    shutdown, setPlayerID
  } = useContext(MultiplayerContext)
  // get a gameCode when one doesn't exist from the URL
  // and the user has indicated to start the multiplayer session
  const fetchingState = useGameCode({ 
    game,
    shouldFetch: !gameCode && isMultiplayer,
  })
  // create the peer and websocket connections 
  // once we have a gameCode
  const dataChannel = useP2PMultiplayer({
    game, gameCode, playerID, setPlayerID,
    shouldStart: gameCode && isMultiplayer,
    playerTurn
  })

  // save the url readonly input to focus and select
  const inputRef = useRef(null)
  async function copyUrl() {
    try{
      await navigator.clipboard.writeText(getGameUrl())
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 4000)
    } catch(err) {
      console.error(err)
    }
    inputRef.current.focus()
    inputRef.current.select()
  }

  function startMultiplayer() {
    // triggers useGameCode shouldFetch param above
    setIsMultiplayer(true)
  }

  function endMultiplayer() {
    // clears existing gameCode, playerID
    // sets isMultiplayer to false
    shutdown()
  }

  function getGameUrl() {
    if (!gameCode) return
    return `${window.location.origin}/#${game}:${gameCode}`
  }

  return (
    <>
      <Button onClick={isMultiplayer ? endMultiplayer : startMultiplayer}>
        {isMultiplayer ? 'End' : 'Start'} Multiplayer
      </Button>
      <div className={`shareUrl ${isMultiplayer && 'expandDown'}`}>
        {isMultiplayer && <>
          <label>
            <span>Share URL</span>
            {hasCopied && <em>Copied!</em>}
            <input
              readOnly
              className='mono'
              ref={inputRef}
              value={getGameUrl() || fetchingState}
            />
          </label>
          <Button
            onClick={copyUrl} 
            disabled={!gameCode}>
            Copy
          </Button>
        </>}
      </div>
    </>
      
  )
}

export default MultiplayerControl