import './go.css'
import { useState } from 'react'
import ResetButton from '../components/resetButton'
import IconLink from '../components/iconLink'

const BLACK = 'black'
const WHITE = 'white'

function Stone(props) {
  return (
    <div className={`${props.color}-stone`}></div>
  )
}

class BoardNode {
  constructor(row, col) {
    this.row = row
    this.col = col
    this.stone = null
  }
  setStone(color) {
    this.stone = <Stone color={color}/>
  }
  removeStone() {
    this.stone = null
  }
}

function gameBoardFactory(width, height) {
  let board = []
  for (let i=0; i < height; i++) {
    let row = []
    for (let j=0; j < width; j++) {
      row[j] = new BoardNode(i, j)
    }
    board[i] = row
  }
  return board
}

function Go() {
  const [turn, setTurn] = useState(BLACK)
  const [board, setBoard] = useState(gameBoardFactory(5,5))
  const [whiteCaptures, setWhiteCaptures] = useState([])
  const [blackCaptures, setBlackCaptures] = useState([])

  function resetBoard() {
    setBoard(gameBoardFactory(5,5))
  }

  function handleBoardClick(node) {
    if (node.stone) return

    node.setStone(turn)

    setBoard(board)
    setTurn(turn === BLACK ? WHITE : BLACK)
  }

  return (
    <div>
      <h3>
        <IconLink 
          icon="github"
          url={'#'} />
          Go
      </h3>
      <div className="gameControls">
        <ResetButton onClick={resetBoard} />  
      </div>
      <div className="goBoard">
        {board.map((row, i) => 
          <div 
            key={i}
            className="goRow">
            {row.map((node) => 
              <div 
                key={`${node.row},${node.col}`}
                className="goLiberty" 
                onClick={() => handleBoardClick(node)}>
                {node.stone && node.stone}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    
  )
} 

export default Go