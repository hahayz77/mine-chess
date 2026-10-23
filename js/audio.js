// Minecraft Chess - Procedural Sound Effects via Web Audio API
const ChessAudio = (() => {
  let audioCtx = null
  let muted = false

  // Load mute setting from localStorage if available
  try {
    const saved = localStorage.getItem("minecraft_chess_muted")
    if (saved !== null) {
      muted = JSON.parse(saved)
    }
  } catch (e) {
    muted = false
  }

  const getAudioContext = () => {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (AudioContextClass) {
        audioCtx = new AudioContextClass()
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume()
    }
    return audioCtx
  }

  const isMuted = () => muted

  const toggleMute = () => {
    muted = !muted
    try {
      localStorage.setItem("minecraft_chess_muted", JSON.stringify(muted))
    } catch (e) {
      // Storage unavailable
    }
    return muted
  }

  // Create subtle noise buffer for impacts
  const createNoiseBuffer = (ctx, duration) => {
    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
    return buffer
  }

  // Wood block step / place sound for normal move
  const playMove = () => {
    if (muted) return
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "triangle"
    osc.frequency.setValueAtTime(140, now)
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.08)

    gain.gain.setValueAtTime(0.35, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.08)
  }

  // Critical hit / sword strike for capture
  const playCapture = () => {
    if (muted) return
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    // White noise pop for sword strike
    const noise = ctx.createBufferSource()
    noise.buffer = createNoiseBuffer(ctx, 0.12)

    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = "bandpass"
    noiseFilter.frequency.setValueAtTime(1200, now)
    noiseFilter.frequency.exponentialRampToValueAtTime(300, now + 0.12)

    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.4, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(ctx.destination)

    noise.start(now)

    // Body thud
    const osc = ctx.createOscillator()
    const oscGain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(180, now)
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.14)

    oscGain.gain.setValueAtTime(0.5, now)
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)

    osc.connect(oscGain)
    oscGain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.14)
  }

  // Anvil / warning bell chime for Check
  const playCheck = () => {
    if (muted) return
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const frequencies = [660, 880, 1320]

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = idx === 0 ? "sine" : "triangle"
      osc.frequency.setValueAtTime(freq, now)

      gain.gain.setValueAtTime(0.25 / (idx + 1), now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.45)
    })
  }

  // Mechanical piston sound for Castling
  const playCastle = () => {
    if (muted) return
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    // First click
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = "triangle"
    osc1.frequency.setValueAtTime(220, now)
    gain1.gain.setValueAtTime(0.3, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.06)

    // Second click (wood piston latch)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = "square"
    osc2.frequency.setValueAtTime(110, now + 0.08)
    gain2.gain.setValueAtTime(0.25, now + 0.08)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.08)
    osc2.stop(now + 0.18)
  }

  // Minecraft Level Up Experience chime on Victory!
  const playVictory = () => {
    if (muted) return
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const noteTime = now + i * 0.1

      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, noteTime)

      gain.gain.setValueAtTime(0.3, noteTime)
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(noteTime)
      osc.stop(noteTime + 0.35)
    })
  }

  // Defeat / draw sound
  const playDefeat = () => {
    if (muted) return
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const notes = [330, 293.66, 261.63, 220] // E4, D4, C4, A3
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const noteTime = now + i * 0.14

      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(freq, noteTime)

      gain.gain.setValueAtTime(0.18, noteTime)
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(noteTime)
      osc.stop(noteTime + 0.4)
    })
  }

  return {
    getAudioContext,
    isMuted,
    toggleMute,
    playMove,
    playCapture,
    playCheck,
    playCastle,
    playVictory,
    playDefeat
  }
})()

if (typeof window !== "undefined") {
  window.ChessAudio = ChessAudio
}
