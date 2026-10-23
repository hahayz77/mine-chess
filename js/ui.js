// Minecraft Chess - UI Controller and DOM Interactions
const ChessUI = (() => {
  const { PIECE_IMAGES, PIECE_NAMES, FILES, RANKS } = ChessConstants
  const { coordToAlgebraic, algebraicToCoord } = ChessBoard

  let boardElement = null
  let selectedCoord = null
  let validMoves = []
  let isFlipped = false
  let pendingPromotionResolver = null

  // Drag state
  let dragData = null

  const init = (boardContainerId) => {
    boardElement = document.getElementById(boardContainerId)
  }

  const setFlipped = (flipped) => {
    isFlipped = flipped
  }

  const getFlipped = () => isFlipped

  const toggleFlip = () => {
    isFlipped = !isFlipped
    return isFlipped
  }

  const renderBoard = (state, onSquareClick, onMoveAttempt) => {
    if (!boardElement) return

    boardElement.innerHTML = ""

    const rowIndices = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7]
    const colIndices = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7]

    // Determine king in check
    const kingInCheckCoord = (() => {
      if (state.lastStatus && state.lastStatus.inCheck) {
        return ChessRules.findKing(state, state.turn)
      }
      return null
    })()

    // Determine last move squares
    const lastMove = state.moveHistory.length > 0 ? state.moveHistory[state.moveHistory.length - 1] : null

    rowIndices.forEach(r => {
      colIndices.forEach(c => {
        const square = document.createElement("div")
        const isLight = (r + c) % 2 === 0
        const squareName = coordToAlgebraic(r, c)

        square.className = `chess-square ${isLight ? "light-square" : "dark-square"}`
        square.dataset.row = r
        square.dataset.col = c
        square.dataset.coord = squareName

        // Last move highlight
        if (lastMove) {
          if ((lastMove.from.row === r && lastMove.from.col === c) ||
              (lastMove.to.row === r && lastMove.to.col === c)) {
            square.classList.add("last-move-square")
          }
        }

        // Selected square highlight
        if (selectedCoord && selectedCoord.row === r && selectedCoord.col === c) {
          square.classList.add("selected-square")
        }

        // King check pulse
        if (kingInCheckCoord && kingInCheckCoord.row === r && kingInCheckCoord.col === c) {
          square.classList.add("king-in-check")
        }

        // Move target hints
        const moveForThisSquare = validMoves.find(m => m.to.row === r && m.to.col === c)
        if (moveForThisSquare) {
          const isCapture = Boolean(moveForThisSquare.captured || moveForThisSquare.isEnPassant)
          const hintMarker = document.createElement("div")
          hintMarker.className = isCapture ? "capture-hint" : "move-hint"
          square.appendChild(hintMarker)
        }

        // Coordinate labels on board borders
        const isBottomEdge = isFlipped ? r === 0 : r === 7
        const isLeftEdge = isFlipped ? c === 7 : c === 0

        if (isBottomEdge) {
          const fileLabel = document.createElement("span")
          fileLabel.className = "coord-label file-label"
          fileLabel.textContent = FILES[c]
          square.appendChild(fileLabel)
        }

        if (isLeftEdge) {
          const rankLabel = document.createElement("span")
          rankLabel.className = "coord-label rank-label"
          rankLabel.textContent = RANKS[r]
          square.appendChild(rankLabel)
        }

        // Render piece
        const piece = state.grid[r][c]
        if (piece) {
          const pieceKey = `${piece.color}_${piece.type}`
          const pieceImg = document.createElement("img")
          pieceImg.className = "chess-piece"
          pieceImg.src = PIECE_IMAGES[pieceKey]
          pieceImg.alt = PIECE_NAMES[piece.color][piece.type]
          pieceImg.draggable = piece.color === state.turn

          // Isometric stacking depth: rows in front render above rows behind
          pieceImg.style.zIndex = (r + 1) * 10

          // Drag and drop event listeners
          pieceImg.addEventListener("dragstart", (e) => {
            if (piece.color !== state.turn) {
              e.preventDefault()
              return
            }
            dragData = { row: r, col: c, piece }
            e.dataTransfer.setData("text/plain", `${r},${c}`)
            pieceImg.classList.add("dragging")
            onSquareClick(r, c)
          })

          pieceImg.addEventListener("dragend", () => {
            pieceImg.classList.remove("dragging")
            dragData = null
          })

          square.appendChild(pieceImg)
        }

        // Dragover and drop on squares
        square.addEventListener("dragover", (e) => {
          e.preventDefault()
        })

        square.addEventListener("drop", (e) => {
          e.preventDefault()
          if (!dragData) return
          const fromRow = dragData.row
          const fromCol = dragData.col
          onMoveAttempt(fromRow, fromCol, r, c)
        })

        // Click on square
        square.addEventListener("click", () => {
          onSquareClick(r, c)
        })

        boardElement.appendChild(square)
      })
    })
  }

  const setSelectedSquare = (coord, moves = []) => {
    selectedCoord = coord
    validMoves = moves
  }

  const clearSelection = () => {
    selectedCoord = null
    validMoves = []
  }

  const showPromotionModal = (color) => {
    return new Promise(resolve => {
      pendingPromotionResolver = resolve
      const modal = document.getElementById("promotion-modal")
      const optionsContainer = document.getElementById("promotion-options")
      optionsContainer.innerHTML = ""

      const promoTypes = ["q", "r", "b", "n"]
      promoTypes.forEach(type => {
        const option = document.createElement("div")
        option.className = "promo-choice"
        const pieceKey = `${color}_${type}`

        const img = document.createElement("img")
        img.src = PIECE_IMAGES[pieceKey]
        img.alt = PIECE_NAMES[color][type]

        const label = document.createElement("span")
        label.className = "promo-label"
        label.textContent = PIECE_NAMES[color][type]

        option.appendChild(img)
        option.appendChild(label)

        option.addEventListener("click", () => {
          modal.classList.add("hidden")
          if (pendingPromotionResolver) {
            const cb = pendingPromotionResolver
            pendingPromotionResolver = null
            cb(type)
          }
        })

        optionsContainer.appendChild(option)
      })

      modal.classList.remove("hidden")
    })
  }

  const updateCapturedPieces = (state) => {
    const whiteContainer = document.getElementById("captured-by-white")
    const blackContainer = document.getElementById("captured-by-black")
    if (!whiteContainer || !blackContainer) return

    whiteContainer.innerHTML = ""
    blackContainer.innerHTML = ""

    const sortOrder = { q: 5, r: 4, b: 3, n: 2, p: 1 }

    const sortPieces = (list) => {
      return [...list].sort((a, b) => (sortOrder[b.type] || 0) - (sortOrder[a.type] || 0))
    }

    // Pieces captured by White (black pieces)
    sortPieces(state.capturedPieces.w).forEach(p => {
      const img = document.createElement("img")
      img.className = "captured-icon"
      img.src = PIECE_IMAGES[`b_${p.type}`]
      img.title = PIECE_NAMES.b[p.type]
      whiteContainer.appendChild(img)
    })

    // Pieces captured by Black (white pieces)
    sortPieces(state.capturedPieces.b).forEach(p => {
      const img = document.createElement("img")
      img.className = "captured-icon"
      img.src = PIECE_IMAGES[`w_${p.type}`]
      img.title = PIECE_NAMES.w[p.type]
      blackContainer.appendChild(img)
    })

    // Calculate material difference
    let whiteScore = 0
    let blackScore = 0
    const pieceValues = ChessConstants.PIECE_VALUES

    state.capturedPieces.w.forEach(p => { whiteScore += (pieceValues[p.type] || 0) })
    state.capturedPieces.b.forEach(p => { blackScore += (pieceValues[p.type] || 0) })

    const diff = (whiteScore - blackScore) / 100
    const scoreDiffWhite = document.getElementById("score-diff-white")
    const scoreDiffBlack = document.getElementById("score-diff-black")

    if (scoreDiffWhite && scoreDiffBlack) {
      if (diff > 0) {
        scoreDiffWhite.textContent = `+${diff}`
        scoreDiffBlack.textContent = ""
      } else if (diff < 0) {
        scoreDiffBlack.textContent = `+${Math.abs(diff)}`
        scoreDiffWhite.textContent = ""
      } else {
        scoreDiffWhite.textContent = ""
        scoreDiffBlack.textContent = ""
      }
    }
  }

  const updateMoveHistory = (history) => {
    const historyList = document.getElementById("history-list")
    if (!historyList) return

    historyList.innerHTML = ""
    const pairs = []

    for (let i = 0; i < history.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1
      const whiteMove = history[i] ? history[i].san : ""
      const blackMove = history[i + 1] ? history[i + 1].san : ""
      pairs.push({ moveNum, whiteMove, blackMove })
    }

    pairs.forEach(pair => {
      const row = document.createElement("div")
      row.className = "history-row"

      const numCol = document.createElement("span")
      numCol.className = "history-num"
      numCol.textContent = `${pair.moveNum}.`

      const whiteCol = document.createElement("span")
      whiteCol.className = "history-move white-move"
      whiteCol.textContent = pair.whiteMove

      const blackCol = document.createElement("span")
      blackCol.className = "history-move black-move"
      blackCol.textContent = pair.blackMove

      row.appendChild(numCol)
      row.appendChild(whiteCol)
      row.appendChild(blackCol)
      historyList.appendChild(row)
    })

    // Auto scroll to bottom
    historyList.scrollTop = historyList.scrollHeight
  }

  const updateStatusDisplay = (status, turn) => {
    const statusBox = document.getElementById("game-status-box")
    const turnAvatar = document.getElementById("current-turn-avatar")
    const turnName = document.getElementById("current-turn-name")

    if (turnAvatar && turnName) {
      if (turn === "w") {
        turnAvatar.src = PIECE_IMAGES.w_k
        turnName.textContent = "King Steve (White)"
      } else {
        turnAvatar.src = PIECE_IMAGES.b_k
        turnName.textContent = "Herobrine (Black)"
      }
    }

    if (statusBox) {
      if (status.isOver) {
        statusBox.className = "status-box game-over-status"
        statusBox.textContent = status.message
      } else if (status.inCheck) {
        statusBox.className = "status-box check-status"
        statusBox.textContent = status.message
      } else {
        statusBox.className = "status-box normal-status"
        statusBox.textContent = `${turn === "w" ? "White" : "Black"} to move`
      }
    }
  }

  return {
    init,
    setFlipped,
    getFlipped,
    toggleFlip,
    renderBoard,
    setSelectedSquare,
    clearSelection,
    showPromotionModal,
    updateCapturedPieces,
    updateMoveHistory,
    updateStatusDisplay
  }
})()

if (typeof window !== "undefined") {
  window.ChessUI = ChessUI
}
