import { useEffect, useState, useContext } from 'react'
import MultiplayerContext from '../contexts/multiplayerContext'

const FetchStates = {
  Start: 'Starting...',
  Fetching: 'Fetching...',
  Error: 'Error! Oh no!',
  Done: 'Got game code'
}

export default function useGameCode({shouldFetch = false, game = ''}) {
  const [fetchingState, setFetchingState] = useState(FetchStates.Start)
  const [fetchCount, setFetchCount] = useState(0)
  const {
    gameCode, setGameCode,
    setPlayerID,
    setPlayerTurn, setTurn
  } = useContext(MultiplayerContext)
  
  useEffect(() => {
    async function fetchCode() {
      if (fetchingState === FetchStates.Fetching || fetchCount >= 5) return 
     
      setFetchCount(fetchCount + 1)
      setFetchingState(FetchStates.Fetching)

      try {
        let res = await fetch('/signal/gamecode', {
          method: 'POST',
          accept: 'application/json',
          credentials: 'omit',
          cache: 'no-store',
          body: JSON.stringify({game})
        })
        if (!res.ok) {
          throw new Error(`Request for game code failed with ${res.status} ${res.statusText}`)
        }

        let data = await res.json()
        if (data?.code && data?.id) {
          setPlayerID(data.id)
          setGameCode(data.code)
          setFetchingState(FetchStates.Done)
          return
        }
        
        throw new Error('Request for game code succeeded, but without code and/or ID')

      } catch(err) {
        setFetchingState(FetchStates.Error)
        console.error(err)
      }
    }

    if (shouldFetch && game && !gameCode) {
      fetchCode()
    }

    return function cleanup() {
      if (!shouldFetch) {
        setFetchCount(0)
      }
    }
  }, [
    shouldFetch, game,
    gameCode, setGameCode,
    setPlayerID,
    fetchCount, fetchingState,
    setTurn, setPlayerTurn
  ])

  return fetchingState
}