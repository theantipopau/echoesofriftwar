import { Engine } from '@babylonjs/core/Engines/engine'
import '@babylonjs/loaders/glTF'
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent'
import './styles/shell.css'
import GameManager from './systems/game/GameManager'
import SaveManager from './systems/game/SaveManager'

const loadingScreen = document.getElementById('loading-screen') as HTMLDivElement | null
const loadingStatus = document.getElementById('loading-status') as HTMLDivElement | null

function setLoadingStatus(message: string): void {
  if (loadingStatus) {
    loadingStatus.textContent = message
  }
}

function promptStartMode(saveManager: SaveManager): Promise<'continue' | 'new'> {
  const inspection = saveManager.inspect()
  if (inspection.status === 'missing' || !loadingScreen) {
    return Promise.resolve('new')
  }

  if (inspection.status !== 'ok') {
    loadingScreen.innerHTML = `
      <div class="loading-card">
        <img class="loading-badge" src="${import.meta.env.BASE_URL}squarelogo.PNG" alt="Echoes crest" />
        <img class="loading-header" src="${import.meta.env.BASE_URL}headerlogo.PNG" alt="Echoes of the Riftwar" />
        <p class="loading-copy">Existing save data could not be used. A new journey will begin.</p>
        <div class="loading-status">${inspection.status === 'version-mismatch' ? 'Save version mismatch' : 'Save data invalid'}</div>
        <button id="start-new-game" class="loading-action">New Game</button>
      </div>
    `

    const newGameButton = document.getElementById('start-new-game') as HTMLButtonElement | null
    return new Promise((resolve) => {
      newGameButton?.addEventListener('click', () => resolve('new'), { once: true })
    })
  }

  const savedAt = new Date(inspection.summary.savedAtIso)
  const savedAtLabel = Number.isNaN(savedAt.getTime()) ? inspection.summary.savedAtIso : savedAt.toLocaleString()
  loadingScreen.innerHTML = `
    <div class="loading-card">
      <img class="loading-badge" src="${import.meta.env.BASE_URL}squarelogo.PNG" alt="Echoes crest" />
      <img class="loading-header" src="${import.meta.env.BASE_URL}headerlogo.PNG" alt="Echoes of the Riftwar" />
      <p class="loading-copy">A previous journey was found in ${inspection.summary.currentRegionId.replace(/_/g, ' ')}.</p>
      <div class="loading-status">Saved ${savedAtLabel} • v${inspection.summary.version}</div>
      <div class="loading-actions">
        <button id="continue-game" class="loading-action">Continue</button>
        <button id="start-new-game" class="loading-action loading-action--secondary">New Game</button>
      </div>
    </div>
  `

  const continueButton = document.getElementById('continue-game') as HTMLButtonElement | null
  const newGameButton = document.getElementById('start-new-game') as HTMLButtonElement | null
  return new Promise((resolve) => {
    continueButton?.addEventListener('click', () => resolve('continue'), { once: true })
    newGameButton?.addEventListener('click', () => resolve('new'), { once: true })
  })
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
const saveManager = new SaveManager()
void promptStartMode(saveManager)
  .then((startMode) => {
    setLoadingStatus(startMode === 'continue' ? 'Restoring frontier data' : 'Loading frontier data')
    return gameManager.start(startMode)
  })
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
