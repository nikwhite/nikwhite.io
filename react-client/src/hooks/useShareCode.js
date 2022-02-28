import { useEffect, useState } from 'react'

export default function useGameCode({shouldFetch = false, game = ''}) {
  const [gameCode, setGameCode] = useState('')
  const [playerID, setPlayerID] = useState('')
  const [fetchingState, setFetchingState] = useState('')
  
  useEffect(() => {
    if (!shouldFetch || !game) return

    async function fetchCode() {
      if (fetchingState === 'fetching') {
        return
      }
      setFetchingState('fetching')

      let res = await fetch('/signal/gamecode', {
        method: 'POST',
        credentials: 'omit',
        cache: 'no-store',
        body: JSON.stringify({game})
      })

      if (!res.ok) {
        throw new Error(`Request for game code failed with ${res.status} ${res.statusText}`)
      }

      let data = await res.json()

      if (data?.code && data?.id) {
        setFetchingState('done')
        return data
      }

      throw new Error('Request for game code succeeded, but without a code')
    }

    try {
      const {code, id} = await fetchCode()
      setGameCode(code)
      setPlayerID(id)
    } catch(err) {
      setFetchingState('error')
      console.error(err)
    }
  })

  return {gameCode, playerID, fetchingState}
}