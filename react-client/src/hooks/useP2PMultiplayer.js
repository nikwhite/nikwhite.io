import { useState, useEffect, useRef } from 'react'

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
  shouldStart = false,
  setPlayerID,
  playerTurn,
}) {
  // RTCPeerConnection
  const pc = useRef(null)
  // WebSocket
  const ws = useRef(null)
  // RTCDataChannel - returned from effect
  const dc = useRef(null)

  const [hasStarted, setHasStarted] = useState(false)
  const [messageQueue, setMessageQueue] = useState(new Set())
  const [connectionStatus, setConnectionStatus] = useState('new')

  useEffect(() => {
    if (hasStarted && !shouldStart) {
      try {
        ws.current?.close()
        pc.current?.close()
      } catch (err) {}
      ws.current = null
      pc.current = null
      dc.current = null
      setHasStarted(false)
      setConnectionStatus('')
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

    function drainMessageQueue() {
      if (!messageQueue.size) return

      for (const msg of messageQueue) {
        sendWebsocketMessage(msg)
      }
      setMessageQueue(new Set())
    }

    function sendWebsocketMessage(msg) {
      if (ws.current && ws.current.readyState === 1) {
        console.log('Sending Websocket message', msg)
        ws.current.send(JSON.stringify(msg))
      } else {
        messageQueue.add(msg)
        setMessageQueue(messageQueue)
        console.log('Websocket not ready for message: ', msg)
        console.log('Message queue: ', messageQueue)
      }
    }

    async function answerOffer(offer) {
      if (!offer) return

      console.log('Got offer', offer)
      await pc.current.setRemoteDescription(offer)
      const answer = await pc.current.createAnswer()
      pc.current.setLocalDescription(answer)
      console.log('Sending answer', answer)
      sendWebsocketMessage({answer})
    }

    async function setAnswer(answer) {
      if (!answer) return

      console.log('Got answer', answer)
      pc.current.setRemoteDescription(answer)
    }

    function startWebSocketConnection() {
      if (ws.current) return ws.current
      
      try {
        ws.current = new WebSocket(getWebsocketUrl())
        ws.current.addEventListener('open', e => {
          console.log('Socket open', e)
          drainMessageQueue()
          setConnectionStatus('Waiting for Player 2')
        })
        ws.current.addEventListener('message', e => {
          console.log('Socket message', e)
          let data = {}
          try {
            data = JSON.parse(e.data)
          } catch (err) {
            return console.error(err)
          }
          if (data.id) {
            setPlayerID(data.id)
          }
          answerOffer(data.offer)
          setAnswer(data.answer)
        })
        ws.current.addEventListener('close', e => {
          console.log('Socket closed', e)
          ws.current = null
        })
        ws.current.addEventListener('error', e => {
          console.log('Socket error', e)
          ws.current = null
        })
        return ws.current
      } catch(err) {
        console.error(err)
      }
    }

    function startPeerConnection() {
      if (pc.current) return pc.current
      try {
        pc.current = new RTCPeerConnection({
          iceServers,
          certificates: [rtcCert]
        })

        pc.current.addEventListener('iceconnectionstatechange', ()=> console.log('iceConnectionStateChange', pc.current.iceConnectionState))
        pc.current.addEventListener('icegatheringstatechange', async ()=> {
          console.log('ICE Gathering State changed to:', pc.current.iceGatheringState)
          if (pc.current.iceGatheringState === 'complete'){
            const offer = await pc.current.createOffer()
            await pc.current.setLocalDescription(offer)
            console.log('new offer', pc.current.localDescription)
            sendWebsocketMessage({offer: pc.current.localDescription})
            setConnectionStatus('Sending connectivity data')
          }
        })
        pc.current.addEventListener('connectionstatechange', ()=> {
          console.log('Connection State changed to', pc.current.connectionState)
          setConnectionStatus(pc.current.connectionState)
        })
        pc.current.addEventListener('signalingstatechange', ()=> console.log('Signaling State changed to', pc.current.signalingState))
        pc.current.addEventListener('datachannel', e => console.log('DataChannel', e))
        pc.current.addEventListener('negotiationneeded', async (e) => {
          // only player 1 starts negotiations
          if (playerTurn !== 0) return

          console.log('Negotiation started')
          const offer = await pc.current.createOffer()
          // This starts ICE gathering
          pc.current.setLocalDescription(offer)
          setConnectionStatus('Gathering connectivity data')
        })

        dc.current = pc.current.createDataChannel('game', {negotiated: true, id: 0})

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
 
  }, [
    game, gameCode, 
    playerID,  playerTurn, setPlayerID,
    shouldStart, hasStarted,
    messageQueue,
  ])

  return {
    dataChannel: dc.current,
    connectionStatus
  }
}

export default useP2PMultiplayer
