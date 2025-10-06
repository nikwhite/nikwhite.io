import React from 'react'
import './scoreboard.css'

function Scoreboard(props) {
  return (
    <pre className="scoreboard">
      {props.children}
      <div className="player1">
        {props.player1}
      </div>
      <div className="player2">
        {props.player2}
      </div>
    </pre>
  )
}

export default Scoreboard