import { useState, useEffect } from 'react'

const STUN_HOSTS = [
  'stun:stun1.l.google.com:19302',
  'stun:stun4.l.google.com:19302',
  'stun:stun2.l.google.com:19302',
  'stun:stun3.l.google.com:19302',
]
const iceServers = [{ urls: STUN_HOSTS }]
const ECDSA_CERT_CONFIG = {
  name: 'ECDSA',
  namedCurve: 'P-256'
}
const PARAM_RE = /^[a-zA-Z0-9+/=:]*$/
let rtcCert = null

function useP2PMultiplayer({
  game = '',
  gameCode = '',
  playerID = '',
  shouldStart = false
}) {
  const [pc, setPC] = useState(null)
  const [ws, setWS] = useState(null)
  const [hasStarted, setHasStarted] = useState(false)
  const [iceCandidates, setIceCandidates] = useState([])

  useEffect(() => {
    if (hasStarted && !shouldStart) {
      try {
        ws.close()
        pc.close()
      } catch (err) {
        console.log(err)
      }
      setWS(null)
      setPC(null)
      setHasStarted(false)
    }
    // playerID is optional to start (for player 2), but should
    // be set by player 1 before shouldStart is set to true
    if (!game || !gameCode || !shouldStart || hasStarted) return

    // TODO: store/retrieve from IndexedDB when available
    async function getCert() {
      if (rtcCert) return rtcCert

      rtcCert = await RTCPeerConnection.generateCertificate(ECDSA_CERT_CONFIG)
      return rtcCert
    }

    function getWebsocketUrl() {
      // try not to reflect /store XSS
      const areParamsValid = [game,gameCode,playerID]
        .map(param => PARAM_RE.test(param))
        .every(result => result)

      if (!areParamsValid) return

      const params = new URLSearchParams({
        game,
        code: gameCode,
      })
      playerID && params.set('id', playerID)
      //TODO: ENV var
      const url = new URL(`wss://localhost:3000/signal/connect?${params.toString()}`)
      return url.href
    }

    function sendIceCandidate({candidate}) {
      console.log('sending candidate', candidate)
      ws.send({candidate})
    }

    function startWebSocketConnection(game, code) {
      if (ws) return ws
      
      try {
        let newWS = new WebSocket(getWebsocketUrl())
        newWS.addEventListener('open', e => {
          console.log('Socket open', e)
        })
        newWS.addEventListener('message', e => {
          console.log('Socket message', e)
        })
        newWS.addEventListener('close', e => {
          console.log('Socket closed', e)
          setWS(null)
        })
        newWS.addEventListener('error', e => {
          console.log('Socket error', e)
          setWS(null)
        })
        setWS(newWS)
        return newWS
      } catch(err) {
        console.error(err)
      }
    }

    function startPeerConnection() {
      if (pc) return pc
      try {
        let newPC = new RTCPeerConnection({
          iceServers,
          certificates: [rtcCert]
        })
        newPC.addEventListener('icecandidate', sendIceCandidate)
        newPC.addEventListener('icecandidateerror', evt => console.log('iceCandidateError', evt))
        newPC.addEventListener('iceconnectionstatechange', ()=> console.log('iceConnectionStateChange', newPC.iceConnectionState))
        newPC.addEventListener('icegatheringstatechange', ()=> console.log('iceGatheringStateChange', newPC.iceGatheringState))
        newPC.addEventListener('connectionstatechange', ()=> console.log('connectionStateChange', newPC.connectionState))
        newPC.addEventListener('signalingstatechange', ()=> console.log('signalingStateChange', newPC.signalingState))
        newPC.addEventListener('negotiationneeded', evt => {
          console.log('negotiationNeeded', evt)
        })
        newPC.createDataChannel('gameData', {negotiated: true, id: 0})
        setPC(newPC)
        return newPC
      } catch(err) {
        console.error(err)
      }
    }
    
    async function setupPeerConnection() {
      setHasStarted(true)
      try {
        await getCert()
        startWebSocketConnection()
        startPeerConnection()
      } catch(e) {
        console.error(e)
      }
    }
    
    setupPeerConnection()

  }, [game, gameCode, playerID, shouldStart, hasStarted, pc, ws])

  return pc
}

export default useP2PMultiplayer
