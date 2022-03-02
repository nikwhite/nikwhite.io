import './tictactoe.css'
import React from 'react'
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

class TicTacToe extends React.Component {
  constructor() {
    super()
    this.state = {
      board: this.getCleanBoard(),
      turn: X,
      winner: false,
      winnerTypes: []
    }
    this.handleClick = this.handleClick.bind(this)
    this.resetBoard = this.resetBoard.bind(this)
  }

  getCleanBoard() {
    return [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ]
  }

  resetBoard() {
    this.setState({
      turn: this.state.winner === X ? O : X,
      board: this.getCleanBoard(),
      winner: false,
      winnerTypes: [],
    })
  }

  charAt(row,col) {
    return this.state.board[row][col]
  }

  allMatch(values, char) {
    for (let i=0; i < values.length; i++) {
      if (values[i] !== char) return false
    }
    return true
  }

  isColWinner(col, char) {
    let colValues = this.state.board.map(row => row[col])
    return this.allMatch(colValues, char)
  }

  isRowWinner(row, char) {
    return this.allMatch(this.state.board[row], char)
  }

  isDiagRightWinner(char) {
    let diagRightValues = diagRight.map(([row, col]) => this.charAt(row,col))
    return this.allMatch(diagRightValues, char)
  }

  isDiagLeftWinner(char) {
    let diagLeftValues = diagLeft.map(([row, col]) => this.charAt(row,col))
    return this.allMatch(diagLeftValues, char)
  }

  isDiagSlot(row, col) {
    let max = this.state.board.length - 1
    let min = 0

    return ((row === min || row === max) && (col === min || col === max)) || (row === 1 && col === 1)
  }

  getWinnerState(fromRow, fromCol, char) {
    let rowWinner = this.isRowWinner(fromRow, char)
    let colWinner = this.isColWinner(fromCol, char)
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
    if (this.isDiagSlot(fromRow, fromCol)) {
      let diagRightWinner = this.isDiagRightWinner(char)
      let diagLeftWinner = this.isDiagLeftWinner(char)

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

  handleClick(row, col) {
    let board = this.state.board
    let nextTurn = this.state.turn === X ? O : X
    
    if (this.state.winner || board[row][col]) return;

    board[row][col] = this.state.turn

    let winnerState = this.getWinnerState(row, col, this.state.turn)
    
    this.setState({
      turn: nextTurn,
      board: board,
      ...winnerState
    })
  }

  render() {
    const state = this.state
    return (
      <div className="ticTacToe">
        <h3>
          <IconLink 
            icon="github"
            url={GH_URL} />
            TicTacToe
        </h3>
        <GameControls>
          <Button onClick={() => this.resetBoard()}>Reset</Button>
        </GameControls>

        <Scoreboard 
          player1={
            <ScoreCard
              active={state.turn === X}
              turnActions={
                <span>{X}</span>
              }
            />
          }
          player2={
            <ScoreCard
              active={state.turn === O}
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
            className={state.winnerTypes.join(' ')}
            aria-relevant='all'>
            {state.board.map((row, rowIndex) => 
              <tr key={rowIndex}>
                {row.map((letter, colIndex) => 
                  <td
                    tabIndex='0' role='button'
                    aria-label='tic-tac-toe square'
                    aria-disabled={letter ? true : false}
                    key={`${rowIndex},${colIndex}`}
                    onClick={() => this.handleClick(rowIndex,colIndex)}
                    onKeyDown={(e) => {
                      if (e.keyCode === 13 || e.keyCode === 32) {
                        this.handleClick(rowIndex, colIndex)
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
}

export default TicTacToe