import type { Scene } from '@babylonjs/core/scene'
import type { Node } from '@babylonjs/core/node'
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Viewport } from '@babylonjs/core/Maths/math.viewport'
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import type { Mesh } from '@babylonjs/core/Meshes/mesh'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer'
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder'
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder'
import { CreatePolyhedron } from '@babylonjs/core/Meshes/Builders/polyhedronBuilder'
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder'
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder'
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder'
import { GameConfig } from '../game/GameManager'
import { DialogueOption, RegionData, RegionSpecialEncounter, RegionTransition } from '../../data/types'
import { Player3D } from '../../entities/Player3D'
import { Enemy3D } from '../../entities/Enemy3D'
import { NPC3D } from '../../entities/NPC3D'
import { LootDrop3D } from '../../entities/LootDrop3D'
import { CameraController } from '../camera/CameraController'
import { InputManager } from '../input/InputManager'
import DungeonContentManager from '../content/DungeonContentManager'
import EnemyManager from '../content/EnemyManager'
import ItemManager from '../content/ItemManager'
import NPCManager from '../content/NPCManager'
import { UIManager } from '../ui/UIManager'
import { ENEMY_SETTINGS, WORLD_SETTINGS } from '../../config/gameBalance'
import { QuestEventResult, QuestJournal } from '../game/QuestJournal'
import { RegionProgression } from '../game/RegionProgression'
import DungeonManager from './DungeonManager'
import type { DungeonData, DungeonInteractableData } from '../../data/types'
import { assetPath } from '../../utils/assetPaths'
import { getRegionEnvironment, type EnvironmentPropSpec, type RegionEnvironmentConfig } from './RegionEnvironments'
import { placeBuilding, preloadBuildingModels, createVegetationMarker } from './EnvironmentBuilder'
import {
  createCampfireEffect,
  createRiftCorruptionEffect,
  createRiftGroundSigil,
  createWarScorchField,
  type RiftParticleHandle,
} from '../visual/RiftParticleEffects'

const PROP_MODEL_MAP: Partial<Record<EnvironmentPropSpec['type'], string>> = {
  crate: 'Prop_Crate.gltf',
  wagon: 'Prop_Wagon.gltf',
  fence: 'Prop_WoodenFence_Single.gltf',
  fallen_log: 'Roof_Log.gltf',
}

const PROP_MODEL_SCALE: Partial<Record<EnvironmentPropSpec['type'], number>> = {
  crate: 0.9,
  wagon: 1.1,
  fence: 1.25,
  fallen_log: 1.6,
}

interface WorldDependencies {
  enemyManager: EnemyManager
  itemManager: ItemManager
  npcManager: NPCManager
  questJournal: QuestJournal
  regionProgression: RegionProgression
  dungeonContentManager: DungeonContentManager
  uiManager: UIManager
  onTravelToRegion: (regionId: string) => Promise<boolean>
}

export default class WorldManager {
  private scene: Scene
  private config: GameConfig
  private dependencies: WorldDependencies
  private terrain: Mesh | null = null
  private player: Player3D | null = null
  private camera: CameraController
  private input: InputManager
  private enemies: Map<string, Enemy3D> = new Map()
  private npcs: Map<string, NPC3D> = new Map()
  private lootDrops: LootDrop3D[] = []
  private propNodes: Node[] = []
  private poiMarkers: AbstractMesh[] = []
  private environmentNodes: Node[] = []
  private environmentEffects: RiftParticleHandle[] = []
  private propMaterialCache = new Map<string, StandardMaterial>()
  private deltaTime: number = 0
  private lastFrameTime: number = performance.now()
  private interactionCooldown = 0
  private currentRegion: RegionData | null = null
  private currentDialogueNpc: NPC3D | null = null
  private currentDialogueNodeId = 'start'
  private visitedPoiIds = new Set<string>()
  private specialEncounterEnemies = new Map<string, RegionSpecialEncounter>()
  private dungeonManager: DungeonManager
  private environmentMode: 'region' | 'dungeon' = 'region'
  private dungeonEncounterAssignments = new Map<string, string>()
  private dungeonEncounterCounts = new Map<string, number>()
  private dungeonAutoVisitedIds = new Set<string>()
  private lockedEnemyId: string | null = null

  constructor(scene: Scene, config: GameConfig, dependencies: WorldDependencies) {
    this.scene = scene
    this.config = config
    this.dependencies = dependencies
    this.camera = new CameraController(scene)
    this.input = new InputManager()
    this.dungeonManager = new DungeonManager(scene)
  }

  async generateWorld(region: RegionData, startOverride?: { x: number; y: number }): Promise<void> {
    this.currentRegion = region
    this.environmentMode = 'region'
    this.visitedPoiIds.clear()
    this.dungeonAutoVisitedIds.clear()
    region.pointsOfInterest
      .filter((poi) => this.dependencies.regionProgression.hasDiscoveredPoi(poi.id))
      .forEach((poi) => this.visitedPoiIds.add(poi.id))
    this.clearWorld(true)

    // Create terrain
    this.createTerrain(region)
    this.createPoiMarkers(region)
    this.createRegionProps(region)
    this.spawnRegionAmbientEffects(region)
    void this.loadRegionEnvironment(region)

    const startPos = startOverride ?? region.startPosition ?? { x: 0, y: 0 }
    const playerPosition = new Vector3(
      startPos.x,
      this.sampleTerrainHeight(startPos.x, startPos.y, region.biome, region.id) + 2.2,
      startPos.y,
    )

    if (!this.player) {
      this.player = new Player3D(this.scene, playerPosition)
    } else {
      this.player.setPosition(playerPosition)
    }

    this.camera.setTarget(this.player)

    this.spawnRegionNpcs(region)
    this.spawnRegionEnemies(region, startPos)
    region.specialEncounters
      ?.filter((encounter) => this.dependencies.regionProgression.hasDiscoveredPoi(encounter.poiId))
      .forEach((encounter) => this.triggerSpecialEncounter(encounter.poiId))

    console.log(`🌍 Generated world: ${region.name}`)
    this.dependencies.uiManager.showNotification(`Entered ${region.name}`, 'success')
  }

  private clearWorld(preservePlayer: boolean = false): void {
    this.enemies.forEach((enemy) => enemy.destroy())
    this.npcs.forEach((npc) => npc.destroy())
    this.lootDrops.forEach((drop) => drop.destroy())
    this.propNodes.forEach((node) => node.dispose())
    this.poiMarkers.forEach((marker) => marker.dispose())
    this.environmentNodes.forEach((node) => node.dispose())
    this.environmentEffects.forEach((effect) => effect.dispose())
    this.enemies.clear()
    this.npcs.clear()
    this.lootDrops = []
    this.propNodes = []
    this.poiMarkers = []
    this.environmentNodes = []
    this.environmentEffects = []
    this.specialEncounterEnemies.clear()
    this.dungeonEncounterAssignments.clear()
    this.dungeonEncounterCounts.clear()
    this.dungeonManager.clear()

    if (this.player && !preservePlayer) {
      this.player.destroy()
      this.player = null
    }

    if (this.terrain) {
      this.terrain.dispose()
      this.terrain = null
    }
  }

  private createTerrain(region: RegionData): void {
    // Create ground plane
    const ground = CreateGround(
      'ground',
      { width: this.config.worldSize, height: this.config.worldSize, subdivisions: 50 },
      this.scene
    )
    ground.position.y = 0

    const groundMaterial = new StandardMaterial('groundMaterial', this.scene)
    groundMaterial.emissiveColor = this.getBiomeColor(region.biome).scale(0.45)

    const baseTexture = new Texture(assetPath('textures/rocktrim_base.png'), this.scene)
    baseTexture.uScale = 18
    baseTexture.vScale = 18
    baseTexture.anisotropicFilteringLevel = 8
    groundMaterial.diffuseTexture = baseTexture

    const terrainTexture = new Texture(assetPath('textures/grass.png'), this.scene)
    terrainTexture.uScale = 38
    terrainTexture.vScale = 38
    terrainTexture.anisotropicFilteringLevel = 8
    groundMaterial.ambientTexture = terrainTexture
    groundMaterial.ambientColor = new Color3(0.44, 0.48, 0.42)

    const detailTexture = new Texture(assetPath('groundlayer-circle.png'), this.scene)
    detailTexture.uScale = 11
    detailTexture.vScale = 11
    detailTexture.anisotropicFilteringLevel = 8
    groundMaterial.emissiveTexture = detailTexture
    groundMaterial.emissiveTexture.level = 0.28

    const normalTexture = new Texture(assetPath('textures/rocktrim_normal.png'), this.scene)
    normalTexture.uScale = 26
    normalTexture.vScale = 26
    groundMaterial.bumpTexture = normalTexture
    groundMaterial.useParallax = true
    groundMaterial.useParallaxOcclusion = true
    groundMaterial.parallaxScaleBias = 0.02
    groundMaterial.invertNormalMapX = true
    groundMaterial.invertNormalMapY = true
    groundMaterial.specularColor = new Color3(0.06, 0.06, 0.06)
    groundMaterial.specularPower = 12
    groundMaterial.checkReadyOnlyOnce = false
    ground.material = groundMaterial
    ground.receiveShadows = true

    const positions = ground.getVerticesData(VertexBuffer.PositionKind)
    const indices = ground.getIndices()
    if (positions && indices) {
      for (let index = 0; index < positions.length; index += 3) {
        const x = positions[index]
        const z = positions[index + 2]
        positions[index + 1] = this.sampleTerrainHeight(x, z, region.biome, region.id)
      }
      ground.updateVerticesData(VertexBuffer.PositionKind, positions)

      const normals: number[] = []
      VertexData.ComputeNormals(positions, indices, normals)
      ground.updateVerticesData(VertexBuffer.NormalKind, normals)
    }

    this.terrain = ground
  }

  private sampleTerrainHeight(x: number, z: number, biome: RegionData['biome'], regionId?: string): number {
    const biomeFactor = biome === 'forest' ? 7 : biome === 'coast' ? 4 : biome === 'ruins' ? 6 : biome === 'warfront' ? 5 : 5
    const waveA = Math.sin(x / 40) * 0.8
    const waveB = Math.cos(z / 55) * 0.6
    const waveC = Math.sin((x + z) / 70) * 0.5
    let height = (waveA + waveB + waveC) * biomeFactor

    if (regionId === 'warfront_approach') {
      const roadCorridor = Math.max(0, 1 - Math.abs(z - 250) / 120) * -3.5
      const trenchCut = Math.max(0, 1 - Math.abs(z - 360) / 85) * -7.5
      const trenchMounds = Math.max(0, 1 - Math.abs(z - 360) / 130) * Math.sin(x / 18) * 2.2
      const redoubtRise = Math.max(0, 1 - Vector3.Distance(new Vector3(x, 0, z), new Vector3(300, 0, 210)) / 180) * 6
      const culvertSink = Math.max(0, 1 - Vector3.Distance(new Vector3(x, 0, z), new Vector3(890, 0, 410)) / 130) * -6
      height += roadCorridor + trenchCut + trenchMounds + redoubtRise + culvertSink
    }

    return height
  }

  private getBiomeColor(biome: string): Color3 {
    const colors: Record<string, Color3> = {
      forest: new Color3(0.2, 0.5, 0.2),
      coast: new Color3(0.8, 0.7, 0.3),
      wilderness: new Color3(0.6, 0.6, 0.4),
      city: new Color3(0.5, 0.5, 0.5),
      ruins: new Color3(0.4, 0.3, 0.3),
      warfront: new Color3(0.47, 0.39, 0.29),
    }
    return colors[biome] || new Color3(0.4, 0.4, 0.4)
  }

  public update(): void {
    // Calculate delta time
    const now = performance.now()
    this.deltaTime = (now - this.lastFrameTime) / 1000
    this.lastFrameTime = now
    this.interactionCooldown = Math.max(0, this.interactionCooldown - this.deltaTime)

    if (!this.player) return

    // Update player
    this.player.update(this.deltaTime)

    if (this.input.wasKeyPressed('q')) {
      this.cycleLockTarget()
    }

    this.validateLockTarget()
    this.camera.setCombatFocus(this.getLockedEnemy()?.getPosition() ?? null)
    this.dependencies.uiManager.updateCombatStatus(this.getCombatStatusText())

    // Update camera
    this.camera.update()

    if (this.environmentMode === 'dungeon') {
      this.dungeonManager.update(this.deltaTime)
    }

    if (this.input.wasKeyPressed('i')) {
      void this.dependencies.uiManager.toggleInventory()
    }

    if (this.input.wasKeyPressed(' ')) {
      this.player.attack()
    }

    if (this.input.wasKeyPressed('v')) {
      const dodged = this.player.tryDodge()
      if (!dodged) {
        this.dependencies.uiManager.showNotification('Dodge unavailable', 'warning')
      }
    }

    // Update enemies
    this.enemies.forEach((enemy) => {
      enemy.update(this.deltaTime)

      // Simple combat system
      const distance = Vector3.Distance(
        enemy.getMesh().position,
        this.player!.getMesh().position
      )

      if (distance < ENEMY_SETTINGS.aggroRadius) {
        enemy.setTarget(this.player!.getPosition())
      }

      if (distance < enemy.getAttackRange() && enemy.attack(this.player!)) {
        const damageTaken = this.player!.takeDamage(enemy.getAttackDamage())
        const popup = this.projectToScreen(this.player!.getPosition().add(new Vector3(0, 2.5, 0)))
        if (damageTaken <= 0) {
          this.dependencies.uiManager.showFloatingText('DODGE', popup.x, popup.y, 'success')
        } else {
          this.player!.applyHitReaction(enemy.getPosition(), 1.1)
          this.camera.addImpactKick(0.45)
          this.dependencies.uiManager.showFloatingText(`-${damageTaken}`, popup.x, popup.y, 'error')
        }
      }
    })

    if (this.player.consumeAttackHit()) {
      let landedHit = false
      const attackTargets = this.getPlayerAttackTargets()
      attackTargets.forEach((enemy) => {
        landedHit = true
        const damage = enemy.takeDamage(this.player!.getAttackDamage(), this.player!.getPosition())
        const popup = this.projectToScreen(enemy.getPosition().add(new Vector3(0, 2.4, 0)))
        this.camera.addImpactKick(0.24)
        this.dependencies.uiManager.showFloatingText(`-${damage}`, popup.x, popup.y, 'warning')
      })
      if (!landedHit) {
        this.dependencies.uiManager.showNotification('Your strike cuts through empty air.', 'warning')
      }
    }

    // Update NPCs
    this.npcs.forEach((npc) => {
      npc.update(this.deltaTime)
    })

    this.lootDrops = this.lootDrops.filter((drop) => {
      drop.update(this.deltaTime)
      const distance = Vector3.Distance(drop.getMesh().position, this.player!.getPosition())
      if (distance > WORLD_SETTINGS.lootPickupRange) {
        return true
      }

      const item = drop.getItem()
      this.player!.addToInventory(item)
      this.dependencies.uiManager.showNotification(`Picked up ${item.name}`, 'success')
      drop.destroy()
      return false
    })

    if (this.environmentMode === 'region') {
      this.checkPoiProgress()
    } else {
      this.checkDungeonProgress()
    }
    this.handleInteractions()

    // Clean up dead enemies
    this.enemies.forEach((enemy, id) => {
      if (enemy.isDead()) {
        if (this.lockedEnemyId === id) {
          this.lockedEnemyId = null
        }
        this.handleEnemyDefeat(enemy, id)
        enemy.destroy()
        this.enemies.delete(id)
      }
    })
  }

  private getPlayerAttackTargets(): Enemy3D[] {
    if (!this.player) {
      return []
    }

    const lockedEnemy = this.getLockedEnemy()
    if (lockedEnemy) {
      const distance = Vector3.Distance(lockedEnemy.getPosition(), this.player.getPosition())
      if (distance < WORLD_SETTINGS.playerAttackRange) {
        return [lockedEnemy]
      }
    }

    return Array.from(this.enemies.values()).filter((enemy) => {
      const distance = Vector3.Distance(enemy.getMesh().position, this.player!.getMesh().position)
      return distance < WORLD_SETTINGS.playerAttackRange
    })
  }

  private getLockCandidates(): Array<{ id: string; enemy: Enemy3D; distance: number }> {
    if (!this.player) {
      return []
    }

    const facing = this.player.getFacingDirection().normalize()
    return Array.from(this.enemies.entries())
      .map(([id, enemy]) => {
        const toEnemy = enemy.getPosition().subtract(this.player!.getPosition())
        const distance = toEnemy.length()
        const alignment = Vector3.Dot(toEnemy.normalize(), facing)
        return { id, enemy, distance, alignment }
      })
      .filter((entry) => entry.distance <= ENEMY_SETTINGS.aggroRadius && entry.alignment >= 0.15)
      .sort((left, right) => left.distance - right.distance)
      .map(({ id, enemy, distance }) => ({ id, enemy, distance }))
  }

  private cycleLockTarget(): void {
    const candidates = this.getLockCandidates()
    if (candidates.length === 0) {
      this.lockedEnemyId = null
      this.dependencies.uiManager.showNotification('No target in front arc.', 'warning')
      return
    }

    const currentIndex = candidates.findIndex((candidate) => candidate.id === this.lockedEnemyId)
    const nextCandidate = candidates[(currentIndex + 1) % candidates.length]
    this.lockedEnemyId = nextCandidate.id
    this.dependencies.uiManager.showNotification(`Locked: ${nextCandidate.enemy.getData().name}`, 'info')
  }

  private validateLockTarget(): void {
    if (!this.lockedEnemyId || !this.player) {
      return
    }

    const enemy = this.enemies.get(this.lockedEnemyId)
    if (!enemy) {
      this.lockedEnemyId = null
      return
    }

    const distance = Vector3.Distance(enemy.getPosition(), this.player.getPosition())
    if (distance > ENEMY_SETTINGS.aggroRadius * 1.5) {
      this.lockedEnemyId = null
    }
  }

  private getLockedEnemy(): Enemy3D | null {
    if (!this.lockedEnemyId) {
      return null
    }

    return this.enemies.get(this.lockedEnemyId) ?? null
  }

  private getCombatStatusText(): string {
    const lockedEnemy = this.getLockedEnemy()
    if (!lockedEnemy) {
      return 'Free target'
    }

    return `Locked on ${lockedEnemy.getData().name}`
  }

  private handleInteractions(): void {
    if (!this.player || !this.input.wasKeyPressed('e') || this.interactionCooldown > 0) {
      return
    }

    if (this.environmentMode === 'dungeon') {
      this.handleDungeonInteraction()
      this.interactionCooldown = WORLD_SETTINGS.interactionCooldownSeconds
      return
    }

    const nearbyNpc = Array.from(this.npcs.values())
      .map((npc) => ({
        npc,
        distance: Vector3.Distance(npc.getPosition(), this.player!.getPosition()),
      }))
      .filter(({ distance }) => distance < WORLD_SETTINGS.interactionRange)
      .sort((left, right) => left.distance - right.distance)[0]

    if (!nearbyNpc) {
      if (this.handleTransitionInteraction()) {
        this.interactionCooldown = WORLD_SETTINGS.interactionCooldownSeconds
        return
      }

      if (this.handleDungeonEntryInteraction()) {
        this.interactionCooldown = WORLD_SETTINGS.interactionCooldownSeconds
        return
      }

      this.dependencies.uiManager.showNotification('No one nearby to talk to or route to travel', 'warning')
      this.interactionCooldown = WORLD_SETTINGS.interactionCooldownSeconds
      return
    }

    this.currentDialogueNpc = nearbyNpc.npc
    this.currentDialogueNodeId = this.selectDialogueStartNode(nearbyNpc.npc)
    nearbyNpc.npc.startConversation()
    void this.renderDialogueNode()
    this.interactionCooldown = WORLD_SETTINGS.interactionCooldownSeconds
  }

  private async renderDialogueNode(): Promise<void> {
    if (!this.currentDialogueNpc) {
      return
    }

    const node = this.currentDialogueNpc.getDialogueTree()[this.currentDialogueNodeId]
    if (!node) {
      this.closeDialogue()
      return
    }

    await this.dependencies.uiManager.showDialogue(
      {
        name: this.currentDialogueNpc.getName(),
        text: node.text,
        options: (node.options ?? []).map((option: DialogueOption) => ({ id: option.id, text: option.text })),
        portraitKey: this.currentDialogueNpc.getData().portraitKey,
      },
      (optionId) => this.handleDialogueChoice(optionId),
      () => this.closeDialogue(),
    )
  }

  private handleDialogueChoice(optionId: string): void {
    if (!this.currentDialogueNpc) {
      return
    }

    const node = this.currentDialogueNpc.getDialogueTree()[this.currentDialogueNodeId]
    const option = node?.options?.find((entry: DialogueOption) => entry.id === optionId)
    if (!option) {
      return
    }

    this.runDialogueActions(option.actions ?? [], this.currentDialogueNpc)

    if (option.next) {
      this.currentDialogueNodeId = option.next
      void this.renderDialogueNode()
      return
    }

    this.closeDialogue()
  }

  private closeDialogue(): void {
    if (this.currentDialogueNpc) {
      this.currentDialogueNpc.endConversation()
    }
    this.currentDialogueNpc = null
    this.currentDialogueNodeId = 'start'
    this.dependencies.uiManager.hideDialogue()
  }

  private selectDialogueStartNode(npc: NPC3D): string {
    const npcData = npc.getData()
    if (!npcData.conditionalStartNodes || npcData.conditionalStartNodes.length === 0) {
      return 'start'
    }

    for (const condition of npcData.conditionalStartNodes) {
      if (this.checkDialogueConditions(condition)) {
        return condition.nodeId
      }
    }

    return 'start'
  }

  private checkDialogueConditions(condition: any): boolean {
    // Check required world state tags (all must be present)
    if (condition.requiredWorldStateTags && condition.requiredWorldStateTags.length > 0) {
      if (!condition.requiredWorldStateTags.every((tag: string) => this.dependencies.regionProgression.hasWorldStateTag(tag))) {
        return false
      }
    }

    // Check blocked world state tags (none can be present)
    if (condition.blockedWorldStateTags && condition.blockedWorldStateTags.length > 0) {
      if (condition.blockedWorldStateTags.some((tag: string) => this.dependencies.regionProgression.hasWorldStateTag(tag))) {
        return false
      }
    }

    // Check required quest IDs (all must be completed)
    if (condition.requiredQuestIds && condition.requiredQuestIds.length > 0) {
      if (!condition.requiredQuestIds.every((questId: string) => this.dependencies.questJournal.hasCompletedQuest(questId))) {
        return false
      }
    }

    // Check active quest IDs (at least one must be active)
    if (condition.activeQuestIds && condition.activeQuestIds.length > 0) {
      if (!condition.activeQuestIds.some((questId: string) => this.dependencies.questJournal.hasActiveQuest(questId))) {
        return false
      }
    }

    // Check required item IDs (all must be in inventory)
    if (condition.requiredItemIds && condition.requiredItemIds.length > 0) {
      if (!this.player || !condition.requiredItemIds.every((itemId: string) => this.player!.hasItem(itemId))) {
        return false
      }
    }

    return true
  }

  private runDialogueActions(actions: string[], npc: NPC3D): void {
    if (!this.player) {
      return
    }

    actions.forEach((action) => {
      if (action === 'open_shop') {
        this.dependencies.uiManager.showNotification('Trading UI is not in yet, but the merchant takes note.', 'info')
        return
      }

      if (action === 'open_training') {
        this.dependencies.uiManager.showNotification('Training will arrive with the next combat pass.', 'info')
        return
      }

      if (action === 'start_quest_find_rift') {
        this.applyQuestResult(this.dependencies.questJournal.startQuest('quest_rift_rumor'))
        return
      }

      if (action.startsWith('startQuest:')) {
        this.applyQuestResult(this.dependencies.questJournal.startQuest(action.split(':')[1]))
        return
      }

      if (action.startsWith('talk:')) {
        this.applyQuestResult(this.dependencies.questJournal.onTalk(action.split(':')[1], this.player!))
        return
      }

      if (action.startsWith('setWorldState:')) {
        const tag = action.split(':')[1]
        if (tag) {
          this.dependencies.regionProgression.setWorldStateTag(tag)
        }
        return
      }

      if (action.startsWith('consumeItem:')) {
        const itemId = action.split(':')[1]
        if (itemId && this.player) {
          const removed = this.player.removeFromInventory(itemId)
          if (removed) {
            this.dependencies.uiManager.showNotification(`${removed.name} consumed`, 'success')
          }
        }
        return
      }

      this.applyQuestResult(this.dependencies.questJournal.onTalk(npc.getData().id, this.player!))
    })
  }

  private applyQuestResult(result: QuestEventResult): void {
    if (result.started) {
      this.dependencies.uiManager.showNotification(`Quest started: ${result.started}`, 'success')
    }

    result.completed?.forEach((quest) => {
      this.dependencies.uiManager.showNotification(`Quest complete: ${quest}`, 'success')
    })

    const unlockedRegions = this.dependencies.regionProgression.onQuestsCompleted(result.completedIds ?? [])
    this.announceUnlockedRegions(unlockedRegions)

    result.rewards?.forEach((reward) => {
      this.dependencies.uiManager.showNotification(`Reward gained: ${reward}`, 'info')
    })
  }

  private getActiveTransitionPoints(region: RegionData): RegionData['transitionPoints'] {
    const transitions = [...(region.transitionPoints ?? [])]

    if (region.stateVariants && region.stateVariants.length > 0) {
      region.stateVariants.forEach((variant) => {
        if (variant.requiredWorldStateTags.every((tag) => this.dependencies.regionProgression.hasWorldStateTag(tag))) {
          if (variant.additionalTransitionPoints && variant.additionalTransitionPoints.length > 0) {
            variant.additionalTransitionPoints.forEach((transition) => {
              if (!transitions.some((t) => t.poiId === transition.poiId)) {
                transitions.push(transition)
              }
            })
          }
        }
      })
    }

    return transitions
  }

  private spawnRegionEnemies(region: RegionData, startPos: { x: number; y: number }): void {
    if (region.spawnPoints?.length) {
      let spawnCount = 0
      region.spawnPoints.forEach((spawnPoint, zoneIndex) => {
        if (spawnCount >= WORLD_SETTINGS.enemySpawnLimit) {
          return
        }

        const enemyIds = (spawnPoint.enemyIds?.length ? spawnPoint.enemyIds : region.enemyPool).slice(0, WORLD_SETTINGS.enemySpawnLimit - spawnCount)
        enemyIds.forEach((enemyId, localIndex) => {
          const enemyData = this.dependencies.enemyManager.getEnemy(enemyId)
          if (!enemyData) {
            return
          }

          const angle = (Math.PI * 2 * localIndex) / Math.max(1, enemyIds.length)
          const radius = 8 + localIndex * 6
          const x = spawnPoint.position.x + Math.cos(angle) * radius
          const z = spawnPoint.position.y + Math.sin(angle) * radius
          const position = new Vector3(
            x,
            this.sampleTerrainHeight(x, z, region.biome, region.id) + 1,
            z,
          )

          const enemy = new Enemy3D(this.scene, enemyData, position)
          this.enemies.set(`${enemyData.id}_${zoneIndex}_${localIndex}`, enemy)
          spawnCount++
        })
      })
      return
    }

    region.enemyPool.slice(0, WORLD_SETTINGS.enemySpawnLimit).forEach((enemyId, index) => {
      const enemyData = this.dependencies.enemyManager.getEnemy(enemyId)
      if (!enemyData) {
        return
      }

      const angle = (Math.PI * 2 * index) / Math.max(1, region.enemyPool.length)
      const radius = WORLD_SETTINGS.enemySpawnBaseRadius + index * WORLD_SETTINGS.enemySpawnRadiusStep
      const x = startPos.x + Math.cos(angle) * radius
      const z = startPos.y + Math.sin(angle) * radius
      const position = new Vector3(
        x,
        this.sampleTerrainHeight(x, z, region.biome, region.id) + 1,
        z
      )

      const enemy = new Enemy3D(this.scene, enemyData, position)
      this.enemies.set(`${enemyData.id}_${index}`, enemy)
    })
  }

  private spawnRegionNpcs(region: RegionData): void {
    // Spawn base NPC pool
    region.npcPool.forEach((npcId) => {
      const npcData = this.dependencies.npcManager.getNpc(npcId)
      if (!npcData) {
        return
      }

      // Check if NPC has world state requirements
      if (npcData.requiredWorldStateTags && npcData.requiredWorldStateTags.length > 0) {
        if (!npcData.requiredWorldStateTags.every((tag) => this.dependencies.regionProgression.hasWorldStateTag(tag))) {
          return // Skip this NPC if requirements not met
        }
      }

      if (npcData.blockedWorldStateTags && npcData.blockedWorldStateTags.length > 0) {
        if (npcData.blockedWorldStateTags.some((tag) => this.dependencies.regionProgression.hasWorldStateTag(tag))) {
          return // Skip this NPC if blocked by state
        }
      }

      const npc = new NPC3D(
        this.scene,
        npcData,
        new Vector3(
          npcData.position.x,
          this.sampleTerrainHeight(npcData.position.x, npcData.position.y, region.biome, region.id) + 1,
          npcData.position.y,
        )
      )
      this.npcs.set(npcData.id, npc)
    })

    // Spawn NPCs from state variants
    if (region.stateVariants && region.stateVariants.length > 0) {
      region.stateVariants.forEach((variant) => {
        // Check if all required tags are present
        if (variant.requiredWorldStateTags.every((tag) => this.dependencies.regionProgression.hasWorldStateTag(tag))) {
          // Add variant NPCs
          if (variant.additionalNpcIds && variant.additionalNpcIds.length > 0) {
            variant.additionalNpcIds.forEach((npcId) => {
              const npcData = this.dependencies.npcManager.getNpc(npcId)
              if (!npcData) {
                return
              }

              const npc = new NPC3D(
                this.scene,
                npcData,
                new Vector3(
                  npcData.position.x,
                  this.sampleTerrainHeight(npcData.position.x, npcData.position.y, region.biome, region.id) + 1,
                  npcData.position.y,
                )
              )
              this.npcs.set(npcData.id, npc)
            })
          }

          // State variant transitions are handled separately in getActiveTransitionPoints()
        }
      })
    }
  }

  private handleEnemyDefeat(enemy: Enemy3D, enemyKey: string): void {
    if (!this.player) {
      return
    }

    this.player.addExperience(10)
    this.applyQuestResult(this.dependencies.questJournal.onEnemyKilled(enemy.getData().id, this.player))
    this.dependencies.uiManager.showNotification(`${enemy.getData().name} defeated`, 'success')

    enemy.getData().lootTable.forEach((drop) => {
      if (Math.random() > drop.chance) {
        return
      }

      const item = this.dependencies.itemManager.getItem(drop.itemId)
      if (!item) {
        return
      }

      const loot = new LootDrop3D(this.scene, item, enemy.getPosition().clone().add(new Vector3(0, 1.2, 0)))
      this.lootDrops.push(loot)
    })

    if (this.environmentMode === 'dungeon') {
      const encounterId = this.dungeonEncounterAssignments.get(enemyKey)
      if (encounterId) {
        const remaining = Math.max(0, (this.dungeonEncounterCounts.get(encounterId) ?? 1) - 1)
        this.dungeonEncounterCounts.set(encounterId, remaining)
        if (remaining === 0) {
          this.dungeonManager.markEncounterCleared(encounterId)
          this.dependencies.uiManager.showNotification(`Encounter cleared: ${encounterId.replace(/_/g, ' ')}`, 'success')

          const activeDungeon = this.dungeonManager.getActiveDungeon()
          if (activeDungeon?.completionEncounterId === encounterId) {
            this.dependencies.regionProgression.markDungeonCleared(activeDungeon.id)
            this.dependencies.regionProgression.markEncounterResolved('encounter_culvert_breach')
            this.dependencies.uiManager.showNotification('The Rift pressure drops. The sealed cache can now be reached.', 'success')
          }
        }
      }
    }

    const specialEncounter = this.specialEncounterEnemies.get(enemy.getData().id)
    if (specialEncounter && !this.dependencies.regionProgression.isEncounterResolved(specialEncounter.id)) {
      this.dependencies.regionProgression.markEncounterResolved(specialEncounter.id)
      this.dependencies.uiManager.showNotification(`Special encounter cleared: ${specialEncounter.title}`, 'success')
    }
  }

  private checkPoiProgress(): void {
    if (!this.player || !this.currentRegion) {
      return
    }

    this.currentRegion.pointsOfInterest.forEach((poi) => {
      if (this.visitedPoiIds.has(poi.id)) {
        return
      }

      const distance = Vector3.Distance(
        this.player!.getPosition(),
        new Vector3(poi.position.x, this.sampleTerrainHeight(poi.position.x, poi.position.y, this.currentRegion!.biome, this.currentRegion!.id), poi.position.y),
      )

      if (distance <= WORLD_SETTINGS.poiVisitRange) {
        this.visitedPoiIds.add(poi.id)
        this.dependencies.uiManager.showNotification(`Discovered ${poi.name}`, 'info')
        this.applyQuestResult(this.dependencies.questJournal.onVisit(poi.id, this.player!))
        const unlockedRegions = this.dependencies.regionProgression.onPoiDiscovered(poi.id)
        this.announceUnlockedRegions(unlockedRegions)
        this.triggerSpecialEncounter(poi.id)
      }
    })
  }

  private checkDungeonProgress(): void {
    if (!this.player) {
      return
    }

    this.dungeonManager.getInteractablesByActivation('auto').forEach((runtime) => {
      if (this.dungeonAutoVisitedIds.has(runtime.data.id)) {
        return
      }

      const distance = Vector3.Distance(this.player!.getPosition(), runtime.root.position)
      if (distance > WORLD_SETTINGS.poiVisitRange) {
        return
      }

      this.dungeonAutoVisitedIds.add(runtime.data.id)
      if (runtime.data.questVisitId) {
        this.applyQuestResult(this.dependencies.questJournal.onVisit(runtime.data.questVisitId, this.player!))
      }
      if (runtime.data.message) {
        this.dependencies.uiManager.showNotification(runtime.data.message, 'warning')
      }
    })
  }

  private createPoiMarkers(region: RegionData): void {
    const iconColors: Record<string, Color3> = {
      town: new Color3(0.56, 0.73, 0.86),
      dungeon: new Color3(0.62, 0.57, 0.75),
      camp: new Color3(0.94, 0.69, 0.34),
      fort: new Color3(0.82, 0.54, 0.36),
      road: new Color3(0.84, 0.82, 0.63),
      rift: new Color3(0.78, 0.29, 0.92),
    }

    region.pointsOfInterest.forEach((poi) => {
      const height = this.sampleTerrainHeight(poi.position.x, poi.position.y, region.biome, region.id)
      const root = new TransformNode(`poi_${poi.id}`, this.scene)
      root.position = new Vector3(poi.position.x, height + 2, poi.position.y)

      const pole = CreateCylinder(`poi_pole_${poi.id}`, { height: 6, diameter: 0.18 }, this.scene)
      pole.parent = root
      pole.position.y = 2.5
      const poleMat = new StandardMaterial(`poi_pole_mat_${poi.id}`, this.scene)
      poleMat.emissiveColor = new Color3(0.85, 0.9, 1)
      pole.material = poleMat

      const gem = CreatePolyhedron(`poi_gem_${poi.id}`, { type: 1, size: 1.3 }, this.scene)
      gem.parent = root
      gem.position.y = 5.3
      const gemMat = new StandardMaterial(`poi_gem_mat_${poi.id}`, this.scene)
      gemMat.emissiveColor = iconColors[poi.type] ?? new Color3(0.9, 0.9, 0.9)
      gem.material = gemMat

      this.propNodes.push(root)
      this.poiMarkers.push(pole, gem)
    })
  }

  private createRegionProps(region: RegionData): void {
    region.pointsOfInterest.forEach((poi) => {
      this.createPoiProp(region, poi.type, poi.position.x, poi.position.y)
    })

    // Spawn props from state variants
    if (region.stateVariants && region.stateVariants.length > 0) {
      region.stateVariants.forEach((variant) => {
        // Check if all required tags are present
        if (variant.requiredWorldStateTags.every((tag) => this.dependencies.regionProgression.hasWorldStateTag(tag))) {
          // Spawn additional props
          if (variant.additionalProps && variant.additionalProps.length > 0) {
            variant.additionalProps.forEach((prop) => {
              this.createStateVariantProp(region, prop)
            })
          }
        }
      })
    }

    if (region.biome === 'warfront') {
      this.createWarfrontScatter(region)
      return
    }

    for (let index = 0; index < 18; index++) {
      const x = 120 + ((index * 173) % 900)
      const z = 80 + ((index * 211) % 620)
      if (region.biome === 'forest') {
        this.createTree(region, x, z)
      } else {
        this.createRock(region, x, z)
      }
    }

    this.createVegetationScatter(region)
    this.createTerrainArtScatter(region)
    this.propNodes.forEach((node) => this.markNodeAsShadowReceiver(node))
  }

  private markNodeAsShadowReceiver(node: Node): void {
    if (node instanceof TransformNode) {
      node.getChildMeshes().forEach((mesh) => {
        mesh.receiveShadows = true
      })
      return
    }

    const maybeMesh = node as Mesh
    if (typeof maybeMesh.receiveShadows === 'boolean') {
      maybeMesh.receiveShadows = true
    }
  }

  private getPropMaterial(
    key: string,
    options: {
      diffuseColor?: Color3
      emissiveColor?: Color3
      texturePath?: string
      opacityPath?: string
      doubleSided?: boolean
      disableLighting?: boolean
    },
  ): StandardMaterial {
    const existing = this.propMaterialCache.get(key)
    if (existing) {
      return existing
    }

    const material = new StandardMaterial(`prop_cached_${key}`, this.scene)
    if (options.diffuseColor) {
      material.diffuseColor = options.diffuseColor.clone()
    }
    if (options.emissiveColor) {
      material.emissiveColor = options.emissiveColor.clone()
    }
    if (options.texturePath) {
      const texture = new Texture(assetPath(options.texturePath), this.scene)
      texture.anisotropicFilteringLevel = 8
      material.diffuseTexture = texture
      if (options.opacityPath) {
        const opacityTexture = new Texture(assetPath(options.opacityPath), this.scene)
        opacityTexture.hasAlpha = true
        opacityTexture.anisotropicFilteringLevel = 8
        material.opacityTexture = opacityTexture
        material.useAlphaFromDiffuseTexture = true
      }
    }
    material.backFaceCulling = !(options.doubleSided ?? false)
    material.disableLighting = options.disableLighting ?? false
    material.specularColor = Color3.Black()
    this.propMaterialCache.set(key, material)
    return material
  }

  public getShadowCasterMeshes(maxCount: number = 70): AbstractMesh[] {
    const unique = new Map<string, AbstractMesh>()

    const addMeshes = (meshes: AbstractMesh[]) => {
      meshes.forEach((mesh) => {
        if (!mesh || mesh.isDisposed()) {
          return
        }
        unique.set(mesh.uniqueId.toString(), mesh)
      })
    }

    const player = this.player
    if (player) {
      addMeshes(player.getShadowMeshes())
    }

    const priorityNpcIds = new Set([
      'captain_rennic',
      'scout_tavia',
      'camp_marshal_iona',
      'beren_thal',
      'torvin_hale',
      'larat_merchant',
      'crydee_guard',
    ])

    const npcEntries = Array.from(this.npcs.entries())
      .sort(([leftId], [rightId]) => {
        const leftPriority = priorityNpcIds.has(leftId) ? 0 : 1
        const rightPriority = priorityNpcIds.has(rightId) ? 0 : 1
        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority
        }
        return leftId.localeCompare(rightId)
      })

    npcEntries.forEach(([, npc]) => addMeshes(npc.getShadowMeshes()))

    const importantEnemyIds = new Set([
      'trench_raider',
      'ashbound_deserter',
      'siege_hound',
      'war_wretch',
    ])

    const enemyEntries = Array.from(this.enemies.values())
      .sort((left, right) => {
        const leftImportant = importantEnemyIds.has(left.getData().id) ? 0 : 1
        const rightImportant = importantEnemyIds.has(right.getData().id) ? 0 : 1
        if (leftImportant !== rightImportant) {
          return leftImportant - rightImportant
        }

        if (!player) {
          return 0
        }

        const leftDistance = Vector3.Distance(player.getPosition(), left.getPosition())
        const rightDistance = Vector3.Distance(player.getPosition(), right.getPosition())
        return leftDistance - rightDistance
      })

    enemyEntries.forEach((enemy) => addMeshes(enemy.getShadowMeshes()))
    return Array.from(unique.values()).slice(0, maxCount)
  }

  private createTerrainArtScatter(region: RegionData): void {
    const decalMaterialByBiome: Partial<Record<RegionData['biome'], StandardMaterial[]>> = {
      coast: [
        this.getPropMaterial('decal_meadow', {
          texturePath: 'art/decal-meadow.svg',
          opacityPath: 'art/decal-meadow.svg',
          emissiveColor: new Color3(0.08, 0.1, 0.06),
          doubleSided: true,
        }),
        this.getPropMaterial('decal_path', {
          texturePath: 'art/decal-path.svg',
          opacityPath: 'art/decal-path.svg',
          emissiveColor: new Color3(0.08, 0.07, 0.04),
          doubleSided: true,
        }),
      ],
      forest: [
        this.getPropMaterial('decal_meadow', {
          texturePath: 'art/decal-meadow.svg',
          opacityPath: 'art/decal-meadow.svg',
          emissiveColor: new Color3(0.08, 0.1, 0.06),
          doubleSided: true,
        }),
        this.getPropMaterial('decal_riftscar', {
          texturePath: 'art/decal-riftscar.svg',
          opacityPath: 'art/decal-riftscar.svg',
          emissiveColor: new Color3(0.12, 0.08, 0.14),
          doubleSided: true,
        }),
      ],
      wilderness: [
        this.getPropMaterial('decal_path', {
          texturePath: 'art/decal-path.svg',
          opacityPath: 'art/decal-path.svg',
          emissiveColor: new Color3(0.08, 0.07, 0.04),
          doubleSided: true,
        }),
        this.getPropMaterial('decal_meadow', {
          texturePath: 'art/decal-meadow.svg',
          opacityPath: 'art/decal-meadow.svg',
          emissiveColor: new Color3(0.08, 0.1, 0.06),
          doubleSided: true,
        }),
      ],
      warfront: [
        this.getPropMaterial('decal_ash', {
          texturePath: 'art/decal-ash.svg',
          opacityPath: 'art/decal-ash.svg',
          emissiveColor: new Color3(0.1, 0.08, 0.07),
          doubleSided: true,
        }),
        this.getPropMaterial('decal_path', {
          texturePath: 'art/decal-path.svg',
          opacityPath: 'art/decal-path.svg',
          emissiveColor: new Color3(0.08, 0.07, 0.04),
          doubleSided: true,
        }),
      ],
      ruins: [
        this.getPropMaterial('decal_ash', {
          texturePath: 'art/decal-ash.svg',
          opacityPath: 'art/decal-ash.svg',
          emissiveColor: new Color3(0.1, 0.08, 0.07),
          doubleSided: true,
        }),
      ],
    }

    const materials = decalMaterialByBiome[region.biome]
    if (!materials?.length) {
      return
    }

    const scatterCountByBiome: Partial<Record<RegionData['biome'], number>> = {
      coast: 70,
      forest: 90,
      wilderness: 80,
      warfront: 95,
      ruins: 48,
    }

    const worldMargin = 100
    const span = this.config.worldSize - worldMargin * 2
    const scatterCount = scatterCountByBiome[region.biome] ?? 60

    for (let index = 0; index < scatterCount; index++) {
      const x = worldMargin + (((index * 149) % span) + Math.sin(index * 0.41) * 38)
      const z = worldMargin + (((index * 197) % span) + Math.cos(index * 0.29) * 38)

      const nearPoi = region.pointsOfInterest.some((poi) => {
        const dx = poi.position.x - x
        const dz = poi.position.y - z
        return (dx * dx) + (dz * dz) < 1200
      })
      if (nearPoi) {
        continue
      }

      const y = this.sampleTerrainHeight(x, z, region.biome, region.id)
      const decal = CreatePlane(`terrain_art_${region.id}_${index}`, { width: 6.4, height: 6.4 }, this.scene)
      decal.position = new Vector3(x, y + 0.04, z)
      decal.rotation.x = Math.PI / 2
      decal.rotation.z = (index % 11) * 0.27
      decal.scaling = new Vector3(0.85 + (index % 5) * 0.22, 0.85 + (index % 7) * 0.18, 1)
      decal.material = materials[index % materials.length]
      decal.isPickable = false
      this.propNodes.push(decal)
    }
  }

  private createVegetationScatter(region: RegionData): void {
    if (region.biome === 'city') {
      return
    }

    const bushTexture = new Texture(assetPath('vegetation/bush.png'), this.scene)
    const treePairTexture = new Texture(assetPath('vegetation/twotrees.png'), this.scene)
    const treeLogTexture = new Texture(assetPath('vegetation/treesandlog.png'), this.scene)
    const rockTextureA = new Texture(assetPath('vegetation/rock1.png'), this.scene)
    const rockTextureB = new Texture(assetPath('vegetation/rock2.png'), this.scene)
    ;[bushTexture, treePairTexture, treeLogTexture, rockTextureA, rockTextureB].forEach((texture) => {
      texture.hasAlpha = true
      texture.anisotropicFilteringLevel = 8
    })

    const bushMaterial = new StandardMaterial(`veg_bush_mat_${region.id}`, this.scene)
    bushMaterial.diffuseTexture = bushTexture
    bushMaterial.opacityTexture = bushTexture
    bushMaterial.useAlphaFromDiffuseTexture = true
    bushMaterial.backFaceCulling = false
    bushMaterial.specularColor = Color3.Black()
    bushMaterial.emissiveColor = new Color3(0.17, 0.24, 0.16)

    const treePairMaterial = new StandardMaterial(`veg_treepair_mat_${region.id}`, this.scene)
    treePairMaterial.diffuseTexture = treePairTexture
    treePairMaterial.opacityTexture = treePairTexture
    treePairMaterial.useAlphaFromDiffuseTexture = true
    treePairMaterial.backFaceCulling = false
    treePairMaterial.specularColor = Color3.Black()
    treePairMaterial.emissiveColor = new Color3(0.15, 0.2, 0.13)

    const treeLogMaterial = new StandardMaterial(`veg_treelog_mat_${region.id}`, this.scene)
    treeLogMaterial.diffuseTexture = treeLogTexture
    treeLogMaterial.opacityTexture = treeLogTexture
    treeLogMaterial.useAlphaFromDiffuseTexture = true
    treeLogMaterial.backFaceCulling = false
    treeLogMaterial.specularColor = Color3.Black()
    treeLogMaterial.emissiveColor = new Color3(0.18, 0.22, 0.14)

    const rockDecalMaterialA = new StandardMaterial(`veg_rockdecal_a_${region.id}`, this.scene)
    rockDecalMaterialA.diffuseTexture = rockTextureA
    rockDecalMaterialA.opacityTexture = rockTextureA
    rockDecalMaterialA.useAlphaFromDiffuseTexture = true
    rockDecalMaterialA.backFaceCulling = false
    rockDecalMaterialA.specularColor = Color3.Black()

    const rockDecalMaterialB = new StandardMaterial(`veg_rockdecal_b_${region.id}`, this.scene)
    rockDecalMaterialB.diffuseTexture = rockTextureB
    rockDecalMaterialB.opacityTexture = rockTextureB
    rockDecalMaterialB.useAlphaFromDiffuseTexture = true
    rockDecalMaterialB.backFaceCulling = false
    rockDecalMaterialB.specularColor = Color3.Black()

    const spawnCountByBiome: Record<string, number> = {
      forest: 220,
      wilderness: 170,
      coast: 120,
      ruins: 100,
      warfront: 55,
    }

    const spawnCount = spawnCountByBiome[region.biome] ?? 120
    const worldMargin = 90
    const span = this.config.worldSize - worldMargin * 2

    for (let index = 0; index < spawnCount; index++) {
      const x = worldMargin + (((index * 137) % span) + Math.sin(index * 0.61) * 24)
      const z = worldMargin + (((index * 223) % span) + Math.cos(index * 0.49) * 24)

      const nearPoi = region.pointsOfInterest.some((poi) => {
        const dx = poi.position.x - x
        const dz = poi.position.y - z
        return (dx * dx) + (dz * dz) < 900
      })
      if (nearPoi) {
        continue
      }

      const y = this.sampleTerrainHeight(x, z, region.biome, region.id)
      const pick = index % 10
      const plane = CreatePlane(`veg_${region.id}_${index}`, { width: 2.8, height: 2.2 }, this.scene)
      plane.position = new Vector3(x, y + 1.05, z)
      plane.billboardMode = 2 // BILLBOARDMODE_Y
      plane.isPickable = false

      if (pick < 5) {
        plane.scaling = new Vector3(1.2 + (pick * 0.12), 1.05 + (pick * 0.08), 1)
        plane.material = bushMaterial
      } else if (pick < 8) {
        plane.scaling = new Vector3(1.8 + (pick * 0.1), 1.6 + (pick * 0.12), 1)
        plane.position.y += 0.6
        plane.material = treePairMaterial
      } else {
        plane.scaling = new Vector3(2 + (pick * 0.12), 1.9 + (pick * 0.14), 1)
        plane.position.y += 0.65
        plane.material = treeLogMaterial
      }

      this.propNodes.push(plane)
    }

    const clutterCountByBiome: Record<string, number> = {
      forest: 520,
      wilderness: 410,
      coast: 280,
      ruins: 240,
      warfront: 140,
    }

    const clutterCount = clutterCountByBiome[region.biome] ?? 220
    for (let index = 0; index < clutterCount; index++) {
      const x = worldMargin + (((index * 91) % span) + Math.sin(index * 0.43) * 32)
      const z = worldMargin + (((index * 173) % span) + Math.cos(index * 0.37) * 32)
      const y = this.sampleTerrainHeight(x, z, region.biome, region.id)
      const decal = CreatePlane(`veg_decal_${region.id}_${index}`, { width: 1.4, height: 1.4 }, this.scene)
      decal.position = new Vector3(x, y + 0.03, z)
      decal.rotation.x = Math.PI / 2
      decal.rotation.z = (index % 9) * 0.35
      const scale = 0.7 + ((index % 7) * 0.13)
      decal.scaling = new Vector3(scale, scale, 1)
      decal.isPickable = false
      decal.material = index % 2 === 0 ? rockDecalMaterialA : rockDecalMaterialB
      this.propNodes.push(decal)
    }
  }

  private createPoiProp(region: RegionData, type: string, x: number, z: number): void {
    if (type === 'town') {
      this.createBuilding(region, x, z)
      return
    }

    if (type === 'camp') {
      this.createCampfire(region, x, z)
      return
    }

    if (type === 'fort') {
      this.createFortification(region, x, z)
      return
    }

    if (type === 'road') {
      this.createMilestone(region, x, z)
      return
    }

    if (type === 'rift') {
      this.createRiftShard(region, x, z)
      return
    }

    this.createRuins(region, x, z)
  }

  private createStateVariantProp(region: RegionData, prop: any): void {
    const x = prop.position.x
    const z = prop.position.y
    const height = this.sampleTerrainHeight(x, z, region.biome, region.id)

    if (prop.kind === 'crate') {
      this.createCrate(region, x, z)
      return
    }

    if (prop.kind === 'signal') {
      this.createSignalCart(region, x, z)
      return
    }

    if (prop.kind === 'banner') {
      this.createBanner(region, x, z)
      return
    }

    if (prop.kind === 'brazier') {
      this.createBrazier(region, x, z)
      return
    }

    if (prop.kind === 'beacon') {
      this.createRelayBeacon(region, x, z)
      return
    }

    if (prop.kind === 'supplies') {
      this.createSuppliesCrates(region, x, z)
      return
    }
  }

  private createTree(region: RegionData, x: number, z: number): void {
    const root = new TransformNode(`tree_${x}_${z}`, this.scene)
    root.position = new Vector3(x, this.sampleTerrainHeight(x, z, region.biome, region.id), z)
    const trunk = CreateCylinder(`trunk_${x}_${z}`, { height: 4.5, diameterTop: 0.6, diameterBottom: 0.9 }, this.scene)
    trunk.parent = root
    trunk.position.y = 2.2
    const trunkMat = new StandardMaterial(`trunk_mat_${x}_${z}`, this.scene)
    trunkMat.emissiveColor = new Color3(0.32, 0.22, 0.15)
    trunk.material = trunkMat
    const canopy = CreatePolyhedron(`canopy_${x}_${z}`, { type: 1, size: 3.8 }, this.scene)
    canopy.parent = root
    canopy.position.y = 5.4
    const canopyMat = new StandardMaterial(`canopy_mat_${x}_${z}`, this.scene)
    canopyMat.emissiveColor = new Color3(0.2, 0.46, 0.22)
    canopy.material = canopyMat
    this.propNodes.push(root)
  }

  private createRock(region: RegionData, x: number, z: number): void {
    const rock = CreatePolyhedron(`rock_${x}_${z}`, { type: 2, size: 2.6 }, this.scene)
    rock.position = new Vector3(x, this.sampleTerrainHeight(x, z, region.biome, region.id) + 1.2, z)
    rock.scaling = new Vector3(1.2, 0.8, 1)
    const material = new StandardMaterial(`rock_mat_${x}_${z}`, this.scene)
    material.emissiveColor = new Color3(0.42, 0.42, 0.47)
    rock.material = material
    this.propNodes.push(rock)
  }

  private createBuilding(region: RegionData, x: number, z: number): void {
    const root = new TransformNode(`building_${x}_${z}`, this.scene)
    root.position = new Vector3(x, this.sampleTerrainHeight(x, z, region.biome, region.id), z)
    const base = CreateBox(`building_base_${x}_${z}`, { width: 10, depth: 8, height: 5 }, this.scene)
    base.parent = root
    base.position.y = 2.5
    const roof = CreateCylinder(`building_roof_${x}_${z}`, { diameterTop: 0, diameterBottom: 11, height: 4, tessellation: 4 }, this.scene)
    roof.parent = root
    roof.position.y = 6.5
    roof.rotation.y = Math.PI / 4
    const wallMat = new StandardMaterial(`building_wall_mat_${x}_${z}`, this.scene)
    wallMat.emissiveColor = new Color3(0.58, 0.61, 0.66)
    base.material = wallMat
    const roofMat = new StandardMaterial(`building_roof_mat_${x}_${z}`, this.scene)
    roofMat.emissiveColor = new Color3(0.4, 0.22, 0.18)
    roof.material = roofMat
    this.propNodes.push(root)
  }

  private createCampfire(region: RegionData, x: number, z: number): void {
    const root = new TransformNode(`camp_${x}_${z}`, this.scene)
    root.position = new Vector3(x, this.sampleTerrainHeight(x, z, region.biome, region.id), z)
    const fire = CreatePolyhedron(`camp_fire_${x}_${z}`, { type: 0, size: 1.4 }, this.scene)
    fire.parent = root
    fire.position.y = 1
    const fireMat = new StandardMaterial(`camp_fire_mat_${x}_${z}`, this.scene)
    fireMat.emissiveColor = new Color3(1, 0.57, 0.14)
    fire.material = fireMat
    this.propNodes.push(root)
  }

  private createRiftShard(region: RegionData, x: number, z: number): void {
    const root = new TransformNode(`rift_${x}_${z}`, this.scene)
    root.position = new Vector3(x, this.sampleTerrainHeight(x, z, region.biome, region.id), z)
    const shard = CreatePolyhedron(`rift_shard_${x}_${z}`, { type: 1, size: 4.5 }, this.scene)
    shard.parent = root
    shard.position.y = 4
    const mat = new StandardMaterial(`rift_mat_${x}_${z}`, this.scene)
    mat.emissiveColor = new Color3(0.72, 0.25, 0.9)
    shard.material = mat
    this.propNodes.push(root)
  }

  private createRuins(region: RegionData, x: number, z: number): void {
    const root = new TransformNode(`ruins_${x}_${z}`, this.scene)
    root.position = new Vector3(x, this.sampleTerrainHeight(x, z, region.biome, region.id), z)
    for (let index = 0; index < 3; index++) {
      const pillar = CreateBox(`ruin_pillar_${x}_${z}_${index}`, { width: 1.2, depth: 1.2, height: 4 + index }, this.scene)
      pillar.parent = root
      pillar.position = new Vector3(index * 1.8 - 1.8, 2 + index * 0.4, index - 1)
      const mat = new StandardMaterial(`ruin_mat_${x}_${z}_${index}`, this.scene)
      mat.emissiveColor = new Color3(0.46, 0.44, 0.48)
      pillar.material = mat
    }
    this.propNodes.push(root)
  }

  private createFortification(region: RegionData, x: number, z: number): void {
    const root = new TransformNode(`fort_${x}_${z}`, this.scene)
    root.position = new Vector3(x, this.sampleTerrainHeight(x, z, region.biome, region.id), z)
    for (let index = 0; index < 3; index++) {
      const wall = CreateBox(`fort_wall_${x}_${z}_${index}`, { width: 7, depth: 1.4, height: 2.4 }, this.scene)
      wall.parent = root
      wall.position = new Vector3(index * 6 - 6, 1.4, index === 1 ? -2 : 2)
      wall.rotation.y = index === 1 ? Math.PI / 2 : 0.16
      const wallMat = new StandardMaterial(`fort_wall_mat_${x}_${z}_${index}`, this.scene)
      wallMat.emissiveColor = new Color3(0.43, 0.31, 0.24)
      wall.material = wallMat
    }

    const banner = CreatePlane(`fort_banner_${x}_${z}`, { width: 2.4, height: 3.2 }, this.scene)
    banner.parent = root
    banner.position = new Vector3(0, 4.2, 0)
    banner.rotation.y = Math.PI / 6
    const bannerMat = new StandardMaterial(`fort_banner_mat_${x}_${z}`, this.scene)
    bannerMat.emissiveColor = new Color3(0.72, 0.18, 0.14)
    banner.material = bannerMat
    this.propNodes.push(root)
  }

  private createMilestone(region: RegionData, x: number, z: number): void {
    const root = new TransformNode(`road_${x}_${z}`, this.scene)
    root.position = new Vector3(x, this.sampleTerrainHeight(x, z, region.biome, region.id), z)
    const pillar = CreateBox(`road_pillar_${x}_${z}`, { width: 1.4, depth: 0.8, height: 3 }, this.scene)
    pillar.parent = root
    pillar.position.y = 1.5
    const marker = CreateSphere(`road_marker_${x}_${z}`, { diameter: 1.2 }, this.scene)
    marker.parent = root
    marker.position = new Vector3(0, 3.3, 0)
    const pillarMat = new StandardMaterial(`road_pillar_mat_${x}_${z}`, this.scene)
    pillarMat.emissiveColor = new Color3(0.56, 0.54, 0.5)
    pillar.material = pillarMat
    const markerMat = new StandardMaterial(`road_marker_mat_${x}_${z}`, this.scene)
    markerMat.emissiveColor = new Color3(0.82, 0.76, 0.52)
    marker.material = markerMat
    this.propNodes.push(root)
  }

  private createBarricade(region: RegionData, x: number, z: number, rotationY: number): void {
    const root = new TransformNode(`barricade_${x}_${z}`, this.scene)
    root.position = new Vector3(x, this.sampleTerrainHeight(x, z, region.biome, region.id), z)
    root.rotation.y = rotationY
    for (let index = 0; index < 4; index++) {
      const plank = CreateBox(`barricade_plank_${x}_${z}_${index}`, { width: 5, depth: 0.45, height: 0.35 }, this.scene)
      plank.parent = root
      plank.position = new Vector3(index * 1.2 - 1.8, 1 + index * 0.35, 0)
      plank.rotation.z = Math.PI / 5
      const plankMat = new StandardMaterial(`barricade_plank_mat_${x}_${z}_${index}`, this.scene)
      plankMat.emissiveColor = new Color3(0.31, 0.2, 0.14)
      plank.material = plankMat
    }
    this.propNodes.push(root)
  }

  private createBurntTree(region: RegionData, x: number, z: number): void {
    const root = new TransformNode(`burnt_tree_${x}_${z}`, this.scene)
    root.position = new Vector3(x, this.sampleTerrainHeight(x, z, region.biome, region.id), z)
    const trunk = CreateCylinder(`burnt_trunk_${x}_${z}`, { height: 5, diameterTop: 0.4, diameterBottom: 0.9 }, this.scene)
    trunk.parent = root
    trunk.position.y = 2.5
    trunk.rotation.z = 0.08
    const trunkMat = new StandardMaterial(`burnt_trunk_mat_${x}_${z}`, this.scene)
    trunkMat.emissiveColor = new Color3(0.16, 0.14, 0.14)
    trunk.material = trunkMat
    this.propNodes.push(root)
  }

  private createSignalTower(region: RegionData, x: number, z: number): void {
    const root = new TransformNode(`signal_tower_${x}_${z}`, this.scene)
    root.position = new Vector3(x, this.sampleTerrainHeight(x, z, region.biome, region.id), z)
    for (let index = 0; index < 4; index++) {
      const leg = CreateBox(`signal_leg_${x}_${z}_${index}`, { width: 0.4, depth: 0.4, height: 8 }, this.scene)
      leg.parent = root
      leg.position = new Vector3(index < 2 ? -1.8 : 1.8, 4, index % 2 === 0 ? -1.8 : 1.8)
      const legMat = new StandardMaterial(`signal_leg_mat_${x}_${z}_${index}`, this.scene)
      legMat.emissiveColor = new Color3(0.32, 0.24, 0.18)
      leg.material = legMat
    }
    const beacon = CreatePolyhedron(`signal_beacon_${x}_${z}`, { type: 0, size: 1.6 }, this.scene)
    beacon.parent = root
    beacon.position.y = 9.4
    const beaconMat = new StandardMaterial(`signal_beacon_mat_${x}_${z}`, this.scene)
    beaconMat.emissiveColor = new Color3(0.92, 0.44, 0.16)
    beacon.material = beaconMat
    this.propNodes.push(root)
  }

  private createCrate(region: RegionData, x: number, z: number): void {
    const crate = CreateBox(`crate_${x}_${z}`, { width: 1.2, depth: 1.2, height: 1.2 }, this.scene)
    crate.position = new Vector3(x, this.sampleTerrainHeight(x, z, region.biome, region.id) + 0.6, z)
    const crateMat = new StandardMaterial(`crate_mat_${x}_${z}`, this.scene)
    crateMat.emissiveColor = new Color3(0.65, 0.52, 0.36)
    crate.material = crateMat
    this.propNodes.push(crate)
  }

  private createSignalCart(region: RegionData, x: number, z: number): void {
    const root = new TransformNode(`signal_cart_${x}_${z}`, this.scene)
    root.position = new Vector3(x, this.sampleTerrainHeight(x, z, region.biome, region.id), z)
    const cart = CreateBox(`cart_body_${x}_${z}`, { width: 2.4, depth: 1.5, height: 0.85 }, this.scene)
    cart.parent = root
    cart.position.y = 0.92
    const cartMat = this.getPropMaterial('signal_cart_body', {
      diffuseColor: new Color3(0.34, 0.24, 0.16),
      emissiveColor: new Color3(0.12, 0.08, 0.04),
    })
    cart.material = cartMat

    ;[
      new Vector3(-0.96, 0.42, -0.82),
      new Vector3(-0.96, 0.42, 0.82),
      new Vector3(0.96, 0.42, -0.82),
      new Vector3(0.96, 0.42, 0.82),
    ].forEach((offset, index) => {
      const wheel = CreateCylinder(`signal_cart_wheel_${x}_${z}_${index}`, { height: 0.16, diameter: 0.84, tessellation: 16 }, this.scene)
      wheel.parent = root
      wheel.position = offset
      wheel.rotation.z = Math.PI / 2
      wheel.material = this.getPropMaterial('signal_cart_wheel', {
        diffuseColor: new Color3(0.2, 0.15, 0.1),
        emissiveColor: new Color3(0.05, 0.03, 0.02),
      })
    })

    const mast = CreateCylinder(`signal_cart_mast_${x}_${z}`, { height: 3.4, diameter: 0.12 }, this.scene)
    mast.parent = root
    mast.position = new Vector3(1.05, 1.9, 0)
    mast.material = this.getPropMaterial('signal_cart_mast', {
      diffuseColor: new Color3(0.28, 0.2, 0.12),
      emissiveColor: new Color3(0.08, 0.05, 0.02),
    })

    const pennant = CreatePlane(`cart_flag_${x}_${z}`, { width: 1.05, height: 1.55 }, this.scene)
    pennant.parent = root
    pennant.position = new Vector3(1.48, 2.45, 0)
    pennant.rotation.y = -0.12
    pennant.material = this.getPropMaterial('signal_cart_pennant', {
      texturePath: 'icons/quest.svg',
      emissiveColor: new Color3(0.3, 0.2, 0.12),
      doubleSided: true,
    })

    const lantern = CreateSphere(`signal_cart_lantern_${x}_${z}`, { diameter: 0.36 }, this.scene)
    lantern.parent = root
    lantern.position = new Vector3(1.08, 3.35, 0)
    lantern.material = this.getPropMaterial('signal_cart_lantern', {
      diffuseColor: new Color3(0.9, 0.74, 0.28),
      emissiveColor: new Color3(0.32, 0.22, 0.06),
      disableLighting: true,
    })
    this.propNodes.push(root)
  }

  private createBanner(region: RegionData, x: number, z: number): void {
    const root = new TransformNode(`banner_root_${x}_${z}`, this.scene)
    root.position = new Vector3(x, this.sampleTerrainHeight(x, z, region.biome, region.id), z)

    const pole = CreateCylinder(`banner_pole_${x}_${z}`, { height: 4.8, diameter: 0.14 }, this.scene)
    pole.parent = root
    pole.position.y = 2.4
    pole.material = this.getPropMaterial('banner_pole', {
      diffuseColor: new Color3(0.28, 0.2, 0.12),
      emissiveColor: new Color3(0.08, 0.05, 0.02),
    })

    const crossbar = CreateBox(`banner_crossbar_${x}_${z}`, { width: 1.7, depth: 0.1, height: 0.1 }, this.scene)
    crossbar.parent = root
    crossbar.position = new Vector3(0.72, 4.2, 0)
    crossbar.material = pole.material

    const cloth = CreatePlane(`banner_cloth_${x}_${z}`, { width: 1.25, height: 2.1 }, this.scene)
    cloth.parent = root
    cloth.position = new Vector3(0.7, 3.05, 0)
    cloth.rotation.y = -0.05
    cloth.material = this.getPropMaterial('banner_cloth', {
      texturePath: 'art/rift-lines.svg',
      emissiveColor: new Color3(0.18, 0.08, 0.06),
      doubleSided: true,
    })

    const emblem = CreatePlane(`banner_emblem_${x}_${z}`, { width: 0.62, height: 0.62 }, this.scene)
    emblem.parent = root
    emblem.position = new Vector3(0.7, 3.05, -0.02)
    emblem.material = this.getPropMaterial('banner_emblem', {
      texturePath: 'icons/quest.svg',
      emissiveColor: new Color3(0.22, 0.16, 0.08),
      doubleSided: true,
    })

    this.propNodes.push(root)
  }

  private createBrazier(region: RegionData, x: number, z: number): void {
    const root = new TransformNode(`brazier_${x}_${z}`, this.scene)
    root.position = new Vector3(x, this.sampleTerrainHeight(x, z, region.biome, region.id), z)
    const brazier = CreateCylinder(`brazier_vessel_${x}_${z}`, { height: 1.2, diameterTop: 1.4, diameterBottom: 1.8 }, this.scene)
    brazier.parent = root
    brazier.position.y = 0.8
    ;[-0.48, 0.48].forEach((xOffset, index) => {
      const leg = CreateCylinder(`brazier_leg_${x}_${z}_${index}`, { height: 1.3, diameterTop: 0.08, diameterBottom: 0.12 }, this.scene)
      leg.parent = root
      leg.position = new Vector3(xOffset, 0.5, index === 0 ? -0.34 : 0.34)
      leg.material = this.getPropMaterial('brazier_leg', {
        diffuseColor: new Color3(0.22, 0.18, 0.14),
        emissiveColor: new Color3(0.06, 0.04, 0.03),
      })
    })
    const flame = CreatePolyhedron(`brazier_flame_${x}_${z}`, { type: 0, size: 1 }, this.scene)
    flame.parent = root
    flame.position.y = 2.2
    const brazierMat = this.getPropMaterial('brazier_bowl', {
      diffuseColor: new Color3(0.36, 0.24, 0.18),
      emissiveColor: new Color3(0.09, 0.05, 0.03),
    })
    brazier.material = brazierMat
    const flameMat = this.getPropMaterial('brazier_flame', {
      diffuseColor: new Color3(1, 0.64, 0.18),
      emissiveColor: new Color3(0.34, 0.16, 0.04),
      disableLighting: true,
    })
    flame.material = flameMat
    this.propNodes.push(root)
    this.environmentEffects.push(createCampfireEffect(this.scene, root.position.add(new Vector3(0, 1.2, 0))))
  }

  private createRelayBeacon(region: RegionData, x: number, z: number): void {
    const root = new TransformNode(`relay_beacon_${x}_${z}`, this.scene)
    root.position = new Vector3(x, this.sampleTerrainHeight(x, z, region.biome, region.id), z)
    const post = CreateCylinder(`beacon_post_${x}_${z}`, { height: 6, diameterTop: 0.4, diameterBottom: 0.6 }, this.scene)
    post.parent = root
    post.position.y = 3
    const beacon = CreateSphere(`beacon_light_${x}_${z}`, { diameter: 1.4 }, this.scene)
    beacon.parent = root
    beacon.position.y = 6.4
    ;[
      new Vector3(-0.6, 1.3, -0.6),
      new Vector3(0.6, 1.3, -0.6),
      new Vector3(0, 1.3, 0.8),
    ].forEach((offset, index) => {
      const brace = CreateCylinder(`beacon_brace_${x}_${z}_${index}`, { height: 3.4, diameterTop: 0.08, diameterBottom: 0.12 }, this.scene)
      brace.parent = root
      brace.position = offset
      brace.rotation.x = index === 2 ? 0.3 : -0.3
      brace.rotation.z = index === 1 ? -0.34 : 0.34
      brace.material = this.getPropMaterial('beacon_brace', {
        diffuseColor: new Color3(0.26, 0.2, 0.14),
        emissiveColor: new Color3(0.06, 0.04, 0.02),
      })
    })
    const postMat = this.getPropMaterial('beacon_post', {
      diffuseColor: new Color3(0.42, 0.36, 0.28),
      emissiveColor: new Color3(0.08, 0.07, 0.04),
    })
    post.material = postMat
    const beaconMat = this.getPropMaterial('beacon_light', {
      diffuseColor: new Color3(0.95, 0.85, 0.3),
      emissiveColor: new Color3(0.36, 0.28, 0.08),
      disableLighting: true,
    })
    beacon.material = beaconMat

    const pennant = CreatePlane(`beacon_pennant_${x}_${z}`, { width: 0.85, height: 1.2 }, this.scene)
    pennant.parent = root
    pennant.position = new Vector3(0.54, 4.7, 0)
    pennant.rotation.y = 0.2
    pennant.material = this.getPropMaterial('beacon_pennant', {
      texturePath: 'icons/poi-town.svg',
      emissiveColor: new Color3(0.18, 0.14, 0.08),
      doubleSided: true,
    })
    this.propNodes.push(root)
  }

  private createSuppliesCrates(region: RegionData, x: number, z: number): void {
    const root = new TransformNode(`supplies_${x}_${z}`, this.scene)
    root.position = new Vector3(x, this.sampleTerrainHeight(x, z, region.biome, region.id), z)
    for (let i = 0; i < 3; i++) {
      const crate = CreateBox(`supply_crate_${x}_${z}_${i}`, { width: 1.4, depth: 1.4, height: 1.2 }, this.scene)
      crate.parent = root
      crate.position = new Vector3(i * 1.6 - 1.6, 0.6 + i * 0.1, 0)
      const crateMat = new StandardMaterial(`supply_mat_${x}_${z}_${i}`, this.scene)
      crateMat.emissiveColor = new Color3(0.6, 0.48, 0.32)
      crate.material = crateMat
    }

    const tarp = CreatePlane(`supplies_tarp_${x}_${z}`, { width: 3.8, height: 1.4 }, this.scene)
    tarp.parent = root
    tarp.position = new Vector3(0, 1.72, 0)
    tarp.rotation.x = Math.PI / 2
    tarp.material = this.getPropMaterial('supplies_tarp', {
      texturePath: 'art/rift-noise.svg',
      emissiveColor: new Color3(0.07, 0.08, 0.12),
      doubleSided: true,
    })

    this.propNodes.push(root)
  }

  private createWarfrontScatter(region: RegionData): void {
    const barricades = [
      { x: 230, z: 248, rotationY: 0.12 },
      { x: 420, z: 254, rotationY: -0.08 },
      { x: 610, z: 340, rotationY: 0.22 },
      { x: 820, z: 372, rotationY: -0.16 },
    ]
    barricades.forEach((barricade) => this.createBarricade(region, barricade.x, barricade.z, barricade.rotationY))

    ;[
      { x: 340, z: 310 },
      { x: 540, z: 280 },
      { x: 710, z: 420 },
      { x: 950, z: 330 },
    ].forEach((tree) => this.createBurntTree(region, tree.x, tree.z))

    this.createSignalTower(region, 620, 180)
    this.createRock(region, 760, 390)
    this.createRock(region, 910, 420)
  }

  private handleTransitionInteraction(): boolean {
    if (!this.player || !this.currentRegion) {
      return false
    }

    const transitions = this.getActiveTransitionPoints(this.currentRegion)
    if (!transitions?.length) {
      return false
    }

    const nearbyTransition = transitions
      .map((transition) => ({
        transition,
        poi: this.currentRegion!.pointsOfInterest.find((poi) => poi.id === transition.poiId),
      }))
      .filter((entry): entry is { transition: RegionTransition; poi: RegionData['pointsOfInterest'][number] } => Boolean(entry.poi))
      .map((entry) => ({
        ...entry,
        distance: Vector3.Distance(
          this.player!.getPosition(),
          new Vector3(
            entry.poi.position.x,
            this.sampleTerrainHeight(entry.poi.position.x, entry.poi.position.y, this.currentRegion!.biome, this.currentRegion!.id),
            entry.poi.position.y,
          ),
        ),
      }))
      .filter((entry) => entry.distance < WORLD_SETTINGS.interactionRange)
      .sort((left, right) => left.distance - right.distance)[0]

    if (!nearbyTransition) {
      return false
    }

    if (!this.dependencies.regionProgression.isRegionUnlocked(nearbyTransition.transition.toRegionId)) {
      this.dependencies.uiManager.showNotification(
        this.dependencies.regionProgression.getUnlockHint(nearbyTransition.transition.toRegionId),
        'warning',
      )
      return true
    }

    this.dependencies.uiManager.showNotification(nearbyTransition.transition.description, 'info')
    void this.dependencies.onTravelToRegion(nearbyTransition.transition.toRegionId)
    return true
  }

  private handleDungeonEntryInteraction(): boolean {
    if (!this.player || !this.currentRegion) {
      return false
    }

    const nearbyPoi = this.currentRegion.pointsOfInterest
      .map((poi) => ({
        poi,
        dungeon: this.dependencies.dungeonContentManager.getByEntry(this.currentRegion!.id, poi.id),
      }))
      .filter((entry): entry is { poi: RegionData['pointsOfInterest'][number]; dungeon: DungeonData } => Boolean(entry.dungeon))
      .map((entry) => ({
        ...entry,
        distance: Vector3.Distance(
          this.player!.getPosition(),
          new Vector3(
            entry.poi.position.x,
            this.sampleTerrainHeight(entry.poi.position.x, entry.poi.position.y, this.currentRegion!.biome, this.currentRegion!.id),
            entry.poi.position.y,
          ),
        ),
      }))
      .filter((entry) => entry.distance < WORLD_SETTINGS.interactionRange)
      .sort((left, right) => left.distance - right.distance)[0]

    if (!nearbyPoi) {
      return false
    }

    void this.enterDungeon(nearbyPoi.dungeon)
    return true
  }

  private handleDungeonInteraction(): void {
    if (!this.player) {
      return
    }

    const interactable = this.dungeonManager.getNearestInteractable(this.player.getPosition(), WORLD_SETTINGS.interactionRange, 'interact')
    if (!interactable) {
      this.dependencies.uiManager.showNotification('Only the dripping stone answers you here.', 'warning')
      return
    }

    if (interactable.data.requiresEncounterId && !this.dungeonManager.isEncounterCleared(interactable.data.requiresEncounterId)) {
      this.dependencies.uiManager.showNotification('The cache is still pinned behind the corruption. Clear the chamber first.', 'warning')
      return
    }

    if (interactable.data.kind === 'exit') {
      if (interactable.data.message) {
        this.dependencies.uiManager.showNotification(interactable.data.message, 'info')
      }
      void this.exitDungeon()
      return
    }

    if (interactable.data.kind === 'cache') {
      this.resolveDungeonCache(interactable.data)
    }
  }

  private announceUnlockedRegions(unlockedRegions: RegionData[]): void {
    unlockedRegions.forEach((region) => {
      this.dependencies.uiManager.showNotification(`New route opened: ${region.name}`, 'success')
    })
  }

  private triggerSpecialEncounter(poiId: string): void {
    if (!this.currentRegion?.specialEncounters?.length) {
      return
    }

    const encounter = this.currentRegion.specialEncounters.find((entry) => entry.poiId === poiId)
    if (!encounter || this.dependencies.regionProgression.isEncounterResolved(encounter.id)) {
      return
    }

    if (encounter.dungeonId) {
      this.dependencies.uiManager.showNotification(`${encounter.title}: ${encounter.description}`, 'warning')
      return
    }

    if (!encounter.enemyId) {
      return
    }

    const enemyData = this.dependencies.enemyManager.getEnemy(encounter.enemyId)
    const poi = this.currentRegion.pointsOfInterest.find((entry) => entry.id === poiId)
    if (!enemyData || !poi) {
      return
    }

    const spawnX = poi.position.x + (encounter.spawnOffset?.x ?? 10)
    const spawnZ = poi.position.y + (encounter.spawnOffset?.y ?? -6)
    const spawnPosition = new Vector3(
      spawnX,
      this.sampleTerrainHeight(spawnX, spawnZ, this.currentRegion.biome, this.currentRegion.id) + 1,
      spawnZ,
    )
    const key = `${encounter.id}_${enemyData.id}`
    if (this.enemies.has(key)) {
      return
    }

    const enemy = new Enemy3D(this.scene, enemyData, spawnPosition)
    this.enemies.set(key, enemy)
    this.specialEncounterEnemies.set(enemyData.id, encounter)
    this.dependencies.uiManager.showNotification(`${encounter.title}: ${encounter.description}`, 'warning')
  }

  private async enterDungeon(dungeon: DungeonData): Promise<void> {
    if (!this.player || this.environmentMode === 'dungeon') {
      return
    }

    if (dungeon.questId) {
      this.applyQuestResult(this.dependencies.questJournal.startQuest(dungeon.questId))
    }

    this.environmentMode = 'dungeon'
    this.dungeonAutoVisitedIds.clear()
    this.clearWorld(true)
    this.dungeonManager.generateDungeon(dungeon)

    if (!this.dependencies.regionProgression.isDungeonCleared(dungeon.id)) {
      this.spawnDungeonEnemies(dungeon)
    } else {
      dungeon.encounters.forEach((encounter) => this.dungeonManager.markEncounterCleared(encounter.id))
    }

    if (this.dependencies.regionProgression.hasClaimedDungeonReward(dungeon.id)) {
      dungeon.interactables
        .filter((interactable) => interactable.oneTime && interactable.grantsItemId)
        .forEach((interactable) => this.dungeonManager.markInteractableResolved(interactable.id))
    }

    this.player.setPosition(this.dungeonManager.getSpawnPosition())
    this.dependencies.uiManager.showNotification(`Entered ${dungeon.name}`, 'warning')
  }

  private async exitDungeon(): Promise<void> {
    const dungeon = this.dungeonManager.getActiveDungeon()
    if (!dungeon || !this.currentRegion) {
      return
    }

    const poi = this.currentRegion.pointsOfInterest.find((entry) => entry.id === dungeon.entryPoiId)
    const returnPosition = poi
      ? {
          x: poi.position.x + (dungeon.returnOffset?.x ?? -14),
          y: poi.position.y + (dungeon.returnOffset?.y ?? 8),
        }
      : undefined

    await this.generateWorld(this.currentRegion, returnPosition)
    this.dependencies.uiManager.showNotification(`Returned to ${this.currentRegion.name}`, 'info')
  }

  private spawnDungeonEnemies(dungeon: DungeonData): void {
    this.dungeonEncounterAssignments.clear()
    this.dungeonEncounterCounts.clear()

    this.dungeonManager.getEnemySpawnDefinitions().forEach((spawn) => {
      const enemyData = this.dependencies.enemyManager.getEnemy(spawn.enemyId)
      if (!enemyData) {
        return
      }

      const enemy = new Enemy3D(this.scene, enemyData, spawn.position)
      const key = `${spawn.encounterId}_${spawn.id}`
      this.enemies.set(key, enemy)
      this.dungeonEncounterAssignments.set(key, spawn.encounterId)
      this.dungeonEncounterCounts.set(spawn.encounterId, (this.dungeonEncounterCounts.get(spawn.encounterId) ?? 0) + 1)
    })
  }

  private resolveDungeonCache(interactable: DungeonInteractableData): void {
    const dungeon = this.dungeonManager.getActiveDungeon()
    if (!dungeon || !this.player) {
      return
    }

    if (interactable.oneTime && this.dependencies.regionProgression.hasClaimedDungeonReward(dungeon.id)) {
      this.dependencies.uiManager.showNotification('The cache is already empty.', 'info')
      return
    }

    if (interactable.grantsItemId) {
      const item = this.dependencies.itemManager.getItem(interactable.grantsItemId)
      if (item) {
        this.player.addToInventory(item)
        this.dependencies.uiManager.showNotification(`Recovered ${item.name}`, 'success')
      }
    }

    if (interactable.questVisitId) {
      this.applyQuestResult(this.dependencies.questJournal.onVisit(interactable.questVisitId, this.player))
    }

    if (interactable.message) {
      this.dependencies.uiManager.showNotification(interactable.message, 'info')
    }

    this.dependencies.regionProgression.markDungeonRewardClaimed(dungeon.id)
    this.dungeonManager.markInteractableResolved(interactable.id)
    this.dependencies.uiManager.showNotification('The breach falls silent for the first time in days.', 'success')
  }

  private projectToScreen(position: Vector3): { x: number; y: number } {
    const engine = this.scene.getEngine()
    const width = engine.getRenderWidth()
    const height = engine.getRenderHeight()
    const viewport = this.scene.activeCamera?.viewport.toGlobal(width, height) ?? new Viewport(0, 0, width, height)
    const projected = Vector3.Project(position, Matrix.Identity(), this.scene.getTransformMatrix(), viewport)
    return { x: projected.x, y: projected.y }
  }

  public getPlayer(): Player3D | null {
    return this.player
  }

  public getCharacterController(): Player3D | null {
    return this.player
  }

  public spawnEnemy(enemy: Enemy3D): void {
    this.enemies.set(enemy.getData().id, enemy)
  }

  public spawnNPC(npc: NPC3D): void {
    this.npcs.set(npc.getData().id, npc)
  }

  public getEnemies(): Enemy3D[] {
    return Array.from(this.enemies.values())
  }

  public getNPCs(): NPC3D[] {
    return Array.from(this.npcs.values())
  }

  public getInputManager(): InputManager {
    return this.input
  }

  public getCameraController(): CameraController {
    return this.camera
  }

  private async loadRegionEnvironment(region: RegionData): Promise<void> {
    const envConfig = getRegionEnvironment(region.id)
    if (!envConfig) {
      return
    }

    // Preload building models
    const buildingFiles = [...new Set(envConfig.buildings.map((b) => b.model))]
    const propModelFiles = [...new Set(
      envConfig.props
        .map((prop) => PROP_MODEL_MAP[prop.type])
        .filter((file): file is string => Boolean(file)),
    )]
    await preloadBuildingModels(this.scene, [...buildingFiles, ...propModelFiles])

    // Place buildings
    for (const building of envConfig.buildings) {
      const instance = await placeBuilding(
        this.scene,
        {
          model: building.model,
          position: new Vector3(
            building.x,
            this.sampleTerrainHeight(building.x, building.z, region.biome, region.id),
            building.z,
          ),
          rotation: building.rotation ? new Vector3(0, building.rotation, 0) : undefined,
          scale: building.scale,
        },
        building.id,
      )

      if (instance) {
        this.environmentNodes.push(instance)
      }
    }

    // Create props from config
    for (const prop of envConfig.props) {
      const propPosition = new Vector3(
        prop.x,
        this.sampleTerrainHeight(prop.x, prop.z, region.biome, region.id),
        prop.z,
      )

      const propModel = PROP_MODEL_MAP[prop.type]
      if (propModel) {
        const modelNode = await placeBuilding(
          this.scene,
          {
            model: propModel,
            position: propPosition,
            rotation: prop.rotation ? new Vector3(0, prop.rotation, 0) : undefined,
            scale: prop.scale ?? PROP_MODEL_SCALE[prop.type] ?? 1,
          },
          `prop_${prop.id}`,
        )

        if (modelNode) {
          this.environmentNodes.push(modelNode)
          continue
        }
      }

      // Props are created using simple geometric placeholders for now
      // In the future, these would load from models
      let propNode: TransformNode | null = null
      let emitFireEffect = false
      let fireHeight = 1.2

      if (prop.type === 'crate') {
        propNode = new TransformNode(`prop_${prop.id}`, this.scene)
        const mesh = CreateBox(`crate_${prop.id}`, { width: 1, depth: 1, height: 1 }, this.scene)
        mesh.parent = propNode
        const mat = new StandardMaterial(`prop_mat_${prop.id}`, this.scene)
        mat.emissiveColor = new Color3(0.65, 0.52, 0.36)
        mesh.material = mat
      } else if (prop.type === 'barrel') {
        propNode = new TransformNode(`prop_${prop.id}`, this.scene)
        const mesh = CreateCylinder(`barrel_${prop.id}`, { height: 1.4, diameter: 0.8 }, this.scene)
        mesh.parent = propNode
        const mat = new StandardMaterial(`prop_mat_${prop.id}`, this.scene)
        mat.emissiveColor = new Color3(0.5, 0.3, 0.2)
        mesh.material = mat
      } else if (prop.type === 'wagon') {
        propNode = new TransformNode(`prop_${prop.id}`, this.scene)

        const body = CreateBox(`wagon_body_${prop.id}`, { width: 2.8, depth: 1.6, height: 0.7 }, this.scene)
        body.parent = propNode
        body.position.y = 0.9
        const bodyMat = new StandardMaterial(`wagon_body_mat_${prop.id}`, this.scene)
        bodyMat.diffuseColor = new Color3(0.36, 0.24, 0.14)
        bodyMat.emissiveColor = new Color3(0.18, 0.11, 0.05)
        body.material = bodyMat

        const canopy = CreateBox(`wagon_canopy_${prop.id}`, { width: 2.4, depth: 1.2, height: 0.18 }, this.scene)
        canopy.parent = propNode
        canopy.position.y = 1.7
        const canopyMat = new StandardMaterial(`wagon_canopy_mat_${prop.id}`, this.scene)
        canopyMat.diffuseColor = new Color3(0.46, 0.42, 0.34)
        canopyMat.emissiveColor = new Color3(0.12, 0.1, 0.08)
        canopy.material = canopyMat

        ;[
          new Vector3(-1.05, 0.45, -0.85),
          new Vector3(-1.05, 0.45, 0.85),
          new Vector3(1.05, 0.45, -0.85),
          new Vector3(1.05, 0.45, 0.85),
        ].forEach((offset, index) => {
          const wheel = CreateCylinder(`wagon_wheel_${prop.id}_${index}`, { height: 0.18, diameter: 0.95, tessellation: 16 }, this.scene)
          wheel.parent = propNode
          wheel.position = offset
          wheel.rotation.z = Math.PI / 2
          const wheelMat = new StandardMaterial(`wagon_wheel_mat_${prop.id}_${index}`, this.scene)
          wheelMat.diffuseColor = new Color3(0.2, 0.14, 0.08)
          wheelMat.emissiveColor = new Color3(0.08, 0.06, 0.03)
          wheel.material = wheelMat
        })
      } else if (prop.type === 'torch' || prop.type === 'brazier') {
        propNode = new TransformNode(`prop_${prop.id}`, this.scene)
        const pole = CreateCylinder(`torch_pole_${prop.id}`, { height: 1.8, diameter: 0.12 }, this.scene)
        pole.parent = propNode
        pole.position.y = 0.9
        const poleMat = this.getPropMaterial('torch_pole', {
          diffuseColor: new Color3(0.22, 0.15, 0.08),
          emissiveColor: new Color3(0.08, 0.05, 0.02),
        })
        pole.material = poleMat

        const bracket = CreateBox(`torch_bracket_${prop.id}`, { width: 0.48, depth: 0.1, height: 0.1 }, this.scene)
        bracket.parent = propNode
        bracket.position = new Vector3(0.2, 1.55, 0)
        bracket.material = poleMat

        const flame = CreatePolyhedron(`flame_${prop.id}`, { type: 0, size: 0.45 }, this.scene)
        flame.parent = propNode
        flame.position.y = 1.8
        const flameMat = this.getPropMaterial('torch_flame', {
          diffuseColor: new Color3(1, 0.55, 0.12),
          emissiveColor: new Color3(0.34, 0.16, 0.04),
          disableLighting: true,
        })
        flame.material = flameMat
        emitFireEffect = true
        fireHeight = prop.id.includes('fire') || prop.id.includes('camp') || prop.id.includes('brazier') ? 0.2 : 1.8
      } else if (prop.type === 'fence') {
        propNode = new TransformNode(`prop_${prop.id}`, this.scene)
        for (let i = 0; i < 3; i++) {
          const plank = CreateBox(`fence_${prop.id}_${i}`, { width: 2, depth: 0.2, height: 1 }, this.scene)
          plank.parent = propNode
          plank.position = new Vector3(0, i * 0.4, 0)
          const mat = new StandardMaterial(`fence_mat_${prop.id}_${i}`, this.scene)
          mat.emissiveColor = new Color3(0.4, 0.3, 0.2)
          plank.material = mat
        }
      } else if (prop.type === 'bench') {
        propNode = new TransformNode(`prop_${prop.id}`, this.scene)
        const seat = CreateBox(`bench_seat_${prop.id}`, { width: 1.8, depth: 0.5, height: 0.12 }, this.scene)
        seat.parent = propNode
        seat.position.y = 0.65
        const back = CreateBox(`bench_back_${prop.id}`, { width: 1.8, depth: 0.12, height: 0.8 }, this.scene)
        back.parent = propNode
        back.position = new Vector3(0, 1.0, -0.2)
        const benchMat = new StandardMaterial(`bench_mat_${prop.id}`, this.scene)
        benchMat.diffuseColor = new Color3(0.42, 0.3, 0.18)
        benchMat.emissiveColor = new Color3(0.14, 0.08, 0.03)
        seat.material = benchMat
        back.material = benchMat
        ;[-0.7, 0.7].forEach((xOffset, index) => {
          const leg = CreateBox(`bench_leg_${prop.id}_${index}`, { width: 0.14, depth: 0.14, height: 0.7 }, this.scene)
          leg.parent = propNode
          leg.position = new Vector3(xOffset, 0.35, 0)
          leg.material = benchMat
        })
      } else if (prop.type === 'sign') {
        propNode = new TransformNode(`prop_${prop.id}`, this.scene)
        const post = CreateCylinder(`sign_post_${prop.id}`, { height: 1.9, diameter: 0.14 }, this.scene)
        post.parent = propNode
        post.position.y = 0.95
        const plaque = CreateBox(`sign_plaque_${prop.id}`, { width: 1.1, height: 0.6, depth: 0.12 }, this.scene)
        plaque.parent = propNode
        plaque.position.y = 1.45
        const postMat = this.getPropMaterial('sign_post', {
          diffuseColor: new Color3(0.4, 0.26, 0.12),
          emissiveColor: new Color3(0.12, 0.08, 0.03),
        })
        post.material = postMat
        plaque.material = postMat

        const face = CreatePlane(`sign_face_${prop.id}`, { width: 0.88, height: 0.48 }, this.scene)
        face.parent = propNode
        face.position = new Vector3(0, 1.45, -0.07)
        face.material = this.getPropMaterial('sign_face', {
          texturePath: 'icons/poi-town.svg',
          emissiveColor: new Color3(0.18, 0.14, 0.08),
          doubleSided: true,
        })
      } else if (prop.type === 'corpse') {
        propNode = new TransformNode(`prop_${prop.id}`, this.scene)
        const body = CreateBox(`corpse_${prop.id}`, { width: 0.9, depth: 2.1, height: 0.28 }, this.scene)
        body.parent = propNode
        body.position.y = 0.14
        body.rotation.z = 0.15
        const bodyMat = this.getPropMaterial('corpse_body', {
          diffuseColor: new Color3(0.32, 0.16, 0.16),
          emissiveColor: new Color3(0.08, 0.02, 0.02),
        })
        body.material = bodyMat

        const shroud = CreatePlane(`corpse_shroud_${prop.id}`, { width: 0.96, height: 1.8 }, this.scene)
        shroud.parent = propNode
        shroud.position = new Vector3(0, 0.26, 0.1)
        shroud.rotation.x = Math.PI / 2
        shroud.material = this.getPropMaterial('corpse_shroud', {
          texturePath: 'art/rift-noise.svg',
          emissiveColor: new Color3(0.05, 0.03, 0.03),
          doubleSided: true,
        })
      } else if (prop.type === 'fallen_log') {
        propNode = new TransformNode(`prop_${prop.id}`, this.scene)
        const log = CreateCylinder(`fallen_log_${prop.id}`, { height: 2.6, diameterTop: 0.45, diameterBottom: 0.6, tessellation: 10 }, this.scene)
        log.parent = propNode
        log.rotation.z = Math.PI / 2
        log.rotation.x = 0.18
        log.position.y = 0.35
        const logMat = new StandardMaterial(`fallen_log_mat_${prop.id}`, this.scene)
        logMat.diffuseColor = new Color3(0.28, 0.2, 0.1)
        logMat.emissiveColor = new Color3(0.08, 0.05, 0.02)
        log.material = logMat
      } else {
        // Generic prop
        propNode = new TransformNode(`prop_${prop.id}`, this.scene)
      }

      if (propNode) {
        propNode.position = propPosition
        if (prop.rotation) {
          propNode.rotation.y = prop.rotation
        }
        if (prop.scale) {
          propNode.scaling = new Vector3(prop.scale, prop.scale, prop.scale)
        }
        this.environmentNodes.push(propNode)

        if (emitFireEffect) {
          this.environmentEffects.push(
            createCampfireEffect(this.scene, propPosition.add(new Vector3(0, fireHeight, 0))),
          )
        }
      }
    }

    // Create vegetation from config
    for (const veg of envConfig.vegetation) {
      const vegNode = createVegetationMarker(this.scene, new Vector3(veg.x, this.sampleTerrainHeight(veg.x, veg.z, region.biome, region.id), veg.z), veg.type)
      this.environmentNodes.push(vegNode)
    }

    console.log(`🏘️ Loaded environment for ${region.name} (${envConfig.buildings.length} buildings, ${envConfig.props.length} props)`)
  }

  private spawnRegionAmbientEffects(region: RegionData): void {
    const envConfig = getRegionEnvironment(region.id)

    const hasNearbyFireProp = (x: number, z: number): boolean => (
      envConfig?.props.some((prop) => (
        prop.type === 'torch'
        && Vector3.DistanceSquared(new Vector3(prop.x, 0, prop.z), new Vector3(x, 0, z)) <= 55 * 55
      )) ?? false
    )

    for (const poi of region.pointsOfInterest) {
      const groundY = this.sampleTerrainHeight(poi.position.x, poi.position.y, region.biome, region.id)
      const position = new Vector3(poi.position.x, groundY, poi.position.y)

      if (poi.type === 'rift') {
        const radius = 8 + region.dangerLevel * 1.4
        this.environmentEffects.push(createRiftCorruptionEffect(this.scene, position, radius))
        this.environmentEffects.push(createRiftGroundSigil(this.scene, position, radius * 1.25))
        continue
      }

      if (poi.type === 'camp' && !hasNearbyFireProp(poi.position.x, poi.position.y)) {
        this.environmentEffects.push(createCampfireEffect(this.scene, position.add(new Vector3(0, 0.2, 0))))
      }

      if (region.biome === 'warfront' && (poi.type === 'fort' || poi.type === 'camp' || poi.type === 'road')) {
        this.environmentEffects.push(createWarScorchField(this.scene, position, 24, 7))
      }
    }
  }
}
