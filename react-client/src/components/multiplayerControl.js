import { useState, useContext, useRef } from 'react'
import Button from './button'
import MultiplayerContext from '../contexts/multiplayerContext'
import useGameCode from '../hooks/useGameCode'
import './multiplayerControl.css'

function MultiplayerControl() {
  const [hasCopied, setHasCopied] = useState(false)
  const {
    isMultiplayer, setIsMultiplayer, 
    gameCode, game,
    shutdown
  } = useContext(MultiplayerContext)

  const fetchingState = useGameCode({ 
    shouldFetch: isMultiplayer && !gameCode,
    game
  })

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