import type { RegionData } from '../../data/types'

/**
 * Lightweight procedural ambience driven by region context.
 * Uses WebAudio oscillators/noise so no external audio assets are required.
 */
export class RegionalSoundscape {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private droneGain: GainNode | null = null
  private hissGain: GainNode | null = null
  private riftGain: GainNode | null = null
  private droneOsc: OscillatorNode | null = null
  private riftOsc: OscillatorNode | null = null
  private hissSource: AudioBufferSourceNode | null = null
  private initialized = false

  constructor() {
    const initOnInteraction = () => {
      void this.ensureInitialized()
      window.removeEventListener('pointerdown', initOnInteraction)
      window.removeEventListener('keydown', initOnInteraction)
    }

    window.addEventListener('pointerdown', initOnInteraction)
    window.addEventListener('keydown', initOnInteraction)
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return

    try {
      const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return

      this.audioContext = new Ctx()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = 0.0001
      this.masterGain.connect(this.audioContext.destination)

      this.droneGain = this.audioContext.createGain()
      this.droneGain.gain.value = 0
      this.droneGain.connect(this.masterGain)

      this.hissGain = this.audioContext.createGain()
      this.hissGain.gain.value = 0
      this.hissGain.connect(this.masterGain)

      this.riftGain = this.audioContext.createGain()
      this.riftGain.gain.value = 0
      this.riftGain.connect(this.masterGain)

      this.droneOsc = this.audioContext.createOscillator()
      this.droneOsc.type = 'triangle'
      this.droneOsc.frequency.value = 72
      this.droneOsc.connect(this.droneGain)
      this.droneOsc.start()

      this.riftOsc = this.audioContext.createOscillator()
      this.riftOsc.type = 'sawtooth'
      this.riftOsc.frequency.value = 196
      this.riftOsc.connect(this.riftGain)
      this.riftOsc.start()

      const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 2, this.audioContext.sampleRate)
      const data = noiseBuffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1
      }

      this.hissSource = this.audioContext.createBufferSource()
      this.hissSource.buffer = noiseBuffer
      this.hissSource.loop = true
      this.hissSource.connect(this.hissGain)
      this.hissSource.start()

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      this.initialized = true
    } catch {
      // Audio is optional; ignore initialization failures.
      this.initialized = false
    }
  }

  public applyRegion(region: RegionData): void {
    if (!this.initialized || !this.audioContext || !this.masterGain || !this.droneGain || !this.hissGain || !this.riftGain || !this.droneOsc || !this.riftOsc) {
      return
    }

    const now = this.audioContext.currentTime
    const hasRift = region.pointsOfInterest.some((poi) => poi.type === 'rift')
    const warfrontBias = region.biome === 'warfront' ? 1 : 0

    const targetMaster = 0.018 + Math.min(0.012, region.dangerLevel * 0.002)
    const targetDrone = 0.013 + region.dangerLevel * 0.0015
    const targetHiss = 0.004 + warfrontBias * 0.009
    const targetRift = hasRift ? 0.005 + region.dangerLevel * 0.0012 : 0.0002

    this.masterGain.gain.linearRampToValueAtTime(targetMaster, now + 1.1)
    this.droneGain.gain.linearRampToValueAtTime(targetDrone, now + 1.1)
    this.hissGain.gain.linearRampToValueAtTime(targetHiss, now + 1.1)
    this.riftGain.gain.linearRampToValueAtTime(targetRift, now + 1.1)

    this.droneOsc.frequency.linearRampToValueAtTime(64 + region.dangerLevel * 8, now + 1.2)
    this.riftOsc.frequency.linearRampToValueAtTime(hasRift ? 180 + region.dangerLevel * 20 : 120, now + 1.2)
  }

  public dispose(): void {
    try {
      this.droneOsc?.stop()
      this.riftOsc?.stop()
      this.hissSource?.stop()
    } catch {
      // no-op
    }
    this.audioContext?.close()

    this.audioContext = null
    this.masterGain = null
    this.droneGain = null
    this.hissGain = null
    this.riftGain = null
    this.droneOsc = null
    this.riftOsc = null
    this.hissSource = null
    this.initialized = false
  }
}