import React, {useState} from 'react'
import './connect4.css'

const GH_URL = 'https://github.com/nikwhite/nikwhite.io/blob/master/react-client/src/games/connect4.js'

function BoardNode(row, col) {
    this.row = row
    this.col = col
    this.color = ''
    this.sameColorNeighbors = {
        // store references to same-color neighbors
        // when position < 4, compliment = position + 4
        // when position >= 4, compliment = position - 4
        // this way, +/- 4 results in a straight line
        0: null, 1: null, 2: null, 
        7: null, /*node*/ 3: null, 
        6: null, 5: null, 4: null
  }
}

const HEIGHT = 6
const WIDTH = 7
const PINK = 'pink'
const BLUE = 'blue'
const OPPOSITE_NODES = [
  [7,3], // row
  [1,5], // col
  [2,6], // diag
  [0,4], // diag
]

function gameBoardFactory() {
  let emptyGameBoard = []
  for (let i=0; i < HEIGHT; i++) {
    let row = []
    for (let j=0; j < WIDTH; j++) {
      row[j] = new BoardNode(i, j)
    }
    emptyGameBoard[i] = row
  }
  return emptyGameBoard
}

function getLowestEmptyNode(board, col) {
  let row = board.length - 1
  //bottom up simpler than top-down and back-track
  while (row >= 0) {
    if (!board[row][col].color) {
      return board[row][col]
    }
    row--
  }
  return null
}

function getAdjacentNodes(board, node) {
  let prevRow = board[node.row - 1]
  let curRow = board[node.row]
  let nextRow = board[node.row + 1]

  prevRow = prevRow ? 
    [prevRow[node.col-1], prevRow[node.col], prevRow[node.col+1]]
    : []
  curRow = [curRow[node.col-1], curRow[node.col+1]]
  nextRow = nextRow ? 
    [nextRow[node.col-1], nextRow[node.col], nextRow[node.col+1]]
    : []

  return {
    0: prevRow[0], 1: prevRow[1], 2: prevRow[2],
    7: curRow[0],   /**node **/   3: curRow[1],
    6: nextRow[0], 5: nextRow[1], 4: nextRow[2]
  }
}

function filterSameColor(color, adjacentNodes) {
  return Object.entries(adjacentNodes).reduce((filtered, [position, node]) => {
    if (node && node.color === color) {
      filtered[position] = node
    }
    return filtered
  }, {})
}

function setAdjacentSameColorNeighbors(node) {
  Object.entries(node.sameColorNeighbors)
        .forEach(([position, neighbor]) => {
          if (neighbor && neighbor.color === node.color) {
            position = Number(position)
            let complimentPosition = position + (position < 4 ? 4 : -4)
            neighbor.sameColorNeighbors[complimentPosition] = node
          } 
        })
}

function getNodesFromPosition(node, position, carry) {
  carry = carry || []
  if (node.sameColorNeighbors[position]) {
    let nextNode = node.sameColorNeighbors[position]
    carry.push(nextNode)
    return getNodesFromPosition(nextNode, position, carry)
  }
  return carry
}

function getWinners(node) {
  return OPPOSITE_NODES.reduce((winners, [left, right]) => {
    if (node.sameColorNeighbors[left] || node.sameColorNeighbors[right]) {
      let chain = [
        ...getNodesFromPosition(node, left),
        node,
        ...getNodesFromPosition(node, right)
      ]
      if (chain.length >= 4) {
        winners.push(chain)
      }
    }
    return winners
  }, [])
}

function Connect4() {
  const [board, setBoard] = useState(gameBoardFactory())
  const [turn, setTurn] = useState(PINK)
  const [winners, setWinners] = useState([])

  function resetBoard() {
    setBoard(gameBoardFactory())
    setWinners([])
  }

  function handleClick(column){
    if (winners.length) return

    let node = getLowestEmptyNode(board, column)

    if (node && !node.color) {
      node.color = turn
      
      let adjacentNodes = getAdjacentNodes(board, node)
      node.sameColorNeighbors = {
        ...node.sameColorNeighbors,
        ...filterSameColor(node.color, adjacentNodes)
      }

      setAdjacentSameColorNeighbors(node)
      setBoard(board)
      setTurn(turn === PINK ? BLUE : PINK)
      setWinners( getWinners(node) )
    }
  }

  if (winners) {
    winners.forEach(winnerChain => {
      winnerChain.forEach(node => node.winner = true)
    })
  }
  
  return (
    <div className="connect4board">
      <h3>Connect4
        <a 
          className="gh-link" 
          href={GH_URL}
          target="_blank"
          rel="noreferrer">
          <i className="icon-github"></i>
        </a>
      </h3>
      <button onClick={resetBoard}>Reset</button>
      
      {board.map((row, i) => (
        <div className="row" key={'c4,'+i}>
          {row.map((node, col) => (
            <div 
              key={[i,col].join()}
              onClick={e => handleClick(col)}
              className={'slot '+(node.winner?'winner':'')}>
              {node.color && 
                <div className={node.color +'-token'}></div>
              }
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default Connect4