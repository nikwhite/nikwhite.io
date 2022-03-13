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
  const [connectionStatus, setConnectionStatus] = useState('')

  useEffect(() => {
    const isPlayer1 = playerTurn === 0
    if (hasStarted && !shouldStart) {
      try {
        ws.current?.close()
        pc.current?.close()
      } catch (err) {}
      //TODO: is nulling satisfoactory for preventing memory leakage?
      ws.current = null
      pc.current = null
      dc.current = null
      setHasStarted(false)
      setMessageQueue(new Set())
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

    async function setOffer(offer) {
      if (!offer) return

      console.log('Got offer', offer)
      pc.current.setRemoteDescription(offer)
    }

    async function setAnswer(answer) {
      if (!answer || pc.current.signalingState === 'stable') return

      console.log('Got answer', answer)
      pc.current.setRemoteDescription(answer)
    }

    async function createOffer(iceRestart) {
      const offer = await pc.current.createOffer({iceRestart})
      pc.current.setLocalDescription(offer)
      console.log('Created offer', offer)
      sendWebsocketMessage({offer})
    }

    async function createAnswer() {
      const answer = await pc.current.createAnswer()
      if (pc.current.iceGatheringState !== 'complete') {
        answer.type = 'pranswer'
      }
      pc.current.setLocalDescription(answer)
      console.log('Sending answer', answer)
      sendWebsocketMessage({answer})
    }

    function startWebSocketConnection() {
      if (ws.current) return ws.current
      
      try {
        ws.current = new WebSocket(getWebsocketUrl())
        ws.current.addEventListener('open', e => {
          console.log('Socket open', e)
          drainMessageQueue()
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
          setOffer(data.offer)
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

    function needsFullOffer() {
      return ( isPlayer1 
        && pc.current.iceGatheringState === 'complete' 
        && pc.current.signalingState === 'have-local-offer'
      )
    }

    function needsFullAnswer() {
      return ( !isPlayer1 
        && pc.current.iceGatheringState === 'complete' 
        && pc.current.signalingState === 'have-local-pranswer'
      )
    }

    function startPeerConnection() {
      if (pc.current) return pc.current
      try {
        pc.current = new RTCPeerConnection({
          iceServers,
          certificates: [rtcCert]
        })

        pc.current.addEventListener('iceconnectionstatechange', ()=> console.log('iceConnectionStateChange', pc.current.iceConnectionState))
        pc.current.addEventListener('icegatheringstatechange', ()=> {
          console.log('ICE Gathering State changed to:', pc.current.iceGatheringState)
          if ( needsFullOffer() ) {
            createOffer()
            setConnectionStatus('waiting for player 2')
          } else if ( needsFullAnswer() ) {
            createAnswer()
          }
        })
        pc.current.addEventListener('connectionstatechange', ()=> {
          console.log('Connection State changed to', pc.current.connectionState)
          setConnectionStatus(pc.current.connectionState)
          // if (pc.current.connectionState === 'connected') {
          //   sendWebsocketMessage({rtcConnected: true})
          // }
          // if player 2 disconnects, attempt a resend a new offer
          // if player 1 disconnects, negotiation will trigger a new offer
          if (isPlayer1 && pc.current.connectionState === 'failed') {
            createOffer(true)
          }
        })
        pc.current.addEventListener('signalingstatechange', ()=> {
          console.log('Signaling State changed to', pc.current.signalingState)
          switch (pc.current.signalingState) {
            case 'have-remote-offer': createAnswer(); break;
            default: break;
          }
        })
        pc.current.addEventListener('negotiationneeded', async (e) => {
          console.log('Negotiation needed')
          // only player 1 starts negotiations
          if (!isPlayer1) return

          setConnectionStatus('connecting')
          const offer = await pc.current.createOffer()
          // This starts ICE gathering
          pc.current.setLocalDescription(offer)
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
