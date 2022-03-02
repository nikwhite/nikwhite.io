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
 *  clicks clickables in order of indices = [
 *    0, 1, 2,
 *    3, 4, 5,
 *    6, 7, 8
 * ]
 * @param {HTMLElement[]} clickables 
 * @param {number[]} indices 
 */
function clickStream(clickables, indices) {
  for (let i of indices) {
    fireEvent.click(clickables[i])
  }
}

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
  clickStream(buttons, [0,3,1,4,2,5])

  let status = getByRole(board, 'status')
  expect(status).toHaveClass('row-0-win')
  expect(buttons[5]).toBeEmptyDOMElement()
})

test('can win vertically', () => {
  clickStream(buttons, [0,1,3,2,6,7])

  let status = getByRole(board, 'status')
  expect(status).toHaveClass('col-0-win')
  expect(buttons[7]).toBeEmptyDOMElement()
})

test('can win vertically and horizontally', () => {
  clickStream(buttons, [2,4,6,5,3,7,1,8,0])

  let status = getByRole(board, 'status')
  expect(status).toHaveClass('col-0-win', 'row-0-win')
})

test('can win diagonally left', () => {
  clickStream(buttons, [0,1,4,2,8,7])

  let status = getByRole(board, 'status')
  expect(status).toHaveClass('diag-left-win')
  expect(buttons[7]).toBeEmptyDOMElement()
})

test('can win diagonally right', () => {
  clickStream(buttons, [2,1,4,3,6,7])

  let status = getByRole(board, 'status')
  expect(status).toHaveClass('diag-right-win')
  expect(buttons[7]).toBeEmptyDOMElement()
})

test('can win diagonally right and left', () => {
  clickStream(buttons, [0,1,2,5,8,7,6,3,4])

  let status = getByRole(board, 'status')
  expect(status).toHaveClass('diag-right-win', 'diag-left-win')
})



