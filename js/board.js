// Minecraft Chess - Board State Management
const ChessBoard = (() => {
  const { INITIAL_BOARD, FILES, RANKS } = ChessConstants

  const coordToAlgebraic = (row, col) => {
    if (row < 0 || row > 7 || col < 0 || col > 7) return ""
    return `${FILES[col]}${RANKS[row]}`
  }

  const algebraicToCoord = (squareStr) => {
    if (!squareStr || squareStr.length !== 2) return null
    const colChar = squareStr[0].toLowerCase()
    const rankChar = squareStr[1]
    const col = FILES.indexOf(colChar)
    const row = RANKS.indexOf(rankChar)
    if (col === -1 || row === -1) return null
    return { row, col }
  }

  const isInside = (row, col) => {
    return row >= 0 && row < 8 && col >= 0 && col < 8
  }

  const cloneGrid = (grid) => {
    return grid.map(row => row.map(cell => cell ? { ...cell } : null))
  }

  const createInitialState = () => {
    return {
      grid: cloneGrid(INITIAL_BOARD),
      turn: "w",
      castlingRights: {
        w: { kingSide: true, queenSide: true },
        b: { kingSide: true, queenSide: true }
      },
      enPassantTarget: null, // { row, col }
      halfmoveClock: 0,
      fullmoveNumber: 1,
      capturedPieces: {
        w: [], // pieces captured by white (black pieces)
        b: []  // pieces captured by black (white pieces)
      },
      moveHistory: []
    }
  }

  const cloneState = (state) => {
    return {
      grid: cloneGrid(state.grid),
      turn: state.turn,
      castlingRights: {
        w: { ...state.castlingRights.w },
        b: { ...state.castlingRights.b }
      },
      enPassantTarget: state.enPassantTarget ? { ...state.enPassantTarget } : null,
      halfmoveClock: state.halfmoveClock,
      fullmoveNumber: state.fullmoveNumber,
      capturedPieces: {
        w: [...state.capturedPieces.w],
        b: [...state.capturedPieces.b]
      },
      moveHistory: state.moveHistory.map(m => ({ ...m }))
    }
  }

  const getPiece = (state, row, col) => {
    if (!isInside(row, col)) return null
    return state.grid[row][col]
  }

  const setPiece = (state, row, col, piece) => {
    if (!isInside(row, col)) return
    state.grid[row][col] = piece ? { ...piece } : null
  }

  return {
    coordToAlgebraic,
    algebraicToCoord,
    isInside,
    cloneGrid,
    createInitialState,
    cloneState,
    getPiece,
    setPiece
  }
})()

if (typeof window !== "undefined") {
  window.ChessBoard = ChessBoard
}
