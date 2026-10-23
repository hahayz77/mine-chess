// Minecraft Chess - Constants
const ChessConstants = (() => {
  const COLORS = {
    WHITE: "w",
    BLACK: "b"
  }

  const PIECES = {
    PAWN: "p",
    KNIGHT: "n",
    BISHOP: "b",
    ROOK: "r",
    QUEEN: "q",
    KING: "k"
  }

  const PIECE_NAMES = {
    w: {
      p: "Steve Pawn",
      r: "Diorite Tower",
      n: "Steve on Horse",
      b: "Cleric Villager",
      q: "Queen Alex",
      k: "King Steve"
    },
    b: {
      p: "Zombie Villager",
      r: "Obsidian Citadel",
      n: "Skeleton Horseman",
      b: "Illager Evoker",
      q: "Ender Queen",
      k: "Herobrine King"
    }
  }

  const PIECE_IMAGES = {
    "w_p": "assets/pieces/w_pawn.png",
    "w_r": "assets/pieces/w_rook.png",
    "w_n": "assets/pieces/w_knight.png",
    "w_b": "assets/pieces/w_bishop.png",
    "w_q": "assets/pieces/w_queen.png",
    "w_k": "assets/pieces/w_king.png",
    "b_p": "assets/pieces/b_pawn.png",
    "b_r": "assets/pieces/b_rook.png",
    "b_n": "assets/pieces/b_knight.png",
    "b_b": "assets/pieces/b_bishop.png",
    "b_q": "assets/pieces/b_queen.png",
    "b_k": "assets/pieces/b_king.png"
  }

  const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
  }

  const INITIAL_BOARD = [
    [
      { type: "r", color: "b" },
      { type: "n", color: "b" },
      { type: "b", color: "b" },
      { type: "q", color: "b" },
      { type: "k", color: "b" },
      { type: "b", color: "b" },
      { type: "n", color: "b" },
      { type: "r", color: "b" }
    ],
    [
      { type: "p", color: "b" },
      { type: "p", color: "b" },
      { type: "p", color: "b" },
      { type: "p", color: "b" },
      { type: "p", color: "b" },
      { type: "p", color: "b" },
      { type: "p", color: "b" },
      { type: "p", color: "b" }
    ],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [
      { type: "p", color: "w" },
      { type: "p", color: "w" },
      { type: "p", color: "w" },
      { type: "p", color: "w" },
      { type: "p", color: "w" },
      { type: "p", color: "w" },
      { type: "p", color: "w" },
      { type: "p", color: "w" }
    ],
    [
      { type: "r", color: "w" },
      { type: "n", color: "w" },
      { type: "b", color: "w" },
      { type: "q", color: "w" },
      { type: "k", color: "w" },
      { type: "b", color: "w" },
      { type: "n", color: "w" },
      { type: "r", color: "w" }
    ]
  ]

  const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
  const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]

  return {
    COLORS,
    PIECES,
    PIECE_NAMES,
    PIECE_IMAGES,
    PIECE_VALUES,
    INITIAL_BOARD,
    FILES,
    RANKS
  }
})()

if (typeof window !== "undefined") {
  window.ChessConstants = ChessConstants
}
