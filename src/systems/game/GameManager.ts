import { Engine } from '@babylonjs/core/Engines/engine'
import { Scene } from '@babylonjs/core/scene'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { ColorCurves } from '@babylonjs/core/Materials/colorCurves'
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator'
import { SkyMaterial } from '@babylonjs/materials/sky'
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import { applyRegionAtmosphere, getRegionAtmosphere } from '../visual/RegionAtmosphere'
import { createWarAshEffect, createDustEffect, type RiftParticleHandle } from '../visual/RiftParticleEffects'
import { RegionalSoundscape } from '../visual/RegionalSoundscape'
import WorldManager from '../world/WorldManager'
import ItemManager from '../content/ItemManager'
import NPCManager from '../content/NPCManager'
import EnemyManager from '../content/EnemyManager'
import RegionManager from '../content/RegionManager'
import QuestManager from '../content/QuestManager'
import DungeonContentManager from '../content/DungeonContentManager'
import { UIManager } from '../ui/UIManager'
import { QuestJournal } from './QuestJournal'
import { RegionProgression } from './RegionProgression'
import SaveSystem from './SaveSystem'
import type { InventoryViewState } from '../ui/uiTypes'
import type { ItemData, ItemStats } from '../../data/types'

export interface GameConfig {
  engine: Engine
  canvas: HTMLCanvasElement
  worldSize: number
  tileSize: number
  heightmapScale: number
}

export default class GameManager {
  private scene: Scene
  private engine: Engine
  private config: GameConfig
  private worldManager: WorldManager
  private uiManager: UIManager
  private questJournal: QuestJournal
  private regionProgression: RegionProgression
  private saveSystem: SaveSystem
  private shadowGenerator: ShadowGenerator | null = null
  private sunLight: DirectionalLight | null = null
  private ambientLight: HemisphericLight | null = null
  private skyMaterial: SkyMaterial | null = null
  private ambientEffects: RiftParticleHandle[] = []
  private regionalSoundscape: RegionalSoundscape
  private lastShadowCasterRefreshMs = 0
  private lastAutosaveTimestamp = Date.now()
  private readonly autosaveIntervalMs = 60000

  // Content managers
  private itemManager: ItemManager
  private npcManager: NPCManager
  private enemyManager: EnemyManager
  private regionManager: RegionManager
  private questManager: QuestManager
  private dungeonContentManager: DungeonContentManager

  constructor(config: GameConfig) {
    this.config = config
    this.engine = config.engine
    this.scene = new Scene(this.engine)
    this.scene.collisionsEnabled = true

    // Initialize UI
    this.uiManager = new UIManager()

    // Initialize content managers
    this.itemManager = new ItemManager()
    this.npcManager = new NPCManager()
    this.enemyManager = new EnemyManager()
    this.regionManager = new RegionManager()
    this.questManager = new QuestManager()
    this.dungeonContentManager = new DungeonContentManager()
    this.questJournal = new QuestJournal(this.questManager, this.itemManager)
    this.regionProgression = new RegionProgression(this.regionManager)
    this.saveSystem = new SaveSystem()
    this.regionalSoundscape = new RegionalSoundscape()

    this.uiManager.setInventoryHandlers({
      onEquip: (itemId) => {
        const player = this.worldManager.getPlayer()
        if (!player) {
          return
        }
        this.uiManager.showNotification(player.equipFromInventory(itemId), 'info')
      },
      onConsume: (itemId) => {
        const player = this.worldManager.getPlayer()
        if (!player) {
          return
        }
        this.uiManager.showNotification(player.consumeItem(itemId), 'success')
      },
      onUnequip: (slot) => {
        const player = this.worldManager.getPlayer()
        if (!player) {
          return
        }
        this.uiManager.showNotification(player.unequipToInventory(slot), 'info')
      },
    })

    // Initialize world manager
    this.worldManager = new WorldManager(this.scene, config, {
      enemyManager: this.enemyManager,
      itemManager: this.itemManager,
      npcManager: this.npcManager,
      questJournal: this.questJournal,
      regionProgression: this.regionProgression,
      dungeonContentManager: this.dungeonContentManager,
      uiManager: this.uiManager,
      onTravelToRegion: (regionId: string) => this.travelToRegion(regionId),
    })

    this.setupScene()
    this.setupPersistenceShortcuts()
  }

  private setupScene(): void {
    // Lighting
    const ambientLight = new HemisphericLight('ambientLight', new Vector3(0.5, 1, 0.5), this.scene)
    ambientLight.intensity = 0.56
    this.ambientLight = ambientLight

    const sunLight = new DirectionalLight('sunLight', new Vector3(-0.45, -1, -0.15), this.scene)
    sunLight.position = new Vector3(420, 650, 280)
    sunLight.intensity = 1.28
    this.sunLight = sunLight

    this.shadowGenerator = new ShadowGenerator(1024, sunLight)
    this.shadowGenerator.usePoissonSampling = true
    this.shadowGenerator.bias = 0.0008
    this.shadowGenerator.normalBias = 0.02
    this.shadowGenerator.darkness = 0.35

    // High quality procedural sky and atmospheric fog
    const skybox = CreateBox('skybox', { size: 5000 }, this.scene)
    const skyboxMaterial = new SkyMaterial('skyboxMaterial', this.scene)
    skyboxMaterial.backFaceCulling = false
    skyboxMaterial.luminance = 0.7
    skyboxMaterial.turbidity = 9
    skyboxMaterial.rayleigh = 2.1
    skyboxMaterial.mieCoefficient = 0.006
    skyboxMaterial.mieDirectionalG = 0.93
    skyboxMaterial.inclination = 0.46
    skyboxMaterial.azimuth = 0.27
    skybox.material = skyboxMaterial
    this.skyMaterial = skyboxMaterial

    this.scene.fogMode = Scene.FOGMODE_EXP2
    this.scene.fogDensity = 0.00075
    this.scene.fogColor = new Color3(0.12, 0.15, 0.22)

    // Color grading — cool, desaturated rift atmosphere (no external LUT file needed)
    const imgProc = this.scene.imageProcessingConfiguration
    imgProc.isEnabled = true
    imgProc.contrast = 1.35
    imgProc.exposure = 0.82
    imgProc.colorCurvesEnabled = true
    const curves = new ColorCurves()
    curves.globalSaturation = 65        // slightly desaturated / gritty
    curves.highlightsHue = 215          // cool blue-purple highlights
    curves.highlightsWeight = 0.25
    curves.shadowsHue = 220             // blue-purple shadows
    curves.shadowsDensity = 0.4
    imgProc.colorCurves = curves
  }

  async start(): Promise<void> {
    // Load all content data
    await Promise.all([
      this.itemManager.load(),
      this.npcManager.load(),
      this.enemyManager.load(),
      this.regionManager.load(),
      this.questManager.load(),
      this.dungeonContentManager.load()
    ])

    console.log('✅ Game initialized with Babylon.js')
    console.log('📦 Items loaded:', this.itemManager.getItems().length)
    console.log('🧙 NPCs loaded:', this.npcManager.getNPCs().length)
    console.log('👹 Enemies loaded:', this.enemyManager.getEnemies().length)
    console.log('🗺️  Regions loaded:', this.regionManager.getRegions().length)
    console.log('🕳️  Dungeons loaded:', this.dungeonContentManager.getDungeons().length)

    this.regionProgression.initialize('crydee')

    const restored = await this.loadGameFromDisk('startup')
    if (!restored) {
      await this.initializeNewGame()
    }

    this.uiManager.updateRegionProgress(this.regionProgression.getViewState())
  }

  public update(): void {
    // Game logic updates
    this.worldManager.update()
    this.refreshShadowCasters()

    if (Date.now() - this.lastAutosaveTimestamp >= this.autosaveIntervalMs) {
      this.saveGame('auto')
      this.lastAutosaveTimestamp = Date.now()
    }

    // Update UI with player stats
    const player = this.worldManager.getPlayer()
    if (player) {
      this.uiManager.updateHealth(player.getHealth(), player.getMaxHealth())
      this.uiManager.updateMana(player.getMana(), player.getMaxMana())
      this.uiManager.updateLevel(player.getLevel(), player.getExperience())
      this.uiManager.updateInventoryState(this.buildInventoryState(player))
    }

    this.uiManager.updateQuestTracker(this.questJournal.getViewState())
    this.uiManager.updateRegionProgress(this.regionProgression.getViewState())
  }

  public getScene(): Scene {
    return this.scene
  }

  public getEngine(): Engine {
    return this.engine
  }

  public getConfig(): GameConfig {
    return this.config
  }

  // Accessor methods for managers
  public getItemManager(): ItemManager {
    return this.itemManager
  }

  public getNPCManager(): NPCManager {
    return this.npcManager
  }

  public getEnemyManager(): EnemyManager {
    return this.enemyManager
  }

  public getRegionManager(): RegionManager {
    return this.regionManager
  }

  public getQuestManager(): QuestManager {
    return this.questManager
  }

  public getWorldManager(): WorldManager {
    return this.worldManager
  }

  public getUIManager(): UIManager {
    return this.uiManager
  }

  private refreshShadowCasters(): void {
    if (!this.shadowGenerator) {
      return
    }

    const now = performance.now()
    if (now - this.lastShadowCasterRefreshMs < 1000) {
      return
    }
    this.lastShadowCasterRefreshMs = now

    const shadowMeshes: AbstractMesh[] = this.worldManager.getShadowCasterMeshes(70)
    const shadowMap = this.shadowGenerator.getShadowMap()
    if (!shadowMap) {
      return
    }

    shadowMap.renderList = []
    shadowMeshes.forEach((mesh) => {
      this.shadowGenerator?.addShadowCaster(mesh, true)
    })
  }

  private async travelToRegion(regionId: string): Promise<boolean> {
    if (!this.regionProgression.isRegionUnlocked(regionId)) {
      const message = this.regionProgression.getUnlockHint(regionId)
      this.uiManager.showNotification(message, 'warning')
      return false
    }

    const region = this.regionManager.getRegionById(regionId)
    if (!region) {
      this.uiManager.showNotification(`Region not found: ${regionId}`, 'error')
      return false
    }

    if (region.playable === false) {
      this.uiManager.showNotification(`Route to ${region.name} secured. The forward sector is charted and ready for the next expansion.`, 'success')
      this.uiManager.updateRegionProgress(this.regionProgression.getViewState())
      return true
    }

    await this.worldManager.generateWorld(region)
    this.regionProgression.setCurrentRegion(region.id)
    this.uiManager.updateRegionProgress(this.regionProgression.getViewState())
    this.applyRegionAtmosphereEffects(region.id, region.biome)
    this.regionalSoundscape.applyRegion(region)
    this.saveGame('checkpoint')
    return true
  }

  private applyRegionAtmosphereEffects(regionId: string, biome?: string): void {
    if (!this.scene || !this.ambientLight || !this.sunLight) return

    // Dispose previous ambient particle effects
    for (const handle of this.ambientEffects) handle.dispose()
    this.ambientEffects = []

    // Apply per-region atmosphere (lighting, fog, color grading)
    const atmosphere = getRegionAtmosphere(regionId)
    if (!atmosphere) return
    applyRegionAtmosphere(this.scene, atmosphere)

    // Update light colours and intensities
    const { ambientColor, sunColor, sunIntensity, sunDirection } = atmosphere
    this.ambientLight.diffuse.set(ambientColor.r, ambientColor.g, ambientColor.b)
    this.ambientLight.intensity = atmosphere.ambientIntensity ?? 0.56

    this.sunLight.diffuse.set(sunColor.r, sunColor.g, sunColor.b)
    this.sunLight.intensity = sunIntensity
    this.sunLight.direction.set(sunDirection.x, sunDirection.y, sunDirection.z)

    // Sky material tweaks based on rift influence / haze
    if (this.skyMaterial) {
      const haze = atmosphere.hazeFactor
      const rift = atmosphere.riftInfluence
      this.skyMaterial.luminance   = 0.7 - rift * 0.3
      this.skyMaterial.turbidity   = 9 + haze * 12
      this.skyMaterial.rayleigh    = 2.1 - rift * 1.0
      this.skyMaterial.inclination = 0.46 + haze * 0.08
    }

    // Spawn ambient particle effects per biome
    const centre = new Vector3(0, 0, 0)
    if (biome === 'warfront') {
      this.ambientEffects.push(createWarAshEffect(this.scene, centre, 120))
      this.ambientEffects.push(createDustEffect(this.scene, centre, 120))
    }
  }

  private setupPersistenceShortcuts(): void {
    window.addEventListener('keydown', (event) => {
      if (event.key === 'F5') {
        event.preventDefault()
        this.saveGame('manual')
      }

      if (event.key === 'F9') {
        event.preventDefault()
        void this.loadGameFromDisk('manual')
      }
    })
  }

  private async initializeNewGame(): Promise<void> {
    if (!(await this.travelToRegion('crydee'))) {
      console.warn('⚠️  Start region not found, using first available region')
      const regions = this.regionManager.getRegions()
      if (regions.length > 0) {
        await this.travelToRegion(regions[0].id)
      }
    }

    const player = this.worldManager.getPlayer()
    if (!player) {
      return
    }

    const starterItems = ['bronze_sword', 'leather_armor', 'healing_potion']
    starterItems.forEach((itemId) => {
      const item = this.itemManager.getItem(itemId)
      if (item) {
        player.addToInventory(item)
      }
    })
    player.equipFromInventory('bronze_sword')
    player.equipFromInventory('leather_armor')
    this.saveGame('checkpoint')
  }

  private saveGame(reason: 'manual' | 'auto' | 'checkpoint'): boolean {
    const player = this.worldManager.getPlayer()
    if (!player) {
      return false
    }

    const saved = this.saveSystem.save({
      currentRegionId: this.regionProgression.getCurrentRegionId(),
      player: player.getSnapshot(),
      questJournal: this.questJournal.getSnapshot(),
      regionProgression: this.regionProgression.getSnapshot(),
    })

    if (reason === 'manual') {
      this.uiManager.showNotification(saved ? 'Game saved.' : 'Save failed.', saved ? 'success' : 'error')
    }

    return saved
  }

  private async loadGameFromDisk(trigger: 'startup' | 'manual'): Promise<boolean> {
    const snapshot = this.saveSystem.load()
    if (!snapshot) {
      if (trigger === 'manual') {
        this.uiManager.showNotification('No save slot found.', 'warning')
      }
      return false
    }

    this.questJournal.restoreFromSnapshot(snapshot.questJournal)
    this.regionProgression.restoreFromSnapshot(snapshot.regionProgression)

    const fallbackRegionId = this.regionManager.getRegions()[0]?.id ?? 'crydee'
    const targetRegionId = snapshot.currentRegionId || this.regionProgression.getCurrentRegionId() || fallbackRegionId

    if (!(await this.travelToRegion(targetRegionId))) {
      if (!(await this.travelToRegion(fallbackRegionId))) {
        return false
      }
    }

    const player = this.worldManager.getPlayer()
    if (!player) {
      return false
    }

    player.restoreFromSnapshot(snapshot.player, (itemId) => this.itemManager.getItem(itemId))
    this.lastAutosaveTimestamp = Date.now()
    if (trigger === 'manual') {
      this.uiManager.showNotification('Save loaded.', 'success')
    }
    return true
  }

  private buildInventoryState(player: import('../../entities/Player3D').Player3D): InventoryViewState {
    return {
      items: player.getInventory().map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        rarity: item.rarity,
        description: item.description,
        stats: this.normalizeStats(item.stats),
      })),
      equipment: ['weapon', 'chest', 'accessory'].map((slot) => {
        const item = player.getEquipment()[slot as keyof ReturnType<typeof player.getEquipment>] ?? null
        return {
          slot,
          item: item ? this.mapInventoryItem(item) : null,
        }
      }),
      stats: player.getDerivedStats(),
    }
  }

  private mapInventoryItem(item: ItemData) {
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      rarity: item.rarity,
      description: item.description,
      stats: this.normalizeStats(item.stats),
    }
  }

  private normalizeStats(stats: ItemStats): Record<string, number | undefined> {
    return {
      attack: stats.attack,
      defense: stats.defense,
      maxHealth: stats.maxHealth,
      maxMana: stats.maxMana,
      crit: stats.crit,
      speed: stats.speed,
    }
  }
}
