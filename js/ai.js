// Minecraft Chess - Bot AI Engine (Minimax with Alpha-Beta & Positional Tables)
const ChessAI = (() => {
  const { PIECE_VALUES } = ChessConstants
  const { cloneState, getPiece, setPiece } = ChessBoard
  const { getAllLegalMoves, isKingInCheck, isSquareAttacked } = ChessRules

  // Piece-Square Tables (from White's perspective)
  const PAWN_TABLE = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ]

  const KNIGHT_TABLE = [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ]

  const BISHOP_TABLE = [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
  ]

  const ROOK_TABLE = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
  ]

  const QUEEN_TABLE = [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
  ]

  const KING_MIDDLE_TABLE = [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [20, 30, 10,  0,  0, 10, 30, 20]
  ]

  const getPositionalScore = (type, color, row, col) => {
    // For black, flip row
    const r = color === "w" ? row : 7 - row
    const c = col
    let table = null
    if (type === "p") table = PAWN_TABLE
    else if (type === "n") table = KNIGHT_TABLE
    else if (type === "b") table = BISHOP_TABLE
    else if (type === "r") table = ROOK_TABLE
    else if (type === "q") table = QUEEN_TABLE
    else if (type === "k") table = KING_MIDDLE_TABLE
    return table ? table[r][c] : 0
  }

  // Board evaluation: positive is good for White, negative for Black
  const evaluateBoard = (state) => {
    let score = 0
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = state.grid[r][c]
        if (!piece) continue

        const baseVal = PIECE_VALUES[piece.type] || 0
        const posVal = getPositionalScore(piece.type, piece.color, r, c)
        const totalPieceVal = baseVal + posVal

        if (piece.color === "w") {
          score += totalPieceVal
        } else {
          score -= totalPieceVal
        }
      }
    }
    return score
  }

  // Quick move simulation for AI
  const simulateMove = (state, move) => {
    const next = cloneState(state)
    const { from, to, isEnPassant, isCastling, promotion, rookFrom, rookTo } = move
    const movingPiece = getPiece(next, from.row, from.col)
    if (!movingPiece) return next

    setPiece(next, from.row, from.col, null)

    if (isEnPassant && move.enPassantCaptureCoord) {
      setPiece(next, move.enPassantCaptureCoord.row, move.enPassantCaptureCoord.col, null)
    }

    if (isCastling && rookFrom && rookTo) {
      const rook = getPiece(next, rookFrom.row, rookFrom.col)
      setPiece(next, rookFrom.row, rookFrom.col, null)
      setPiece(next, rookTo.row, rookTo.col, rook)
    }

    if (promotion) {
      setPiece(next, to.row, to.col, { type: promotion, color: movingPiece.color })
    } else {
      setPiece(next, to.row, to.col, movingPiece)
    }

    // Toggle turn
    next.turn = next.turn === "w" ? "b" : "w"
    return next
  }

  // Move ordering: MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
  const scoreMoveForOrdering = (state, move) => {
    let score = 0
    const piece = getPiece(state, move.from.row, move.from.col)

    if (move.captured) {
      const victimValue = PIECE_VALUES[move.captured.type] || 0
      const attackerValue = piece ? PIECE_VALUES[piece.type] || 0 : 0
      score += 1000 + victimValue * 10 - attackerValue
    }

    if (move.promotion) {
      score += 900
    }

    if (move.isCastling) {
      score += 150
    }

    return score
  }

  const orderMoves = (state, moves) => {
    return moves
      .map(m => ({ move: m, score: scoreMoveForOrdering(state, m) }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.move)
  }

  // Minimax with Alpha-Beta Pruning
  const minimax = (state, depth, alpha, beta, isMaximizing) => {
    if (depth === 0) {
      return { score: evaluateBoard(state) }
    }

    const currentTurn = isMaximizing ? "w" : "b"
    const moves = getAllLegalMoves(state, currentTurn)

    if (moves.length === 0) {
      if (isKingInCheck(state, currentTurn)) {
        // Checkmate
        return { score: isMaximizing ? -50000 + (4 - depth) : 50000 - (4 - depth) }
      }
      // Stalemate
      return { score: 0 }
    }

    const orderedMoves = orderMoves(state, moves)

    if (isMaximizing) {
      let maxScore = -Infinity
      let bestMove = orderedMoves[0]

      for (const move of orderedMoves) {
        const nextState = simulateMove(state, move)
        const result = minimax(nextState, depth - 1, alpha, beta, false)

        if (result.score > maxScore) {
          maxScore = result.score
          bestMove = move
        }
        alpha = Math.max(alpha, maxScore)
        if (beta <= alpha) break
      }
      return { score: maxScore, move: bestMove }
    } else {
      let minScore = Infinity
      let bestMove = orderedMoves[0]

      for (const move of orderedMoves) {
        const nextState = simulateMove(state, move)
        const result = minimax(nextState, depth - 1, alpha, beta, true)

        if (result.score < minScore) {
          minScore = result.score
          bestMove = move
        }
        beta = Math.min(beta, minScore)
        if (beta <= alpha) break
      }
      return { score: minScore, move: bestMove }
    }
  }

  const getBestMoveAsync = (state, difficulty = "medium") => {
    return new Promise(resolve => {
      setTimeout(() => {
        const isMaximizing = state.turn === "w"
        const legalMoves = getAllLegalMoves(state, state.turn)

        if (legalMoves.length === 0) {
          resolve(null)
          return
        }

        // Easy: Zombie difficulty (mostly random with capture preference)
        if (difficulty === "easy") {
          const captures = legalMoves.filter(m => m.captured)
          if (captures.length > 0 && Math.random() < 0.6) {
            const chosen = captures[Math.floor(Math.random() * captures.length)]
            resolve(chosen)
            return
          }
          const chosen = legalMoves[Math.floor(Math.random() * legalMoves.length)]
          resolve(chosen)
          return
        }

        // Medium: Skeleton difficulty (depth 2)
        if (difficulty === "medium") {
          const result = minimax(state, 2, -Infinity, Infinity, isMaximizing)
          resolve(result.move || legalMoves[0])
          return
        }

        // Hard: Herobrine difficulty (depth 3 with alpha-beta and piece tables)
        const result = minimax(state, 3, -Infinity, Infinity, isMaximizing)
        resolve(result.move || legalMoves[0])
      }, 350)
    })
  }

  return {
    evaluateBoard,
    getBestMoveAsync
  }
})()

if (typeof window !== "undefined") {
  window.ChessAI = ChessAI
}
