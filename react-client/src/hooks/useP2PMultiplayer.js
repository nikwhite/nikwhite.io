import { useState, useEffect } from 'react'

const STUN_HOSTS = [
  'stun:stun1.l.google.com:19302',
  'stun:stun4.l.google.com:19302',
  'stun:stun2.l.google.com:19302',
  'stun:stun3.l.google.com:19302',
]
const iceServers = { urls: STUN_HOSTS }
const ECDSA_CERT_CONFIG = {
  name: 'ECDSA',
  namedCurve: 'P-256'
}

let RTC_CERT = null

function useP2PMultiplayer({
  game = '',
  gameCode = '',
  shouldStart = false
}) {
  const [pc, setPC] = useState(null)
  const [ws, setWS] = useState(null)

  function cleanup() {
    // gracefully close pc and ws if connections are open
  }

  // TODO: store/retrieve from IndexedDB when available
  async function getCert() {
    if (RTC_CERT) return RTC_CERT

    RTC_CERT = await RTCPeerConnection.generateCertificate(ECDSA_CERT_CONFIG)
    return RTC_CERT
  }

  function sendIceCandidate({candidate}) {
    console.log('sending candidate', candidate)
    // ws.send({candidate})
  }

  async function startWebSocketConnection() {
    if (ws) return ws

    //ws = new WebSocket()
  }

  async function startPeerConnection(cert) {
    if (pc) return pc

    let newPC = new RTCPeerConnection({
      iceServers,
      certificates: [cert]
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
    setPC(newPC)
    return newPC
  }

  useEffect(() => {
    if (!game || !gameCode || !shouldStart) return
    
    async function setupPeerConnection() {
      let cert = await getCert()
      await startWebSocketConnection(gameCode)
      return startPeerConnection(cert)
    }

    try {
      setupPeerConnection()
    } catch(e) {
      console.error(e)
    }

    return cleanup
  }, [game, gameCode, shouldStart])

  return pc
}

export default useP2PMultiplayer
