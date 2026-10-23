// Minecraft Chess - Main Application Orchestrator
const ChessApp = (() => {
  const { createInitialState, cloneState, getPiece } = ChessBoard
  const { getLegalMoves, makeMove, getGameStatus } = ChessRules
  const { playMove, playCapture, playCheck, playCastle, playVictory, playDefeat, toggleMute, isMuted } = ChessAudio
  const {
    init: initUI,
    renderBoard,
    setSelectedSquare,
    clearSelection,
    showPromotionModal,
    updateCapturedPieces,
    updateMoveHistory,
    updateStatusDisplay,
    toggleFlip,
    setFlipped
  } = ChessUI

  let gameState = null
  let selectedSquare = null
  let currentLegalMoves = []
  let isBotThinking = false

  // Game Settings
  let gameMode = "pve" // "pvp" or "pve"
  let humanColor = "w" // "w", "b", or "random"
  let actualHumanColor = "w"
  let botDifficulty = "medium" // "easy", "medium", "hard"

  const init = () => {
    initUI("chessboard")
    bindControls()
    startNewGame()
  }

  const startNewGame = () => {
    gameState = createInitialState()
    selectedSquare = null
    currentLegalMoves = []
    isBotThinking = false

    // Handle human color choice
    if (humanColor === "random") {
      actualHumanColor = Math.random() < 0.5 ? "w" : "b"
    } else {
      actualHumanColor = humanColor
    }

    // Auto flip board if human plays as Black in PvE
    if (gameMode === "pve" && actualHumanColor === "b") {
      setFlipped(true)
    } else {
      setFlipped(false)
    }

    const status = getGameStatus(gameState)
    gameState.lastStatus = status

    refreshUI()

    // If bot plays first (human is black)
    if (gameMode === "pve" && gameState.turn !== actualHumanColor) {
      triggerBotMove()
    }
  }

  const refreshUI = () => {
    const status = gameState.lastStatus || getGameStatus(gameState)
    gameState.lastStatus = status

    renderBoard(gameState, handleSquareClick, handleMoveAttempt)
    updateCapturedPieces(gameState)
    updateMoveHistory(gameState.moveHistory)
    updateStatusDisplay(status, gameState.turn)
  }

  const handleSquareClick = async (row, col) => {
    if (isBotThinking) return
    const status = gameState.lastStatus || getGameStatus(gameState)
    if (status.isOver) return

    // PvE: allow clicks only on human's turn
    if (gameMode === "pve" && gameState.turn !== actualHumanColor) return

    const clickedPiece = getPiece(gameState, row, col)

    // 1. If a square is already selected, check if this is a target move
    if (selectedSquare) {
      const targetMove = currentLegalMoves.find(m => m.to.row === row && m.to.col === col)
      if (targetMove) {
        await executePlayerMove(targetMove)
        return
      }
    }

    // 2. Otherwise select piece of current turn
    if (clickedPiece && clickedPiece.color === gameState.turn) {
      selectedSquare = { row, col }
      currentLegalMoves = getLegalMoves(gameState, row, col)
      setSelectedSquare(selectedSquare, currentLegalMoves)
      refreshUI()
    } else {
      selectedSquare = null
      currentLegalMoves = []
      clearSelection()
      refreshUI()
    }
  }

  const handleMoveAttempt = async (fromRow, fromCol, toRow, toCol) => {
    if (isBotThinking) return
    const status = gameState.lastStatus || getGameStatus(gameState)
    if (status.isOver) return

    if (gameMode === "pve" && gameState.turn !== actualHumanColor) return

    const legalFromMoves = getLegalMoves(gameState, fromRow, fromCol)
    const targetMove = legalFromMoves.find(m => m.to.row === toRow && m.to.col === toCol)

    if (targetMove) {
      await executePlayerMove(targetMove)
    }
  }

  const executePlayerMove = async (move) => {
    selectedSquare = null
    currentLegalMoves = []
    clearSelection()

    let promoChoice = "q"
    const piece = getPiece(gameState, move.from.row, move.from.col)

    if (piece && piece.type === "p" && (move.to.row === 0 || move.to.row === 7)) {
      promoChoice = await showPromotionModal(piece.color)
    }

    const executedMove = makeMove(gameState, move, promoChoice)
    if (!executedMove) return

    // Sound effects
    playAppropriateSound(executedMove)

    const status = getGameStatus(gameState)
    gameState.lastStatus = status

    refreshUI()

    if (status.isOver) {
      if (status.result === "checkmate") {
        playVictory()
      } else {
        playDefeat()
      }
      return
    }

    // Bot move in PvE
    if (gameMode === "pve" && gameState.turn !== actualHumanColor) {
      triggerBotMove()
    }
  }

  const triggerBotMove = async () => {
    isBotThinking = true
    const statusBox = document.getElementById("game-status-box")
    if (statusBox) {
      statusBox.className = "status-box thinking-status"
      statusBox.textContent = `Bot is planning next move...`
    }

    const botMove = await ChessAI.getBestMoveAsync(gameState, botDifficulty)
    isBotThinking = false

    if (!botMove) return

    // Bot promotion default to Queen
    const executedMove = makeMove(gameState, botMove, "q")
    if (!executedMove) return

    playAppropriateSound(executedMove)

    const status = getGameStatus(gameState)
    gameState.lastStatus = status

    refreshUI()

    if (status.isOver) {
      if (status.result === "checkmate") {
        if (status.winner === actualHumanColor) {
          playVictory()
        } else {
          playDefeat()
        }
      } else {
        playDefeat()
      }
    }
  }

  const playAppropriateSound = (move) => {
    const nextStatus = getGameStatus(gameState)
    if (nextStatus.inCheck) {
      playCheck()
    } else if (move.isCastling) {
      playCastle()
    } else if (move.captured || move.isEnPassant) {
      playCapture()
    } else {
      playMove()
    }
  }

  const undoMove = () => {
    if (isBotThinking) return
    if (!gameState || gameState.moveHistory.length === 0) return

    // In PvE, undo two moves (bot move + human move)
    const undoCount = (gameMode === "pve" && gameState.moveHistory.length >= 2) ? 2 : 1

    // Replay moves from start to reconstruct board state cleanly
    const historyBackup = [...gameState.moveHistory]
    const targetLength = Math.max(0, historyBackup.length - undoCount)

    gameState = createInitialState()
    for (let i = 0; i < targetLength; i++) {
      const prevMove = historyBackup[i]
      makeMove(gameState, prevMove, prevMove.promotion || "q")
    }

    selectedSquare = null
    currentLegalMoves = []
    clearSelection()

    const status = getGameStatus(gameState)
    gameState.lastStatus = status

    playMove()
    refreshUI()
  }

  const bindControls = () => {
    // New game button
    const btnNewGame = document.getElementById("btn-new-game")
    if (btnNewGame) {
      btnNewGame.addEventListener("click", () => {
        startNewGame()
      })
    }

    // Undo button
    const btnUndo = document.getElementById("btn-undo")
    if (btnUndo) {
      btnUndo.addEventListener("click", () => {
        undoMove()
      })
    }

    // Flip board button
    const btnFlip = document.getElementById("btn-flip")
    if (btnFlip) {
      btnFlip.addEventListener("click", () => {
        toggleFlip()
        refreshUI()
      })
    }

    // Mute button
    const btnSound = document.getElementById("btn-sound")
    if (btnSound) {
      const updateSoundIcon = (muted) => {
        btnSound.textContent = muted ? "🔇 Sound: OFF" : "🔊 Sound: ON"
      }
      updateSoundIcon(isMuted())
      btnSound.addEventListener("click", () => {
        const muted = toggleMute()
        updateSoundIcon(muted)
      })
    }

    // Mode select
    const modeSelect = document.getElementById("mode-select")
    if (modeSelect) {
      modeSelect.value = gameMode
      modeSelect.addEventListener("change", (e) => {
        gameMode = e.target.value
        const botConfig = document.getElementById("bot-config-panel")
        if (botConfig) {
          botConfig.style.display = gameMode === "pve" ? "flex" : "none"
        }
        startNewGame()
      })
    }

    // Difficulty select
    const difficultySelect = document.getElementById("difficulty-select")
    if (difficultySelect) {
      difficultySelect.value = botDifficulty
      difficultySelect.addEventListener("change", (e) => {
        botDifficulty = e.target.value
      })
    }

    // Human color select
    const colorSelect = document.getElementById("color-select")
    if (colorSelect) {
      colorSelect.value = humanColor
      colorSelect.addEventListener("change", (e) => {
        humanColor = e.target.value
        startNewGame()
      })
    }
  }

  return {
    init,
    startNewGame,
    undoMove
  }
})()

window.addEventListener("DOMContentLoaded", () => {
  ChessApp.init()
})
