import { render, getAllByRole, getByRole, getByText, fireEvent } from '@testing-library/react';
import TicTacToe from './tictactoe';

let container, board, rows, buttons

beforeEach(() => {
  container = render(<TicTacToe />).container
  board = container.querySelector('.ticTacToeBoard')
  rows = getAllByRole(board, 'row')
  buttons = getAllByRole(board, 'button')
})

/**
 * buttons = [
 *    0, 1, 2,
 *    3, 4, 5,
 *    6, 7, 8
 * ]
 */

test('renders a tic-tac-toe board', () => {
  expect(rows).toHaveLength(3)
  expect(buttons).toHaveLength(9)
})

test('places Xs and Os taking turns (accessibly)', () => {
  fireEvent.click(buttons[0])
  fireEvent.keyDown(buttons[1], {key: 'Enter', code: 'Enter', keyCode: 13})
  fireEvent.keyDown(buttons[2], {key: ' ', code: 'Space', keyCode: 32})

  expect(buttons[0]).toHaveTextContent('X')
  expect(buttons[1]).toHaveTextContent('O')
  expect(buttons[2]).toHaveTextContent('X')
})

test('can be reset', () => {
  fireEvent.click(buttons[0])
  let reset = getByText(container, 'Reset')
  fireEvent.click(reset)
  expect(buttons[0]).toBeEmptyDOMElement()
})

test('can win horizontally', () => {
  fireEvent.click(buttons[0]) // x
  fireEvent.click(buttons[3]) // o
  fireEvent.click(buttons[1]) // x
  fireEvent.click(buttons[4]) // o
  fireEvent.click(buttons[2]) // x = winner
  fireEvent.click(buttons[5]) // o trys to continue play

  let status = getByRole(board, 'status')
  expect(status).toHaveClass('row-0-win')
  expect(buttons[5]).toBeEmptyDOMElement()
})

test('can win vertically', () => {
  fireEvent.click(buttons[0]) // x
  fireEvent.click(buttons[1]) // o
  fireEvent.click(buttons[3]) // x
  fireEvent.click(buttons[2]) // o
  fireEvent.click(buttons[6]) // x = winner
  fireEvent.click(buttons[7]) // o trys to continue play

  let status = getByRole(board, 'status')
  expect(status).toHaveClass('col-0-win')
  expect(buttons[7]).toBeEmptyDOMElement()
})

test('can win diagonally', () => {
  fireEvent.click(buttons[0]) // x
  fireEvent.click(buttons[1]) // o
  fireEvent.click(buttons[4]) // x
  fireEvent.click(buttons[2]) // o
  fireEvent.click(buttons[8]) // x = winner
  fireEvent.click(buttons[7]) // o trys to continue play

  let status = getByRole(board, 'status')
  expect(status).toHaveClass('diag-left-win')
  expect(buttons[7]).toBeEmptyDOMElement()
})

test('can win vertically and horizontally', () => {
  fireEvent.click(buttons[2]) // x
  fireEvent.click(buttons[4]) // o
  fireEvent.click(buttons[6]) // x
  fireEvent.click(buttons[5]) // o
  fireEvent.click(buttons[3]) // x 
  fireEvent.click(buttons[7]) // o 
  fireEvent.click(buttons[1]) // x
  fireEvent.click(buttons[8]) // o 
  fireEvent.click(buttons[0]) // x

  let status = getByRole(board, 'status')
  expect(status).toHaveClass('col-0-win', 'row-0-win')
})
