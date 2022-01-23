import './tictactoe.css'
import React from 'react'

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
      winner: false 
    }
    this.activate = this.activate.bind(this)
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
      board: this.getCleanBoard(),
      winner: false,
      turn: this.state.winner === X ? O : X
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
    let board = this.state.board
    let values = board.map(row => row[col])

    return this.allMatch(values, char)
  }

  isRowWinner(row, char) {
    return this.allMatch(this.state.board[row], char)
  }

  isDiagWinner(char) { 
    let diagLeftValues = diagLeft.map(([row, col]) => this.charAt(row,col))
    let diagLeftWin = this.allMatch(diagLeftValues, char)

    let diagRightValues = diagRight.map(([row, col]) => this.charAt(row,col))
    let diagRightWin = this.allMatch(diagRightValues, char)

    return diagLeftWin || diagRightWin
  }

  isWinner(fromRow, fromCol, char) {
    let rowWinner = this.isRowWinner(fromRow, char)
    let colWinner = this.isColWinner(fromCol, char)
    let diagWinner = false
    let max = this.state.board.length - 1
    let min = 0

    // if we're checking from a corner or the center, need to check diagonal win condition
    if (
        ((fromRow === min || fromRow === max) && (fromCol === min || fromCol === max))
        || (fromRow === 1 && fromCol === 1) 
    ) {
      diagWinner = this.isDiagWinner(char)
    }
    
    return  (rowWinner || colWinner || diagWinner) ? char : false
  }

  activate(row, col) {
    let board = this.state.board
    let nextTurn = this.state.turn === X ? O : X
    
    if (this.state.winner || board[row][col]) return;

    board[row][col] = this.state.turn
    
    this.setState({
      turn: nextTurn,
      board: board,
      winner: this.isWinner(row, col, this.state.turn)
    })
  }

  render() {
    return (
      <div className="ticTacToe">
        <h3>TicTacToe</h3>
        <p className="ticTacToeControls">
          <button onClick={this.resetBoard}>Reset</button>
          {this.state.winner &&
            <span>Winner: {this.state.winner}</span> 
          }  
        </p>
        
        <table className="ticTacToeBoard">
          <tbody>
          {this.state.board.map((row, rowIndex) => 
            <tr key={rowIndex}>
              {row.map((col, colIndex) => 
                <td 
                  key={[rowIndex,colIndex].join()}
                  onClick={e => this.activate(rowIndex,colIndex)}>
                    {col}
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