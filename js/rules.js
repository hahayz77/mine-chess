// Minecraft Chess - Chess Rules and Move Validation
const ChessRules = (() => {
  const { coordToAlgebraic, isInside, cloneState, getPiece, setPiece } = ChessBoard

  const findKing = (state, color) => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = state.grid[r][c]
        if (piece && piece.type === "k" && piece.color === color) {
          return { row: r, col: c }
        }
      }
    }
    return null
  }

  const isSquareAttacked = (state, targetRow, targetCol, attackerColor) => {
    // 1. Attacked by pawns
    const pawnDir = attackerColor === "w" ? 1 : -1
    const pawnAttackerRow = targetRow + pawnDir
    if (isInside(pawnAttackerRow, targetCol - 1)) {
      const p = state.grid[pawnAttackerRow][targetCol - 1]
      if (p && p.color === attackerColor && p.type === "p") return true
    }
    if (isInside(pawnAttackerRow, targetCol + 1)) {
      const p = state.grid[pawnAttackerRow][targetCol + 1]
      if (p && p.color === attackerColor && p.type === "p") return true
    }

    // 2. Attacked by knights
    const knightOffsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ]
    for (const [dr, dc] of knightOffsets) {
      const nr = targetRow + dr
      const nc = targetCol + dc
      if (isInside(nr, nc)) {
        const p = state.grid[nr][nc]
        if (p && p.color === attackerColor && p.type === "n") return true
      }
    }

    // 3. Attacked by king
    const kingOffsets = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ]
    for (const [dr, dc] of kingOffsets) {
      const nr = targetRow + dr
      const nc = targetCol + dc
      if (isInside(nr, nc)) {
        const p = state.grid[nr][nc]
        if (p && p.color === attackerColor && p.type === "k") return true
      }
    }

    // 4. Straight lines (Rook / Queen)
    const straightDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
    for (const [dr, dc] of straightDirs) {
      let step = 1
      while (true) {
        const nr = targetRow + dr * step
        const nc = targetCol + dc * step
        if (!isInside(nr, nc)) break
        const p = state.grid[nr][nc]
        if (p) {
          if (p.color === attackerColor && (p.type === "r" || p.type === "q")) {
            return true
          }
          break
        }
        step++
      }
    }

    // 5. Diagonal lines (Bishop / Queen)
    const diagonalDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
    for (const [dr, dc] of diagonalDirs) {
      let step = 1
      while (true) {
        const nr = targetRow + dr * step
        const nc = targetCol + dc * step
        if (!isInside(nr, nc)) break
        const p = state.grid[nr][nc]
        if (p) {
          if (p.color === attackerColor && (p.type === "b" || p.type === "q")) {
            return true
          }
          break
        }
        step++
      }
    }

    return false
  }

  const isKingInCheck = (state, color) => {
    const kingPos = findKing(state, color)
    if (!kingPos) return false
    const opponentColor = color === "w" ? "b" : "w"
    return isSquareAttacked(state, kingPos.row, kingPos.col, opponentColor)
  }

  const getPseudoLegalMoves = (state, row, col) => {
    const piece = getPiece(state, row, col)
    if (!piece) return []

    const moves = []
    const { type, color } = piece
    const opponentColor = color === "w" ? "b" : "w"

    if (type === "p") {
      const forwardDir = color === "w" ? -1 : 1
      const startRow = color === "w" ? 6 : 1
      const promotionRow = color === "w" ? 0 : 7

      // One step forward
      const oneStepRow = row + forwardDir
      if (isInside(oneStepRow, col) && !getPiece(state, oneStepRow, col)) {
        if (oneStepRow === promotionRow) {
          for (const promo of ["q", "r", "b", "n"]) {
            moves.push({ from: { row, col }, to: { row: oneStepRow, col }, promotion: promo })
          }
        } else {
          moves.push({ from: { row, col }, to: { row: oneStepRow, col } })
        }

        // Two steps forward from starting rank
        const twoStepRow = row + forwardDir * 2
        if (row === startRow && !getPiece(state, twoStepRow, col)) {
          moves.push({ from: { row, col }, to: { row: twoStepRow, col }, isDoublePawn: true })
        }
      }

      // Diagonal captures
      for (const dc of [-1, 1]) {
        const targetCol = col + dc
        const targetRow = row + forwardDir
        if (isInside(targetRow, targetCol)) {
          const targetPiece = getPiece(state, targetRow, targetCol)
          if (targetPiece && targetPiece.color === opponentColor) {
            if (targetRow === promotionRow) {
              for (const promo of ["q", "r", "b", "n"]) {
                moves.push({
                  from: { row, col },
                  to: { row: targetRow, col: targetCol },
                  captured: targetPiece,
                  promotion: promo
                })
              }
            } else {
              moves.push({
                from: { row, col },
                to: { row: targetRow, col: targetCol },
                captured: targetPiece
              })
            }
          } else if (
            state.enPassantTarget &&
            state.enPassantTarget.row === targetRow &&
            state.enPassantTarget.col === targetCol
          ) {
            // En passant capture
            const epCapturedRow = row
            const epCapturedCol = targetCol
            const epPiece = getPiece(state, epCapturedRow, epCapturedCol)
            if (epPiece && epPiece.color === opponentColor && epPiece.type === "p") {
              moves.push({
                from: { row, col },
                to: { row: targetRow, col: targetCol },
                isEnPassant: true,
                captured: epPiece,
                enPassantCaptureCoord: { row: epCapturedRow, col: epCapturedCol }
              })
            }
          }
        }
      }
    } else if (type === "n") {
      const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ]
      for (const [dr, dc] of knightOffsets) {
        const nr = row + dr
        const nc = col + dc
        if (isInside(nr, nc)) {
          const targetPiece = getPiece(state, nr, nc)
          if (!targetPiece) {
            moves.push({ from: { row, col }, to: { row: nr, col: nc } })
          } else if (targetPiece.color === opponentColor) {
            moves.push({ from: { row, col }, to: { row: nr, col: nc }, captured: targetPiece })
          }
        }
      }
    } else if (type === "b" || type === "r" || type === "q") {
      const directions = []
      if (type === "b" || type === "q") {
        directions.push([-1, -1], [-1, 1], [1, -1], [1, 1])
      }
      if (type === "r" || type === "q") {
        directions.push([-1, 0], [1, 0], [0, -1], [0, 1])
      }

      for (const [dr, dc] of directions) {
        let step = 1
        while (true) {
          const nr = row + dr * step
          const nc = col + dc * step
          if (!isInside(nr, nc)) break
          const targetPiece = getPiece(state, nr, nc)
          if (!targetPiece) {
            moves.push({ from: { row, col }, to: { row: nr, col: nc } })
          } else {
            if (targetPiece.color === opponentColor) {
              moves.push({ from: { row, col }, to: { row: nr, col: nc }, captured: targetPiece })
            }
            break
          }
          step++
        }
      }
    } else if (type === "k") {
      const kingOffsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
      ]
      for (const [dr, dc] of kingOffsets) {
        const nr = row + dr
        const nc = col + dc
        if (isInside(nr, nc)) {
          const targetPiece = getPiece(state, nr, nc)
          if (!targetPiece) {
            moves.push({ from: { row, col }, to: { row: nr, col: nc } })
          } else if (targetPiece.color === opponentColor) {
            moves.push({ from: { row, col }, to: { row: nr, col: nc }, captured: targetPiece })
          }
        }
      }

      // Castling
      const castling = state.castlingRights[color]
      const homeRow = color === "w" ? 7 : 0

      if (row === homeRow && col === 4 && !isSquareAttacked(state, homeRow, 4, opponentColor)) {
        // Kingside castling
        if (castling.kingSide) {
          const rookPiece = getPiece(state, homeRow, 7)
          if (
            rookPiece &&
            rookPiece.type === "r" &&
            rookPiece.color === color &&
            !getPiece(state, homeRow, 5) &&
            !getPiece(state, homeRow, 6) &&
            !isSquareAttacked(state, homeRow, 5, opponentColor) &&
            !isSquareAttacked(state, homeRow, 6, opponentColor)
          ) {
            moves.push({
              from: { row, col },
              to: { row: homeRow, col: 6 },
              isCastling: true,
              castlingSide: "kingSide",
              rookFrom: { row: homeRow, col: 7 },
              rookTo: { row: homeRow, col: 5 }
            })
          }
        }

        // Queenside castling
        if (castling.queenSide) {
          const rookPiece = getPiece(state, homeRow, 0)
          if (
            rookPiece &&
            rookPiece.type === "r" &&
            rookPiece.color === color &&
            !getPiece(state, homeRow, 1) &&
            !getPiece(state, homeRow, 2) &&
            !getPiece(state, homeRow, 3) &&
            !isSquareAttacked(state, homeRow, 3, opponentColor) &&
            !isSquareAttacked(state, homeRow, 2, opponentColor)
          ) {
            moves.push({
              from: { row, col },
              to: { row: homeRow, col: 2 },
              isCastling: true,
              castlingSide: "queenSide",
              rookFrom: { row: homeRow, col: 0 },
              rookTo: { row: homeRow, col: 3 }
            })
          }
        }
      }
    }

    return moves
  }

  const applyMoveRaw = (state, move) => {
    const { from, to, isEnPassant, isCastling, promotion, rookFrom, rookTo } = move
    const movingPiece = getPiece(state, from.row, from.col)
    if (!movingPiece) return

    // Clear origin
    setPiece(state, from.row, from.col, null)

    // Handle captures
    if (isEnPassant) {
      setPiece(state, move.enPassantCaptureCoord.row, move.enPassantCaptureCoord.col, null)
    }

    // Handle castling rook movement
    if (isCastling && rookFrom && rookTo) {
      const rook = getPiece(state, rookFrom.row, rookFrom.col)
      setPiece(state, rookFrom.row, rookFrom.col, null)
      setPiece(state, rookTo.row, rookTo.col, rook)
    }

    // Place piece at destination (with promotion if needed)
    if (promotion) {
      setPiece(state, to.row, to.col, { type: promotion, color: movingPiece.color })
    } else {
      setPiece(state, to.row, to.col, movingPiece)
    }
  }

  const getLegalMoves = (state, row, col) => {
    const piece = getPiece(state, row, col)
    if (!piece || piece.color !== state.turn) return []

    const pseudoMoves = getPseudoLegalMoves(state, row, col)
    return pseudoMoves.filter(move => {
      const testState = cloneState(state)
      applyMoveRaw(testState, move)
      return !isKingInCheck(testState, piece.color)
    })
  }

  const getAllLegalMoves = (state, color = state.turn) => {
    const allMoves = []
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = state.grid[r][c]
        if (piece && piece.color === color) {
          const pseudoMoves = getPseudoLegalMoves(state, r, c)
          for (const move of pseudoMoves) {
            const testState = cloneState(state)
            applyMoveRaw(testState, move)
            if (!isKingInCheck(testState, color)) {
              allMoves.push(move)
            }
          }
        }
      }
    }
    return allMoves
  }

  const generateSan = (stateBefore, move) => {
    if (move.isCastling) {
      return move.castlingSide === "kingSide" ? "O-O" : "O-O-O"
    }

    const piece = getPiece(stateBefore, move.from.row, move.from.col)
    if (!piece) return ""

    let san = ""
    const destSquare = coordToAlgebraic(move.to.row, move.to.col)
    const isCapture = Boolean(move.captured || move.isEnPassant)

    if (piece.type === "p") {
      if (isCapture) {
        const fromAlg = coordToAlgebraic(move.from.row, move.from.col)
        san = `${fromAlg[0]}x${destSquare}`
      } else {
        san = destSquare
      }
      if (move.promotion) {
        san += `=${move.promotion.toUpperCase()}`
      }
    } else {
      const pieceChar = piece.type.toUpperCase()
      // Disambiguation
      const candidateMoves = getAllLegalMoves(stateBefore, piece.color).filter(m => {
        if (m.to.row !== move.to.row || m.to.col !== move.to.col) return false
        const p = getPiece(stateBefore, m.from.row, m.from.col)
        return p && p.type === piece.type && (m.from.row !== move.from.row || m.from.col !== move.from.col)
      })

      let disambiguate = ""
      if (candidateMoves.length > 0) {
        const sameFile = candidateMoves.some(m => m.from.col === move.from.col)
        const sameRank = candidateMoves.some(m => m.from.row === move.from.row)
        const fromAlg = coordToAlgebraic(move.from.row, move.from.col)

        if (!sameFile) {
          disambiguate = fromAlg[0]
        } else if (!sameRank) {
          disambiguate = fromAlg[1]
        } else {
          disambiguate = fromAlg
        }
      }

      san = `${pieceChar}${disambiguate}${isCapture ? "x" : ""}${destSquare}`
    }

    // Check test after move
    const testState = cloneState(stateBefore)
    applyMoveRaw(testState, move)
    const opponent = piece.color === "w" ? "b" : "w"
    testState.turn = opponent
    const inCheck = isKingInCheck(testState, opponent)

    if (inCheck) {
      const opponentMoves = getAllLegalMoves(testState, opponent)
      if (opponentMoves.length === 0) {
        san += "#"
      } else {
        san += "+"
      }
    }

    return san
  }

  const makeMove = (state, move, promotionChoice = "q") => {
    const fromPiece = getPiece(state, move.from.row, move.from.col)
    if (!fromPiece) return null

    // Effective promotion
    let finalMove = { ...move }
    if (fromPiece.type === "p" && (move.to.row === 0 || move.to.row === 7)) {
      finalMove.promotion = move.promotion || promotionChoice
    }

    const san = generateSan(state, finalMove)
    finalMove.san = san
    finalMove.piece = { ...fromPiece }

    // Record captured piece
    let capturedPiece = null
    if (finalMove.isEnPassant) {
      capturedPiece = getPiece(state, finalMove.enPassantCaptureCoord.row, finalMove.enPassantCaptureCoord.col)
      state.capturedPieces[fromPiece.color].push({ ...capturedPiece })
    } else if (finalMove.captured) {
      capturedPiece = { ...finalMove.captured }
      state.capturedPieces[fromPiece.color].push(capturedPiece)
    }

    // Apply move physically
    applyMoveRaw(state, finalMove)

    // Update castling rights
    if (fromPiece.type === "k") {
      state.castlingRights[fromPiece.color].kingSide = false
      state.castlingRights[fromPiece.color].queenSide = false
    } else if (fromPiece.type === "r") {
      const homeRow = fromPiece.color === "w" ? 7 : 0
      if (move.from.row === homeRow && move.from.col === 0) {
        state.castlingRights[fromPiece.color].queenSide = false
      } else if (move.from.row === homeRow && move.from.col === 7) {
        state.castlingRights[fromPiece.color].kingSide = false
      }
    }

    // If opponent rook is captured in corner
    if (capturedPiece && capturedPiece.type === "r") {
      const enemyColor = fromPiece.color === "w" ? "b" : "w"
      const enemyHomeRow = enemyColor === "w" ? 7 : 0
      if (move.to.row === enemyHomeRow && move.to.col === 0) {
        state.castlingRights[enemyColor].queenSide = false
      } else if (move.to.row === enemyHomeRow && move.to.col === 7) {
        state.castlingRights[enemyColor].kingSide = false
      }
    }

    // Update en passant target
    if (fromPiece.type === "p" && Math.abs(move.to.row - move.from.row) === 2) {
      state.enPassantTarget = {
        row: (move.from.row + move.to.row) / 2,
        col: move.from.col
      }
    } else {
      state.enPassantTarget = null
    }

    // Halfmove clock (50-move rule)
    if (fromPiece.type === "p" || capturedPiece) {
      state.halfmoveClock = 0
    } else {
      state.halfmoveClock++
    }

    // Fullmove number
    if (state.turn === "b") {
      state.fullmoveNumber++
    }

    // Toggle turn
    state.turn = state.turn === "w" ? "b" : "w"

    // Save to history
    state.moveHistory.push({
      ...finalMove,
      capturedPiece
    })

    return finalMove
  }

  const isInsufficientMaterial = (state) => {
    const pieces = []
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = state.grid[r][c]
        if (p) {
          pieces.push({ ...p, row: r, col: c })
        }
      }
    }

    // King vs King
    if (pieces.length === 2) return true

    // King + Bishop/Knight vs King
    if (pieces.length === 3) {
      const nonKings = pieces.filter(p => p.type !== "k")
      if (nonKings.length === 1 && (nonKings[0].type === "b" || nonKings[0].type === "n")) {
        return true
      }
    }

    // King + Bishop vs King + Bishop with bishops on same square color
    if (pieces.length === 4) {
      const bishops = pieces.filter(p => p.type === "b")
      if (bishops.length === 2 && bishops[0].color !== bishops[1].color) {
        const color1 = (bishops[0].row + bishops[0].col) % 2
        const color2 = (bishops[1].row + bishops[1].col) % 2
        if (color1 === color2) return true
      }
    }

    return false
  }

  const getGameStatus = (state) => {
    const currentTurn = state.turn
    const legalMoves = getAllLegalMoves(state, currentTurn)
    const inCheck = isKingInCheck(state, currentTurn)

    if (legalMoves.length === 0) {
      if (inCheck) {
        const winner = currentTurn === "w" ? "b" : "w"
        return {
          isOver: true,
          result: "checkmate",
          winner,
          message: winner === "w" ? "Checkmate! King Steve & Alex win!" : "Checkmate! Herobrine & Ender Queen win!"
        }
      } else {
        return {
          isOver: true,
          result: "stalemate",
          winner: null,
          message: "Stalemate! Game is a draw."
        }
      }
    }

    if (isInsufficientMaterial(state)) {
      return {
        isOver: true,
        result: "insufficient_material",
        winner: null,
        message: "Draw due to insufficient material."
      }
    }

    if (state.halfmoveClock >= 100) {
      return {
        isOver: true,
        result: "fifty_move_rule",
        winner: null,
        message: "Draw by 50-move rule."
      }
    }

    return {
      isOver: false,
      inCheck,
      result: null,
      winner: null,
      message: inCheck ? `${currentTurn === "w" ? "White" : "Black"} King is in Check!` : null
    }
  }

  return {
    findKing,
    isSquareAttacked,
    isKingInCheck,
    getPseudoLegalMoves,
    getLegalMoves,
    getAllLegalMoves,
    generateSan,
    makeMove,
    isInsufficientMaterial,
    getGameStatus
  }
})()

if (typeof window !== "undefined") {
  window.ChessRules = ChessRules
}
