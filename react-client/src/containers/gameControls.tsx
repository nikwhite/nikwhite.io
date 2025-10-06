import React from 'react'
import './gameControls.css'

function GameControls(props) {
    return (
        <pre className="gameControls">
            {props.children}
        </pre>
    )
}

export default GameControls