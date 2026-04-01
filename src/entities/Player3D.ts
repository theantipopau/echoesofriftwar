import type { Scene } from '@babylonjs/core/scene'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder'
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder'
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder'
import { Entity3D } from './Entity3D'
import { EquipmentSlot, ItemData } from '../data/types'
import { PLAYER_SETTINGS } from '../config/gameBalance'
import { PLAYER_MODEL_SPEC } from '../systems/visual/characterModelMappings'
import { createCharacterModelInstance } from '../systems/visual/characterModelRegistry'

export interface PlayerSnapshot {
  level: number
  experience: number
  health: number
  mana: number
  position: { x: number; y: number; z: number }
  inventoryItemIds: string[]
  equipmentItemIds: Partial<Record<EquipmentSlot, string>>
}

export class Player3D extends Entity3D {
  private static keys: Record<string, boolean> = {}
  private static listenersAttached = false
  private health: number = PLAYER_SETTINGS.baseHealth
  private maxHealth: number = PLAYER_SETTINGS.baseHealth
  private mana: number = PLAYER_SETTINGS.baseMana
  private maxMana: number = PLAYER_SETTINGS.baseMana
  private level: number = 1
  private experience: number = 0
  private speed: number = PLAYER_SETTINGS.baseSpeed
  private isMoving: boolean = false
  private inventory: ItemData[] = []
  private equipment: Partial<Record<EquipmentSlot, ItemData>> = {}
  private attackDelay: number = PLAYER_SETTINGS.attackDelaySeconds
  private attackDamage: number = PLAYER_SETTINGS.baseAttack
  private defense: number = PLAYER_SETTINGS.baseDefense
  private attackCooldown: number = 0
  private attackWindupRemaining: number = 0
  private pendingAttackHit = false
  private dodgeCooldownRemaining = 0
  private dodgeDurationRemaining = 0
  private dodgeInvulnerabilityRemaining = 0
  private dodgeDirection = new Vector3(0, 0, 1)
  private readonly material: StandardMaterial
  private staggerRemaining = 0
  private hitFlashRemaining = 0
  private modelRoot: TransformNode | null = null

  constructor(scene: Scene, position: Vector3) {
    super(scene, 'player', position)

    // Customize player mesh
    this.mesh.dispose()
    this.mesh = CreateBox('player', {
      width: 0.9,
      depth: 0.55,
      height: 1.35,
    }, scene)
    this.mesh.position = position

    this.material = new StandardMaterial('playerMaterial', scene)
    // Armor blue with reduced emissive, more metallic feel
    this.material.diffuseColor = new Color3(0.35, 0.55, 0.75)
    this.material.emissiveColor = new Color3(0.08, 0.12, 0.18)
    this.material.specularColor = new Color3(0.6, 0.6, 0.65)
    this.material.specularPower = 32
    this.createPlayerVisual(scene)
    void this.tryLoadDetailedModel()

    // Setup input listeners
    this.setupInput()
  }

  private createPlayerVisual(scene: Scene): void {
    this.mesh.material = this.material

    const head = CreateSphere('player_head', { diameter: 0.52, segments: 8 }, scene)
    head.parent = this.mesh
    head.position.y = 0.95
    head.material = this.material

    const leftArm = CreateBox('player_arm_l', { width: 0.22, depth: 0.22, height: 0.9 }, scene)
    leftArm.parent = this.mesh
    leftArm.position = new Vector3(-0.55, 0.22, 0)
    leftArm.rotation.z = 0.08
    leftArm.material = this.material

    const rightArm = CreateBox('player_arm_r', { width: 0.22, depth: 0.22, height: 0.9 }, scene)
    rightArm.parent = this.mesh
    rightArm.position = new Vector3(0.55, 0.22, 0)
    rightArm.rotation.z = -0.08
    rightArm.material = this.material

    const leftLeg = CreateBox('player_leg_l', { width: 0.24, depth: 0.24, height: 0.95 }, scene)
    leftLeg.parent = this.mesh
    leftLeg.position = new Vector3(-0.2, -1.08, 0)
    leftLeg.material = this.material

    const rightLeg = CreateBox('player_leg_r', { width: 0.24, depth: 0.24, height: 0.95 }, scene)
    rightLeg.parent = this.mesh
    rightLeg.position = new Vector3(0.2, -1.08, 0)
    rightLeg.material = this.material

    const shoulder = CreateCylinder('player_shoulder', { diameter: 0.9, height: 0.22, tessellation: 8 }, scene)
    shoulder.parent = this.mesh
    shoulder.position.y = 0.58
    shoulder.rotation.z = Math.PI / 2
    shoulder.material = this.material
  }

  private async tryLoadDetailedModel(): Promise<void> {
    const modelRoot = await createCharacterModelInstance(this.scene, PLAYER_MODEL_SPEC, 'player_model_root')
    if (!modelRoot) {
      return
    }

    modelRoot.parent = this.mesh
    this.modelRoot = modelRoot
    this.mesh.visibility = 0.02
  }

  private syncModelRoot(): void {
    if (!this.modelRoot) {
      return
    }

    const dir = this.dodgeDirection
    if (dir.lengthSquared() > 0.0001) {
      this.modelRoot.rotation.y = Math.atan2(dir.x, dir.z)
    }
  }

  private setupInput(): void {
    if (Player3D.listenersAttached) {
      return
    }

    window.addEventListener('keydown', (e) => {
      Player3D.keys[e.key.toLowerCase()] = true
    })
    window.addEventListener('keyup', (e) => {
      Player3D.keys[e.key.toLowerCase()] = false
    })
    Player3D.listenersAttached = true
  }

  public override update(deltaTime: number): void {
    super.update(deltaTime)

    // Movement
    const moveVector = Vector3.Zero()
    if (Player3D.keys['w'] || Player3D.keys['arrowup']) moveVector.z += 1
    if (Player3D.keys['s'] || Player3D.keys['arrowdown']) moveVector.z -= 1
    if (Player3D.keys['a'] || Player3D.keys['arrowleft']) moveVector.x -= 1
    if (Player3D.keys['d'] || Player3D.keys['arrowright']) moveVector.x += 1

    const hasInput = moveVector.length() > 0
    if (hasInput) {
      moveVector.normalize()
      this.dodgeDirection.copyFrom(moveVector)
    }

    const canMoveNormally = this.staggerRemaining <= 0
    const effectiveMoveDirection = this.dodgeDurationRemaining > 0
      ? this.dodgeDirection
      : canMoveNormally
        ? moveVector
        : Vector3.Zero()

    if (effectiveMoveDirection.length() > 0) {
      const dodgeMultiplier = this.dodgeDurationRemaining > 0 ? PLAYER_SETTINGS.dodgeSpeedMultiplier : 1
      const move = effectiveMoveDirection.scale(this.speed * dodgeMultiplier * deltaTime)
      this.mesh.position.addInPlace(move)
      this.isMoving = true
    } else {
      this.isMoving = false
    }

    // Update cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime
    }

    if (this.dodgeCooldownRemaining > 0) {
      this.dodgeCooldownRemaining -= deltaTime
    }

    if (this.dodgeDurationRemaining > 0) {
      this.dodgeDurationRemaining -= deltaTime
    }

    if (this.dodgeInvulnerabilityRemaining > 0) {
      this.dodgeInvulnerabilityRemaining -= deltaTime
    }

    if (this.staggerRemaining > 0) {
      this.staggerRemaining -= deltaTime
    }

    if (this.hitFlashRemaining > 0) {
      this.hitFlashRemaining -= deltaTime
      this.material.emissiveColor = Color3.Lerp(new Color3(0.08, 0.12, 0.18), new Color3(0.95, 0.2, 0.2), 0.7)
    } else if (this.dodgeInvulnerabilityRemaining > 0) {
      this.material.emissiveColor = Color3.Lerp(new Color3(0.08, 0.12, 0.18), new Color3(0.4, 0.8, 1), 0.6)
    } else {
      this.material.emissiveColor = new Color3(0.08, 0.12, 0.18)
    }

    if (this.attackWindupRemaining > 0) {
      this.attackWindupRemaining -= deltaTime
      if (this.attackWindupRemaining <= 0) {
        this.pendingAttackHit = true
      }
    }

    // Mana regeneration
    this.mana = Math.min(this.maxMana, this.mana + PLAYER_SETTINGS.manaRegenPerSecond * deltaTime)
    this.syncModelRoot()
  }

  public override destroy(): void {
    this.modelRoot?.dispose()
    this.modelRoot = null
    super.destroy()
  }

  public getShadowMeshes(): AbstractMesh[] {
    if (this.modelRoot) {
      const meshes = this.modelRoot.getChildMeshes()
      if (meshes.length > 0) {
        return meshes
      }
    }
    return [this.mesh]
  }

  public takeDamage(amount: number): number {
    if (this.isInvulnerable()) {
      return 0
    }

    const reduced = Math.max(1, Math.round(amount - this.defense))
    this.health = Math.max(0, this.health - reduced)
    this.hitFlashRemaining = 0.14
    this.staggerRemaining = 0.16
    return reduced
  }

  public heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount)
  }

  public addExperience(amount: number): void {
    this.experience += amount
    while (this.experience >= PLAYER_SETTINGS.baseExperiencePerLevel * this.level) {
      this.experience -= PLAYER_SETTINGS.baseExperiencePerLevel * this.level
      this.levelUp()
    }
  }

  private levelUp(): void {
    this.level++
    this.recalculateStats()
    this.health = this.maxHealth
    this.mana = this.maxMana
    console.log(`⭐ Level up! You are now level ${this.level}`)
  }

  public addToInventory(item: ItemData): void {
    this.inventory.push(item)
  }

  public getInventory(): ItemData[] {
    return [...this.inventory]
  }

  public hasItem(itemId: string): boolean {
    return this.inventory.some((item) => item.id === itemId)
  }

  public removeFromInventory(itemId: string): ItemData | null {
    const index = this.inventory.findIndex((item) => item.id === itemId)
    if (index === -1) {
      return null
    }

    const [removed] = this.inventory.splice(index, 1)
    return removed ?? null
  }

  public getEquipment(): Partial<Record<EquipmentSlot, ItemData>> {
    return { ...this.equipment }
  }

  public getHealth(): number {
    return this.health
  }

  public getMaxHealth(): number {
    return this.maxHealth
  }

  public getMana(): number {
    return this.mana
  }

  public getMaxMana(): number {
    return this.maxMana
  }

  public getLevel(): number {
    return this.level
  }

  public getExperience(): number {
    return this.experience
  }

  public isPlayerMoving(): boolean {
    return this.isMoving
  }

  public attack(): boolean {
    if (this.attackCooldown > 0 || this.attackWindupRemaining > 0 || this.staggerRemaining > 0 || this.dodgeDurationRemaining > 0) return false
    this.attackCooldown = this.attackDelay
    this.attackWindupRemaining = PLAYER_SETTINGS.attackWindupSeconds
    this.pendingAttackHit = false
    return true
  }

  public consumeAttackHit(): boolean {
    if (!this.pendingAttackHit) {
      return false
    }

    this.pendingAttackHit = false
    return true
  }

  public tryDodge(): boolean {
    if (this.dodgeCooldownRemaining > 0 || this.dodgeDurationRemaining > 0) {
      return false
    }

    if (this.mana < PLAYER_SETTINGS.dodgeManaCost) {
      return false
    }

    this.mana = Math.max(0, this.mana - PLAYER_SETTINGS.dodgeManaCost)
    this.dodgeCooldownRemaining = PLAYER_SETTINGS.dodgeCooldownSeconds
    this.dodgeDurationRemaining = PLAYER_SETTINGS.dodgeDurationSeconds
    this.dodgeInvulnerabilityRemaining = PLAYER_SETTINGS.dodgeInvulnerabilitySeconds
    return true
  }

  public isInvulnerable(): boolean {
    return this.dodgeInvulnerabilityRemaining > 0
  }

  public applyHitReaction(sourcePosition: Vector3, strength: number): void {
    const away = this.mesh.position.subtract(sourcePosition)
    away.y = 0
    if (away.lengthSquared() === 0) {
      away.copyFromFloats(0, 0, 1)
    }
    away.normalize()
    this.mesh.position.addInPlace(away.scale(strength))
    this.dodgeDirection.copyFrom(away)
    this.hitFlashRemaining = 0.14
    this.staggerRemaining = Math.max(this.staggerRemaining, 0.16)
  }

  public getFacingDirection(): Vector3 {
    return this.dodgeDirection.clone()
  }

  public getAttackDamage(): number {
    return this.attackDamage
  }

  public getDefense(): number {
    return this.defense
  }

  public getSpeed(): number {
    return this.speed
  }

  public equipFromInventory(itemId: string): string {
    const index = this.inventory.findIndex((item) => item.id === itemId)
    if (index === -1) {
      return 'Item not found in inventory.'
    }

    const item = this.inventory[index]
    const slot = this.resolveEquipmentSlot(item)
    if (!slot) {
      return `${item.name} cannot be equipped.`
    }

    const current = this.equipment[slot]
    if (current) {
      this.inventory.push(current)
    }

    this.inventory.splice(index, 1)
    this.equipment[slot] = item
    this.recalculateStats()
    return `${item.name} equipped.`
  }

  public unequipToInventory(slot: string): string {
    const normalizedSlot = slot as EquipmentSlot
    const item = this.equipment[normalizedSlot]
    if (!item) {
      return 'Nothing equipped in that slot.'
    }

    this.inventory.push(item)
    delete this.equipment[normalizedSlot]
    this.recalculateStats()
    return `${item.name} returned to inventory.`
  }

  public consumeItem(itemId: string): string {
    const index = this.inventory.findIndex((item) => item.id === itemId)
    if (index === -1) {
      return 'Item not found in inventory.'
    }

    const item = this.inventory[index]
    if (item.type !== 'consumable') {
      return `${item.name} cannot be consumed.`
    }

    this.inventory.splice(index, 1)
    const healAmount = item.stats.maxHealth ?? 10
    this.heal(healAmount)
    return `${item.name} restored ${healAmount} health.`
  }

  public getDerivedStats(): { attack: number; defense: number; maxHealth: number; maxMana: number; speed: number } {
    return {
      attack: this.attackDamage,
      defense: this.defense,
      maxHealth: this.maxHealth,
      maxMana: this.maxMana,
      speed: this.speed,
    }
  }

  public getSnapshot(): PlayerSnapshot {
    const equipmentItemIds: Partial<Record<EquipmentSlot, string>> = {}
    Object.entries(this.equipment).forEach(([slot, item]) => {
      if (item) {
        equipmentItemIds[slot as EquipmentSlot] = item.id
      }
    })

    return {
      level: this.level,
      experience: this.experience,
      health: this.health,
      mana: this.mana,
      position: {
        x: this.mesh.position.x,
        y: this.mesh.position.y,
        z: this.mesh.position.z,
      },
      inventoryItemIds: this.inventory.map((item) => item.id),
      equipmentItemIds,
    }
  }

  public restoreFromSnapshot(snapshot: PlayerSnapshot, itemResolver: (itemId: string) => ItemData | undefined): void {
    this.level = Math.max(1, Math.floor(snapshot.level || 1))
    this.experience = Math.max(0, Math.floor(snapshot.experience || 0))

    this.inventory = (snapshot.inventoryItemIds ?? [])
      .map((itemId) => itemResolver(itemId))
      .filter((item): item is ItemData => Boolean(item))

    this.equipment = {}
    Object.entries(snapshot.equipmentItemIds ?? {}).forEach(([slot, itemId]) => {
      if (!itemId) {
        return
      }
      const item = itemResolver(itemId)
      if (!item) {
        return
      }
      this.equipment[slot as EquipmentSlot] = item
    })

    this.recalculateStats()

    this.health = Math.max(1, Math.min(this.maxHealth, snapshot.health || this.maxHealth))
    this.mana = Math.max(0, Math.min(this.maxMana, snapshot.mana || this.maxMana))
    this.setPosition(new Vector3(snapshot.position.x, snapshot.position.y, snapshot.position.z))
  }

  private recalculateStats(): void {
    const items = Object.values(this.equipment).filter((item): item is ItemData => Boolean(item))
    const attackBonus = items.reduce((total, item) => total + (item.stats.attack ?? 0), 0)
    const defenseBonus = items.reduce((total, item) => total + (item.stats.defense ?? 0), 0)
    const healthBonus = items.reduce((total, item) => total + (item.stats.maxHealth ?? 0), 0)
    const manaBonus = items.reduce((total, item) => total + (item.stats.maxMana ?? 0), 0)
    const speedBonus = items.reduce((total, item) => total + (item.stats.speed ?? 0), 0)
    const levelHealthBonus = Math.max(0, this.level - 1) * PLAYER_SETTINGS.levelHealthGain
    const levelManaBonus = Math.max(0, this.level - 1) * PLAYER_SETTINGS.levelManaGain

    this.attackDamage = PLAYER_SETTINGS.baseAttack + attackBonus
    this.defense = PLAYER_SETTINGS.baseDefense + defenseBonus
    this.speed = PLAYER_SETTINGS.baseSpeed + speedBonus

    const previousMaxHealth = this.maxHealth
    this.maxHealth = PLAYER_SETTINGS.baseHealth + levelHealthBonus + healthBonus
    this.maxMana = PLAYER_SETTINGS.baseMana + levelManaBonus + manaBonus

    if (this.maxHealth !== previousMaxHealth) {
      this.health = Math.min(this.health, this.maxHealth)
    }
    this.mana = Math.min(this.mana, this.maxMana)
  }

  private resolveEquipmentSlot(item: ItemData): EquipmentSlot | null {
    if (item.type === 'weapon') {
      return 'weapon'
    }

    if (item.type === 'armor') {
      return 'chest'
    }

    if (item.type === 'relic') {
      return 'accessory'
    }

    return null
  }
}
