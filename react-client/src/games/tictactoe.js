import './tictactoe.css'
import {useState} from 'react'
import IconLink from '../components/iconLink'
import Button from '../components/button'
import GameControls from '../containers/gameControls'
import Scoreboard from '../containers/scoreboard'
import ScoreCard from '../components/scoreCard'

const GH_URL = 'https://github.com/nikwhite/nikwhite.io/blob/master/react-client/src/games/tictactoe.js'
const X = 'X'
const O = 'O'
const diagLeft =  [[0,0], [1,1], [2,2]]
const diagRight = [[2,0], [1,1], [0,2]]

function getCleanBoard() {
  return [
    ['', '', ''],
    ['', '', ''],
    ['', '', ''],
  ]
}

function allMatch(values, char) {
  for (let i=0; i < values.length; i++) {
    if (values[i] !== char) return false
  }
  return true
}

function TicTacToe() {
  const [board, setBoard] = useState(getCleanBoard())
  const [turn, setTurn] = useState(X)
  const [winner, setWinner] = useState('')
  const [winnerTypes, setWinnerTypes] = useState([])

  function resetBoard() {
    setBoard(getCleanBoard())
    setTurn(winner === X ? O : X)
    setWinner('')
    setWinnerTypes([])
  }

  function charAt([row, col]) {
    return board[row][col]
  }

  function isColWinner(col, char) {
    const colValues = board.map(row => row[col])
    return allMatch(colValues, char)
  }

  function isRowWinner(row, char) {
    return allMatch(board[row], char)
  }

  function isDiagWinner(diagNodes, char) {
    return allMatch(diagNodes.map(charAt), char)
  }
  
  function isDiagSlot(row, col) {
    let max = board.length - 1
    let min = 0
    return ((row === min || row === max) && (col === min || col === max)) || (row === 1 && col === 1)
  }

  function getWinnerState(fromRow, fromCol, char) {
    let rowWinner = isRowWinner(fromRow, char)
    let colWinner = isColWinner(fromCol, char)
    let diagWinner = false
    //  a list of CSS classNames to apply the strikethrough visual for winning combos
    let winnerTypes = []
    if (rowWinner) {
      winnerTypes.push(`row-${fromRow}-win`)
    }
    if (colWinner) {
      winnerTypes.push(`col-${fromCol}-win`)
    }
    // if we're checking from a corner or the center, need to check diagonal win condition
    if (isDiagSlot(fromRow, fromCol)) {
      let diagRightWinner = isDiagWinner(diagRight, char)
      let diagLeftWinner = isDiagWinner(diagLeft, char)

      diagWinner = diagRightWinner || diagLeftWinner
      diagRightWinner && winnerTypes.push('diag-right-win')
      diagLeftWinner && winnerTypes.push('diag-left-win')
    }

    let winner = (rowWinner || colWinner || diagWinner) ? char : false
    
    return {
      winner,
      winnerTypes
    }
  }

  function handleClick(row, col) {
    if (winner || board[row][col]) return

    board[row][col] = turn

    const winnerState = getWinnerState(row, col, turn)
    
    setTurn(turn === X ? O : X)
    setWinner(winnerState.winner)
    setWinnerTypes(winnerState.winnerTypes)
    setBoard(board)
  }

  return (
    <div className="ticTacToe">
      <h3>
        <IconLink 
          icon="github"
          url={GH_URL} />
          TicTacToe
      </h3>
      <GameControls>
        <Button onClick={resetBoard}>Reset</Button>
      </GameControls>

      <Scoreboard 
        player1={
          <ScoreCard
            active={turn === X}
            turnActions={
              <span>{X}</span>
            }
          />
        }
        player2={
          <ScoreCard
            active={turn === O}
            turnActions={
              <span>{O}</span>
            }
          />
        }
      >
        <b>Turn:</b>
      </Scoreboard>

      <table className="ticTacToeBoard">
        <tbody
          role='status'
          className={winnerTypes.join(' ')}
          aria-relevant='all'>
          {board.map((row, rowIndex) => 
            <tr key={rowIndex}>
              {row.map((letter, colIndex) => 
                <td
                  tabIndex='0' role='button'
                  aria-label='tic-tac-toe square'
                  aria-disabled={letter ? true : false}
                  key={`${rowIndex},${colIndex}`}
                  onClick={() => handleClick(rowIndex,colIndex)}
                  onKeyDown={(e) => {
                    if (e.keyCode === 13 || e.keyCode === 32) {
                      handleClick(rowIndex, colIndex)
                    }
                  }}>
                    {letter}
                </td>
              )}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default TicTacToe