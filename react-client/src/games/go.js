import './go.css'
import { useState } from 'react'
import Button from '../components/button'
import IconLink from '../components/iconLink'
import GameControls from '../containers/gameControls'

const GH_URL = 'https://github.com/nikwhite/nikwhite.io/blob/master/react-client/src/games/go.js'
const BLACK = 'black'
const WHITE = 'white'
const DEFAULT_BOARD_SIZE = 5

function oppositeColor(color) {
  return color === BLACK ? WHITE : BLACK
}

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
  toKey() {
    return `${this.row},${this.col}`
  }
  getColor() {
    return this.stone && this.stone.props.color
  }
}

function gameBoardFactory(size = DEFAULT_BOARD_SIZE) {
  // <option> values are strings
  size = Number(size)
  let board = []
  for (let i=0; i < size; i++) {
    let row = []
    for (let j=0; j < size; j++) {
      row[j] = new BoardNode(i, j)
    }
    board[i] = row
  }
  return board
}

//    0
// 3 node 1
//    2
function getAdjacentNodes(board, node){
  return [
    board[node.row-1] && board[node.row-1][node.col],
    board[node.row][node.col+1],
    board[node.row+1] && board[node.row+1][node.col],
    board[node.row][node.col-1]
  ]
}

function isSameColor(color, node) {
  return node && node.stone && node.getColor() === color
}

function hasLiberty(board, node, color, visited = {}) {
  let adjacent = getAdjacentNodes(board, node)

  // allow recursive calls to same color adjacent nodes
  visited[node.toKey()] = node
  
  let hasOpening = adjacent.some(node => node && !node.stone)
  if (hasOpening) return true
  
  // adjacent groups share liberties
  let sameColorAdjacent = adjacent.filter(isSameColor.bind(this, color))
  for (let i = 0; i < sameColorAdjacent.length; i++) {
    let nextNode = sameColorAdjacent[i]
    let nextKey = nextNode.toKey()
    if (!visited[nextKey]) {
      if (hasLiberty(board, nextNode, color, visited)) return true
    }
  }
  return false
}

function Go() {
  const [passCount, setPassCount] = useState(0)
  const [turn, setTurn] = useState(BLACK)
  const [boardSize, setBoardSize] = useState(DEFAULT_BOARD_SIZE)
  const [board, setBoard] = useState(gameBoardFactory(boardSize))
  const [captures, setCaptures] = useState({black: 0, white: 0})

  function resetBoard() {
    setTurn(BLACK)
    setCaptures({black:0, white: 0})
    setBoard(gameBoardFactory(boardSize))
    setPassCount(0)
  }

  function handleBoardSizeChange(event) {
    setBoardSize(event.target.value)
  }

  function passTurn() {
    let nextPassCount = passCount + 1
    // passCount resets to 0 when a valid stone is placed
    setPassCount(nextPassCount)
    
    if (nextPassCount === 2) {
      //TODO: score game

    } else {
      setTurn(oppositeColor(turn))
    }
  }

  function captureNodes(startingNodes = [], possibleCaptures) {
    if (!startingNodes.length) return []
    
    // if a possibleCaptures[i] contains a captured Node, then the 
    // entire group should be removed from the board
    const captureGroup = possibleCaptures.reduce((result, group) => {
      for (const node of startingNodes) {
        if (group[node.toKey()]) {
          result.push(...Object.values(group))
          break
        }
      }
      return result
    }, [])

    for (const node of captureGroup) {
      captures[oppositeColor(node.getColor())]++
      node.removeStone()
    }
    setCaptures(captures)
  }

  function handleBoardClick(node) {
    if (node.stone || passCount >= 2) return
    
    // set stone first to make sure hasLiberty()
    // considers the open slot being played as
    // occupied for the purpose of determining 
    // if this node will suicide a group,
    // or capture another group
    node.setStone(turn)
    let nextTurn = oppositeColor(turn)

    // Check for captures,
    // i.e. oppsite color adjacent stones/groups with no liberties.
    // visitedGroups will contain ALL adjacent node groups of the opposite
    // color even those not capturable
    let visitedGroups = []
    // capturedNodes will be *just* contain the adjacent node(s) captured.
    // so if a capturedNode exists in a visitedGroup, that group
    // should be removed from the board
    let capturedNodes = getAdjacentNodes(board, node)
      .filter(isSameColor.bind(this, nextTurn))
      .filter((node, i) => {
        visitedGroups[i] = {}
        return !hasLiberty(board, node, nextTurn, visitedGroups[i])
      })
    
    // If this stone results in no liberties available,
    // and nothing is being captured, the move is illegal
    if (!hasLiberty(board, node, turn) && !capturedNodes.length) {
      return node.removeStone()
    }

    captureNodes(capturedNodes, visitedGroups)
    setPassCount(0)
    setTurn(nextTurn)
    setBoard(board)
  }

  return (
    <div>
      <h3>
        <IconLink 
          icon="github"
          url={GH_URL} />
          Go
      </h3>
      <GameControls>
        <label htmlFor="goBoardSizeSelect">Board size:</label>
        <select 
          id="goBoardSizeSelect" 
          value={boardSize} 
          onChange={handleBoardSizeChange}>
          <option value="5">5x5</option>
          <option value="9">9x9</option>
          <option value="13">13x13</option>
          <option value="17">17x17</option>
          <option value="19">19x19</option>
        </select>
        <Button onClick={resetBoard}>Reset</Button>
        <Button onClick={passTurn}>Pass turn</Button>
      </GameControls>
      <div className="goBoard">
        {board.map((row, i) => 
          <div 
            key={i}
            className="goRow">
            {row.map((node) => 
              <div 
                key={node.toKey()}
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