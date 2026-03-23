import { Engine } from '@babylonjs/core/Engines/engine'
import '@babylonjs/loaders/glTF'
import GameManager from './systems/game/GameManager'

const loadingScreen = document.getElementById('loading-screen') as HTMLDivElement | null
const loadingStatus = document.getElementById('loading-status') as HTMLDivElement | null

function setLoadingStatus(message: string): void {
  if (loadingStatus) {
    loadingStatus.textContent = message
  }
}

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
setLoadingStatus('Loading frontier data')
void gameManager.start()
  .then(() => {
    setLoadingStatus('World ready')
    loadingScreen?.classList.add('hidden')
  })
  .catch((error) => {
    console.error('Failed to start game', error)
    setLoadingStatus('Startup failed')
    if (loadingScreen) {
      loadingScreen.innerHTML = `
        <div class="loading-card">
          <img class="loading-badge" src="${import.meta.env.BASE_URL}squarelogo.PNG" alt="Echoes crest" />
          <img class="loading-header" src="${import.meta.env.BASE_URL}headerlogo.PNG" alt="Echoes of the Riftwar" />
          <p class="loading-copy">The Riftway failed to open. Check the browser console for details.</p>
          <div class="loading-status">Startup failed</div>
        </div>
      `
    }
  })

// Handle window resize
window.addEventListener('resize', () => {
  engine.resize()
})

// Render loop
engine.runRenderLoop(() => {
  gameManager.update()
  gameManager.getScene().render()
})
