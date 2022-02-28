
'use strict';

const { createServer } = require('http')
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
  ['tictactoe', new Map()],
  ['connect4', new Map()],
  ['go', new Map()],
])

//------------------------------------------------//
//  Error responders
//------------------------------------------------//
function badReq(res) {
  res.writeHead(400, 'Bad request').end()
}
function notFound(res) {
  res.writeHead(404, 'Not found').end()
}
function methodNotAllowed(res) {
  res.writeHead(405, 'Method not allowed').end()
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

async function generatePlayerID(game, code, player = 1) {
  const txtEnc = new TextEncoder()
  const data = txtEnc.encode(`${game}:${code}:player${player}`)
  return await subtle.digest('SHA-256', data)
}

async function generateAesKey() {
  const key = await subtle.generateKey({
    name: S_KEY_TYPE,
    length: 256
  }, true, ['encrypt', 'decrypt']);

  return key
}

async function encryptSessionCode(key, code) {
  const txtEnc = new TextEncoder()
  const iv = getRandomValues(new Uint8Array(16))
  const ciphercode = await subtle.encrypt({
    name: S_KEY_TYPE,
    iv,
  }, key, txtEnc.encode(code))

  return ciphercode
}

function generateSessionCode(sessions) {
  let uuid = randomUUID()
  if (sessions.has(uuid)) {
    return generateSessionCode(sessions)
  }
  return uuid
}

//------------------------------------------------//
//  Store object factories
//------------------------------------------------//
function playerFactory(id = '') {
  return { 
    id,
    wss: null,
    iceCandidates: [],
    isRtcConnected: false
  }
}

async function sessionFactory(game, code) {
  const [
    player1ID, 
    aesKey
  ] = await Promise.all([
    generatePlayerID(game, code, 1),
    generateAesKey()
  ])

  return {
    aesKey,
    state: 'new',
    startTime: Date.now(),
    player1: playerFactory(player1ID),
    player2: playerFactory()
  }
}

//------------------------------------------------//
//  POST /signal/gamecode 
//  data: {game: string}
//------------------------------------------------//
async function createGameCode(req, res, data = {}) {
  const game = data.game

  if (!game || !store.has(game)) {
    badReq(res)
  }

  const sessions = store.get(game)
  const sessionCode = generateSessionCode(sessions)
  const sessionData = await sessionFactory(game, sessionCode)
  // The session lives!
  store.set(sessionCode, sessionData)
  console.log(`Started ${game} session: ${sessionCode}`)

  const ciphercode = await encryptSessionCode(sessionData.aesKey, sessionCode)
  const responseData = {
    code: ciphercode,
    id: sessionData.player1.id
  }

  sendJsonResponse(res, responseData)
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
  }
}

const server = createServer()

server.on('request', (req, res) => {
  //TODO: Origin check

  const reqUrl = new URL(req.url, req.headers.origin)
  console.log('Request:', reqUrl)

  const methods = services[reqUrl.pathname]
  if (!methods) {
    return notFound(res)
  }

  const endpoint = methods[req.method]
  if (!endpoint?.handler) {
    return methodNotAllowed(res)
  }

  let body = ''
  req.setEncoding('utf8')
  req.on('data', chunk => body += chunk)
  req.on('end', () => {
    try {
      const data = JSON.parse(body || '{}')
      // TODO: JSON Schema on data
      // send parsed reqUrl to avoid re-parsing
      endpoint.handler(req, res, data, reqUrl)
    } catch (err) {
      console.log('Request JSON Parsing error', err)
      badReq(res)
    }
  })
})

server.on('upgrade', (request, socket, head) => {
  //TODO: Origin check
  const url = new URL(req.url, req.headers.origin)
  console.log('Upgrade request: ', url)

  if (url.pathname === '/signal/ws') {

  } else {
    socket.destroy();
  }
})

server.on('error', (...args) => {
  console.log('wtf m8\n', ...args)
})

server.on('listening', (e) => {
  console.log(`Signal up on :${PORT}`)
})

const PORT = process.env.PORT || 8080

server.listen(PORT)
