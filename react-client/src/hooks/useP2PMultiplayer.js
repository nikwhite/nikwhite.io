import { useEffect } from 'react'

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

function useP2PMultiplayer({
  game = '',
  gameCode = '',
  playerID = '',
  shouldStart = false,
  shouldAbort = false
}) {

  let pc = null
  let ws = null
  let rtcCert = null
  function cleanup() {
    pc = null
    ws = null
    rtcCert = null
  }

  // TODO: store/retrieve from IndexedDB when available
  async function getCert() {
    if (rtcCert) return rtcCert

    rtcCert = await RTCPeerConnection.generateCertificate(ECDSA_CERT_CONFIG)
    return rtcCert
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

    pc = new RTCPeerConnection({
      iceServers,
      certificates: [cert]
    })
    pc.addEventListener('icecandidate', sendIceCandidate)
    pc.addEventListener('icecandidateerror', evt => console.log('iceCandidateError', evt))
    pc.addEventListener('iceconnectionstatechange', ()=> console.log('iceConnectionStateChange', pc.iceConnectionState))
    pc.addEventListener('icegatheringstatechange', ()=> console.log('iceGatheringStateChange', pc.iceGatheringState))
    pc.addEventListener('connectionstatechange', ()=> console.log('connectionStateChange', pc.connectionState))
    pc.addEventListener('signalingstatechange', ()=> console.log('signalingStateChange', pc.signalingState))
    pc.addEventListener('negotiationneeded', evt => {
      console.log('negotiationNeeded', evt)
    })

    return pc
  }

  useEffect(() => {
    if (!game || !gameCode) return
    
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
  }, [game, gameCode, shouldStart, shouldAbort])

  return pc
}

export default useP2PMultiplayer
