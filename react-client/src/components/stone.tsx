import React from 'react'
import './stone.css'

function Stone(props) {
  return (
    <div className={`${props.color}-stone`}></div>
  )
}

export default Stone