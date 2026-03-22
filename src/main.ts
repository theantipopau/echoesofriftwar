import { Engine } from '@babylonjs/core/Engines/engine'
import GameManager from './systems/game/GameManager'

// Initialize Babylon.js engine
const canvasElement = document.getElementById('game')
if (!canvasElement || !(canvasElement instanceof HTMLCanvasElement)) {
  throw new Error('Canvas element with id "game" not found')
}
const canvas = canvasElement

const engine = new Engine(canvas, true, {
  preserveDrawingBuffer: true,
  antialias: true
})

// Game configuration
const gameConfig = {
  engine,
  canvas,
  worldSize: 5000,
  tileSize: 50,
  heightmapScale: 20
}

// Initialize game manager
const gameManager = new GameManager(gameConfig)
gameManager.start()

// Handle window resize
window.addEventListener('resize', () => {
  engine.resize()
})

// Render loop
engine.runRenderLoop(() => {
  gameManager.update()
  gameManager.getScene().render()
})
