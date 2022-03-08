
'use strict';

const { createServer } = require('http')
const { Buffer } = require('buffer')
const { WebSocketServer } = require('ws') 
const { 
  subtle, 
  randomUUID, 
  getRandomValues 
} = require('crypto').webcrypto

//------------------------------------------------//
//  Store 
//  explicitly defines all supported games with 
//  a map for sessionCode:sessionData pairs
//------------------------------------------------//
const store = new Map([
  ['ticTacToe', new Map()],
  ['connect4', new Map()],
  ['go', new Map()],
])

//------------------------------------------------//
//  Error responders
//------------------------------------------------//
function endConnection(writable, reason) {
  writable.end(`HTTP/1.1 ${reason}`, 'utf8', ()=> writable.destroy())
  return {}
} 
function badReq(res) {
  return endConnection(res, '400 Bad request')
}
function notFound(res) {
  return endConnection(res, '404 Not found')
}
function methodNotAllowed(res) {
  return endConnection(res, '405 Method not allowed')
}

//------------------------------------------------//
//  Success responders
//------------------------------------------------//
function sendJsonResponse(res, data) {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  })
  res.end(JSON.stringify(data))
}

//------------------------------------------------//
//  WebCrypto utilities
//------------------------------------------------//
const S_KEY_TYPE = 'AES-GCM'

const fromBase64 = b64str => Buffer.from(b64str, 'base64')
const toBase64 = buf => Buffer.from(buf).toString('base64')

async function generatePlayerID(game, code, player) {
  const txtEnc = new TextEncoder()
  const data = txtEnc.encode(`${game}:${code}:player${player}`)
  const digest = await subtle.digest('SHA-256', data)
  return toBase64(digest)
}

let AES_KEY = null
async function generateAesKey() {
  if (AES_KEY) return AES_KEY
  AES_KEY = await subtle.generateKey({
    name: S_KEY_TYPE,
    length: 256
  }, true, ['encrypt', 'decrypt']);

  return AES_KEY
}

async function encryptSessionCode(code) {
  const txtEnc = new TextEncoder()
  const iv = getRandomValues(new Uint8Array(16))
  const ciphercode = await subtle.encrypt({
    name: S_KEY_TYPE,
    iv,
  }, AES_KEY, txtEnc.encode(code))

  return [ciphercode, iv].map(toBase64).join(':')
}

async function decryptSessionCode(code) {
  const dc = new TextDecoder()
  const [ciphercode, iv] = code.split(':').map(fromBase64)
  let plaintext = new ArrayBuffer()
  try {
    plaintext = await subtle.decrypt({
      name: S_KEY_TYPE,
      iv,
    }, AES_KEY, ciphercode)
  } catch (err) {
    throw err
  }
  return dc.decode(plaintext)
}

function generateSessionCode(sessions) {
  let uuid = randomUUID()
  if (sessions.has(uuid)) {
    return generateSessionCode(sessions)
  }
  return uuid
}

function validateSession(game, code, id) {

}

//------------------------------------------------//
//  Store object factories
//------------------------------------------------//
function playerFactory(id = '') {
  return { 
    id,
    ws: null,
    iceCandidates: [],
    isRtcConnected: false
  }
}

async function sessionFactory(game, code) {
  const [
    player1ID, 
    player2ID,
  ] = await Promise.all([
    generatePlayerID(game, code, 1),
    generatePlayerID(game, code, 2),
    generateAesKey()
  ])
  return {
    state: 'new',
    startTime: Date.now(),
    player1: playerFactory(player1ID),
    player2: playerFactory(player2ID)
  }
}

//------------------------------------------------//
//  POST /signal/gamecode 
//  data: {game: string}
//------------------------------------------------//
async function createGameCode(req, res, data = {}) {
  const game = data.game

  if (!game || !store.has(game)) {
    return badReq(res)
  }

  const sessions = store.get(game)
  const sessionCode = generateSessionCode(sessions)
  const sessionData = await sessionFactory(game, sessionCode)
  // The session lives!
  sessions.set(sessionCode, sessionData)
  console.log(`Started ${game} session: ${sessionCode}`)
  const ciphercode = await encryptSessionCode(sessionCode)
  const responseData = {
    code: ciphercode,
    id: sessionData.player1.id
  }

  sendJsonResponse(res, responseData)
}

//------------------------------------------------//
//  GET /signal/connect 
//  upgrade: websocket
//  searchParams: {game: string, code: string, id: string}
//------------------------------------------------//
async function openSocket(req, socket, head, reqUrl) {
  const game = reqUrl.searchParams.get('game')
  const code = reqUrl.searchParams.get('code')
  const playerID = reqUrl.searchParams.get('id')

  // validate the game name
  if (!store.has(game)) 
    return badReq(socket)

  // decrypt and validate the session code
  const sessions = store.get(game)
  let sessionCode = null
  try {
    sessionCode = await decryptSessionCode(code)
  } catch (err) {
    return badReq(socket)
  }

  console.log('Decrypted session code: ', sessionCode)

  if (!sessions.has(sessionCode))
    return badReq(socket)

  console.log('Opening socket: ', reqUrl.pathname)
  const sessionData = sessions.get(sessionCode)
  const isPlayer1 = sessionData.player1.id === playerID
  const wss = new WebSocketServer({noServer: true})

  wss.on('connection', (ws) => {
    if (isPlayer1) {
      sessionData.player1.ws = ws
    } else {
      sessionData.player2.ws = ws
      ws.send(JSON.stringify({id: sessionData.player2.id}))
    }

    if (sessionData.player1.ws && sessionData.state ==='new' ) {
      sessionData.state = 'waiting'
    }
    if (sessionData.player1.ws && sessionData.player2.ws) {
      sessionData.state = 'connected'
      console.log(`Player 2 connected to session: ${sessionCode}`)
    }

    sessions.set(sessionCode, sessionData)

    function forwardMessage(msg) {

    }

    ws.on('message', (data) => {
      console.log('Socket message:', data)
      // if (isPlayer1) {
      //   sessionData.player2.ws.send(msg)
      // } else {
      //   sessionData.player1.ws.send(msg)
      // }
    })
    ws.on('close', (code, reason) => {
      console.log('Socket closed', code, reason.toString('utf8'))
    })
    ws.on('error', (err) => {
      console.log('Socket error', err)
    })
  })

  wss.handleUpgrade(req, socket, head, (ws) => {
    console.log('Handling upgrade, readyState:', ws.readyState)
    wss.emit('connection', ws, req)
  })
}

//------------------------------------------------//
//  Route definitions
//  /signal routed from LB
//------------------------------------------------//
const services = {
  '/signal/gamecode': {
    'POST':  {
      handler: createGameCode,
      schema: 'TODO JSON Schema'
    }
  },
  '/signal/connect': {
    'GET': {
      handler: openSocket,
      schema: 'TODO JSON Schema'
    }
  }
}

function validateRequest(req, res) {
  //TODO: Origin check
  let reqUrl;
  try {
    reqUrl = new URL(req.url, req.headers.origin)  
  } catch(err) {
    return badReq(res)
  }

  const methods = services[reqUrl.pathname]
  if (!methods) {
    return notFound(res)
  }

  const handler = methods[req.method]?.handler 
  if (!handler) {
    return methodNotAllowed(res)
  }

  return {reqUrl, handler}
}

const server = createServer()

server.on('request', (req, res) => {
  const {reqUrl, handler} = validateRequest(req, res)
  if (!reqUrl || !handler) return

  const ts = new Date().toISOString()
  console.log(`${ts} Request:`, reqUrl.href)

  let body = ''
  req.setEncoding('utf8')
  req.on('data', chunk => body += chunk)
  req.on('end', () => {
    try {
      const data = JSON.parse(body || '{}')
      // TODO: JSON Schema on data
      // send parsed reqUrl to avoid re-parsing
      handler(req, res, data, reqUrl)
    } catch (err) {
      console.log('Request JSON Parsing error', err)
      badReq(res)
    }
  })
})

server.on('upgrade', (req, socket, head) => {
  const {reqUrl, handler} = validateRequest(req, socket)
  if (!reqUrl || !handler) return

  const ts = new Date().toISOString()
  console.log(`${ts} Upgrade Request: `, reqUrl.href)

  handler(req, socket, head, reqUrl)
})

server.on('error', (...args) => {
  console.log('wtf m8\n', ...args)
})

server.on('listening', (e) => {
  console.log(`Signal up on :${PORT}`)
})

const PORT = process.env.PORT || 8080

server.listen(PORT)
