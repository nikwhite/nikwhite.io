# nikwhite.io

## Dev info

### react-client

* `npm run start` to start dev server (and all create-react-app scripts)
* `npm run build` to build react-client/build/
* `npm run deploy` deploy react-client/build/* to Google Cloud Storage

## 2-Player Games over WebRTC Design

### Signaling 

In order to establish an `RTCPeerConnection`, each peer will need to open an a temporary `WebSocket` connection to the Signaling Service (Cloud Run Node.js app) for ICE negotiation. Once the ICE negatiation process is complete according to the peers, we wait a little while to make sure no additional negotiation is required (to a better connection, for instance), then close the `WebSocket` connections on both ends, and tear down Cloud Run instance if there are no open sockets for any other signaling sessions. The main benefits are:
* This keeps Cloud Run utilization low by relying on WebRTC for game state communication, and will scale to 0 while no WebRTC sessions are being negotiated
* Low chance of scaling issues by using short-lived in-memory stores and ephemeral websocket connections (negotiations take seconds)

#### Why Cloud Run

* App Engine Standard does not support `WebSocket`s, but can scale to 0
* App Engine Flexible supports `WebSocket`s, but cold start time is lengthy and does not scale to 0, which is excess cost
* Cloud Compute is more than needed

### Process and Diagram

1. `Player1` generates a `game` (go, connect4, tictactoe) `code` (UUID) via the signaling service, which it stores in-memory in the hierarchy shown below 
    
    1. `code` will be generated as a `randomUUID`, checked for collisions in the store, recreated as necessary, and used as the key for the signaling state, which will be constructed as follows:
        1. `state` will be initialized to `'new'`
        2. For both `player1` and `player2` objects:
            1. `id` will be initialized to `""` 
            2. `socket` will be initialized to `null`
    2. `Player1`s `id` will be set to a short, quick hash `H([game]:[code]:'player1')`. 
        * *NOTE:* This is not meant to be cryptographically secure, just unique. We're just playing P2P games with a friend over HTTPS/WSS, after all. (See Threat Modeling section below when complete, this could change)
    3. Start a 10 minute timer. If by the end of the timer either `player1` or `player2` do not both have valid `id` and `socket` properties, close all open sockets for this `[game][code]` tuple
    4. Respond with `{code, id}`
2. `Player1` opens a `WebSocket` connection to the Signaling service with the `game` and newly created `code` and `id` parameters
3. *OUT OF BAND* `Player1` sends the code via URL to `Player2`: `[URL]/#game:code` via SMS, email, etc.
4. `Player2` opens `[URL]/#game:code`, which opens a `WebSocket` connection to the Signaling Service with `game` and `code` parameters
    1. If the `[game][code]` tuple doesnt appear in the store, a race conditioned occurred, or the Signaling Service instance is not shared (TODO: Can we find the instance where the tuple does exist and hand off to that instance? Problem of scale to be solved later). Log an error, close the socket, prompt user to start the process over as `Player1` 
    2. 
5. Start ICE negotiation as described in the [WebRTC Spec](https://w3c.github.io/webrtc-pc/#session-negotiation-model)
over the linked sockets. See [WebRTC Squence Diagram](https://w3c.github.io/webrtc-pc/images/ladder-2party-simple.svg)
    1. TODO
```
Enum:state(
  'new',       // No sockets connected
  'waiting',   // Player1 connected
  'connected', // Player2 connected
  'gatheringICECandidates', // ICE candidates trickle in from peers
  'awaitingOffer', // waiting for player1 offer
  'awaitingAnswer', // waiting for player2 answer
  ''
)

String:playerID( H([game]:[code]:player[n]) )


                              |  In-Memory Store Schema       |
                              |-------------------------------|
                              |  [game][code]: {              |
                              |     state: Enum(state)        |
                              |     player1:                  |
                              |       id: playerID            |
                              |       socket:WebSocket        |
                              |     player2:                  |
                              |       id: playerID            |
                              |       socket:WebSocket        |
                              |  }                            |
                              |                               |
Player1                       |  Signaling Service            |  Player2
------------------------------|-------------------------------|--------------------------
1. getGameCode(game)----------|->1. creates code & playerID   |
                              |     stores iems under         |
                              |     [game][code].player1      |
1. recGameCode(code,id)<------|-----returns code & playerID   | 
2. openSocket(game,code,id)---|->2. set player1 socket        |
                              |     set state = 'waiting'     |
3. Shares url with Player2-------------------------------------->3. Opens URL
                              |  4. associate player2 socket<-|--4. openSocket(game,code)
                              |     create playerID, store    |
                              |     state = 'connected'       |
                              |     return playerID-----------|->4. WebSocket.onOpen(playerID)
5. WebSocket.onmesssage<------|--5. Signal to start WebRTC    |     store playerID locally
                              |     ICE negotiation           |

```
## Threat Model

TODO

## Copyright
All code, designs and documents in this repo are Copyright of Nik White. All rights reserved.