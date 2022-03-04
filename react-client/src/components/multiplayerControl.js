import { useState, useContext } from 'react'
import Button from './button'
import MultiplayerContext from '../contexts/multiplayerContext'
import useGameCode from '../hooks/useGameCode'

function MultiplayerControl() {
  const [hasCopied, setHasCopied] = useState(false)
  const {
    isMultiplayer, setIsMultiplayer, 
    gameCode, game
  } = useContext(MultiplayerContext)

  const fetchingState = useGameCode({ 
    shouldFetch: isMultiplayer && !gameCode,
    game
  })

  async function copyUrl() {
    try{
      await navigator.clipboard.writeText(getGameUrl())
      setHasCopied(true)
    } catch(err) {
      console.error(err)
    }
  }

  function getGameUrl() {
    if (!gameCode) return
    return `${window.location.origin}/#${game}:${gameCode}`
  }

  return (
    <>
      <Button onClick={() => setIsMultiplayer(!isMultiplayer)}>
        {isMultiplayer ? 'End' : 'Start'} Multiplayer
      </Button>
      {isMultiplayer &&
        <div>
          <label>
            <span>Share URL {hasCopied && <em>copied!</em>}</span>
            <input 
              readOnly
              value={getGameUrl() || fetchingState}
            />
            <Button 
              onClick={copyUrl} 
              disabled={!gameCode}>
              Copy
            </Button>  
          </label>
        </div>
      }
    </>
      
  )
}

export default MultiplayerControl