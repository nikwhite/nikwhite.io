# nikwhite.io

## Dev info

### react-client

* `npm run start` to start dev server (and all create-react-app scripts)
* `npm run build` to build react-client/build/
* `npm run deploy` deploy react-client/build/* to Google Cloud Storage

## 2-Player Games over WebRTC Design

### Why WebRTC?

Maximize privacy, minimize backend costs.

The WebRTC Spec intentionaly leaves out when/where/why/how two peers decide to connect because this can be accomplished in varied ways depending on the application needs. This is why we need a Signaling Service to agree on the protocols, IPs, and ports used to establish a connection through NAT using STUN servers. We could use post-its delivered by carrier pigeon if we wanted, but a service will do it more efficiently.

### Signaling Service

In order to establish an `RTCPeerConnection`, each peer will open an a temporary `WebSocket` connection to the Signaling Service (Cloud Run Node.js app) for session negotiation to sync peers. Once the session negatiation process is complete according to the peers, we wait a little while to make sure no additional negotiation is required (to a better connection, for instance), then close the `WebSocket` connections on both ends, and tear down Cloud Run instance if there are no open sockets for any other signaling sessions. The main benefits of this approach are:
* This keeps Cloud Run utilization low by relying on WebRTC for game state communication, and will scale to 0 while no WebRTC sessions are being negotiated
* Low chance of scaling issues by using short-lived in-memory stores and ephemeral websocket connections (negotiations take seconds)
* Only one user step of sharing a URL which can be re-used if a connection is lost

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
            3. `iceCandidates` will be initialized to `[]`
            4. `isRtcConnected` will be initialized to `false`
    2. `Player1`s `id` will be set to a short, quick hash `H([game]:[code]:'player1')`. 
        * __Note:__ This is not meant to be cryptographically secure, just unique. We're just playing P2P games with a friend over HTTPS/WSS, after all. (See Threat Modeling section below when complete, this could change)
    3. Start a 10 minute timer. If by the end of the timer either `player1` or `player2` do not both have valid `id` and `socket` properties, close all open sockets for this `[game][code]` tuple
    4. Respond with `{code, id}`
2. `Player1` opens a `WebSocket` connection to the Signaling service with the `game` and newly created `code` and `id` parameters
3. __OUT OF BAND__ `Player1` sends the code via URL to `Player2`: `[URL]/#game:code` via SMS, email, etc.
4. `Player2` opens `[URL]/#game:code`, which opens a `WebSocket` connection to the Signaling Service with `game` and `code` parameters
    1. If the `[game][code]` tuple doesnt appear in the store, a race conditioned occurred, or the Signaling Service instance is not shared (TODO: Can we find the instance where the tuple does exist and hand off to that instance? Problem of scale to be solved later). Log an error, close the socket, prompt user to start the process over as `Player1`
5. Emit on `player1`'s `WebSocket` to start session negotiation as described in the [WebRTC Spec](https://w3c.github.io/webrtc-pc/#session-negotiation-model)
over the linked sockets. 
6. Simplified version of [WebRTC Sequence Diagram](https://w3c.github.io/webrtc-pc/images/ladder-2party-simple.svg)
    * __Note:__ This sequence could start from either side of the connection if the RTC connection is lost, so `player1` and `player2` roles *could* be reversed. The Signaling Service should be intelligent enough to know the difference between players and adjust messaging as needed.
7. `player2` will receive a  `'datachannel'` event to accept the basic data channel that was created by `player1`. Creating an answer after this event will provide `player1` with the answer required to start transmitting data (as soon as ICE candidates are negotiated)
8. Both `RTCPeerConnection`s will simultaneously start trying to connect to ICE servers, and provide successful candidates in the `'icecandidate'` event. Both peers will then emit their `iceCandidate` to the Signaling Service over their respsective `WebSocket` as they are established
9. The Signaling Service will collect these candidates, pushing them to the respective `[game][code].player[n].iceCandidates` and inspect them for a match between both players, emitting the first or best match for both players
10. When the `'connectionstatechange'` event fires on the peers, if they are connected successfully, they will emit to the Signaling Server `'rtcConnected'`. Once the Signaling server receives this from both peers, the `WebSocket`s will be torn down. 
11. Do some cleanup on the Signaling Server all games where `state === 'rtcConnected'`
```
enum state{
  'new',       // No sockets connected
  'waiting',   // Player1 connected to Signaling Service
  'connected', // Player2 connected to Signaling Service
  'negotiating', // waiting for offers/answers/ICE candidates
  'rtcConnected', // exit 
  'rtcFailed' // failed, report and exit?
}

string playerID{ H([game]:[code]:player[n]) }


                                |  In-Memory Store Schema       |
                                |-------------------------------|
                                |  [game][code]: {              |
                                |     state: Enum(state)        |
                                |     player1:                  |
                                |       id: playerID            |
                                |       socket:WebSocket        |
                                |       iceCandidates: []       |
                                |       isRtcConnected false    |
                                |     player2:                  |
                                |       id: playerID            |
                                |       socket:WebSocket        |
                                |       iceCandidates: []       |
                                |       isRtcConnected false    |
                                |  }                            |
                                |                               |
Player1                         |  Signaling Service            |  Player2
--------------------------------|-------------------------------|--------------------------
1. getGameCode(game)------------|->1. creates code & playerID   |
                                |     stores signaling state    |
                                |     data under [game][code]   |
1. recGameCode(code,id)<--------|-----returns code & playerID   | 
2. openSocket(game,code,id)-----|->2. set player1 socket        |
                                |     set state = 'waiting'     |
3. Shares url with Player2---------------------------------------->3. Opens URL
                                |  4. associate player2 socket<-|--4. openSocket(game,code)
                                |     create playerID, store    |
                                |     state = 'connected'       |
                                |     return playerID-----------|->4. socket.onopen(id)
5. socket.onmesssage<-----------|--5. Signal to start WebRTC    |     store id localStorage
                                |     session negotiation       |
6. Creates PeerConnection       |                               |
   socket.emit({offer, id})-----|->6. player1.socket.onmessage  |
                                |     state = 'negotiating'     |
                                |     pleyer2.socket.emit-------|->6. socket.onmessage({offer})
                                |                               |     Creates PeerConnection with offer 
                                |  6. player2.socket.onmessage<-|-----socket.emit({pranswer, id})
6. setRemoteDesc(pranswer)<-----|-----player1.socket.emit       |  7. 'datachannel' event
                                |  7. player2.socket.onmessage<-|-----socket.emit({answer, id})
7. setRemoteDesc(answer)<-------|-----player1.socket.emit       |
8. 'iceCandidate' event         |                               |  8. 'iceCandidate' event
    socket.emit({iceCandidate})-|->8. collect iceCandidates<----|-----socket.emit({iceCandidate})
                                |     for each player           |
                                |  9. when we find a match,     |
                                |     emit iceCandidate to both |
9. socket.onmessage-------------|-----player1.socket.emit       |
   setIceCandidate()            |     player2.socket.emit-------|->9. socket.onmessage
                                |                               |     setIceCandidate()
10. 'connectionstatechange' evt |                               |  10. 'connectionstatechange' event
    if connected,               |                               |      if connected,
    socket.emit('rtcConnected')-|->10. set isRtcConnected to<---|------socket.emit('rtcConnected')
                                |      true for the player.     |
                                |      If both are true,        |
                                |      state = 'rtcConnected'   |
                                |      close down the sockets   |
 
```

### Threat Model

TODO

### Testing

TODO: This will be interesting to automate...

### Ops

TODO: Logging/Analytics, GCP Cloud Run config

## Copyright
All code, designs and documents in this repo are Copyright of Nik White. All rights reserved.