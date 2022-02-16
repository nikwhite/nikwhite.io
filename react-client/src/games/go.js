import './go.css'
import { useState } from 'react'
import Button from '../components/button'
import IconLink from '../components/iconLink'
import GameControls from '../containers/gameControls'
import Scoreboard from '../containers/scoreboard'
import ScoreCard from '../components/scoreCard'
import Stone from '../components/stone'

const GH_URL = 'https://github.com/nikwhite/nikwhite.io/blob/master/react-client/src/games/go.js'
const BLACK = 'black'
const WHITE = 'white'
const EDGE = 'edge'
const COUNTER_LABEL = 'Captures'
const DEFAULT_BOARD_SIZE = 5
const START_SCORES_CAPTURES = {
  black: 0,
  white: 0
}

function oppositeColor(color) {
  return color === BLACK ? WHITE : BLACK
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

function getTerminalNodeColor(board, node, incRow, incCol) {
  if (!node) return EDGE
  if (node.stone) return node.getColor()

  let nextRow = board[node.row + incRow]
  let nextNode = nextRow && nextRow[node.col + incCol]
  
  return getTerminalNodeColor(board, nextNode, incRow, incCol)
}

function getOwner(board, node) {
  const owner = getAdjacentNodes(board, node)
    .map((node, i) => {
      let rowInc = 0
      let colInc = 0
      switch (i) {
        case 0: rowInc = -1; break;
        case 1: colInc =  1; break;
        case 2: rowInc =  1; break;
        case 3: colInc = -1; break;
        default: throw new Error('Too many adjacent nodes');
      }
      return getTerminalNodeColor(board, node, rowInc, colInc)
    })
    .reduce((owner, terminalNodeColor) => {
      // allow the first non-edge terminal node be the owner
      if (!owner.color && terminalNodeColor !== EDGE) {
        owner.color = terminalNodeColor
      }
      // count nodes of the same color and edges
      if (terminalNodeColor === owner.color) {
        owner.nodes++
      } else if (terminalNodeColor === EDGE) {
        owner.edges++
      }

      return owner
    }, /*owner*/ {color: null, edges: 0, nodes: 0})

    if (owner.color && owner.edges + owner.nodes === 4){
      return owner
    }
    return null
}

function getScores(board, captures) {
  //TODO: add Komi to white
  const score = {
    [BLACK]: captures[BLACK],
    [WHITE]: captures[WHITE]
  }

  for (let i=0, li=board.length; i<li; i++) {
    for (let j=0, lj=board[i].length; j<lj; j++) {
      const node = board[i][j]
      if (!node.stone) {
        const owner = getOwner(board, node)
        if (owner) {
          score[owner.color]++
        }
      }
    }
  }

  return score
}

function Go() {
  const [passCount, setPassCount] = useState(0)
  const [turn, setTurn] = useState(BLACK)
  const [boardSize, setBoardSize] = useState(DEFAULT_BOARD_SIZE)
  const [board, setBoard] = useState(gameBoardFactory(boardSize))
  const [captures, setCaptures] = useState({...START_SCORES_CAPTURES})
  const [scores, setScores] = useState({...START_SCORES_CAPTURES})

  function resetBoard() {
    setTurn(BLACK)
    setCaptures({...START_SCORES_CAPTURES})
    setScores({...START_SCORES_CAPTURES})
    setBoard(gameBoardFactory(boardSize))
    setPassCount(0)
  }

  function handleBoardSizeChange(event) {
    setBoardSize(event.target.value)
  }

  function endGame() {
    setScores(getScores(board, captures))
  }

  function resign() {
    endGame()
  }

  function passTurn() {
    let nextPassCount = passCount + 1
    // passCount resets to 0 when a valid stone is placed
    // or when game is reset
    setPassCount(nextPassCount)
    
    if (nextPassCount >= 2) {
      endGame()

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

  const turnActions = [
    <Button onClick={passTurn}>Pass</Button>,
    <Button onClick={resign}>Resign</Button>
  ]

  return (
    <section className="goGame">
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
      </GameControls>
      <Scoreboard
        player1={
          <ScoreCard
            team={BLACK}
            score={scores[BLACK]}
            active={turn === BLACK}
            counter={captures[BLACK]}
            counterLabel={COUNTER_LABEL}
            turnActions={turnActions}
          />
        }
        player2={
          <ScoreCard
            team={WHITE}
            score={scores[WHITE]}
            active={turn === WHITE}
            counter={captures[WHITE]}
            counterLabel={COUNTER_LABEL}
            turnActions={turnActions}
          />
        } 
      />
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
    </section> 
  )
} 

export default Go