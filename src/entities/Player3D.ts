import type { Scene } from '@babylonjs/core/scene'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { CreateCapsule } from '@babylonjs/core/Meshes/Builders/capsuleBuilder'
import { Entity3D } from './Entity3D'
import { EquipmentSlot, ItemData } from '../data/types'
import { PLAYER_SETTINGS } from '../config/gameBalance'

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

  constructor(scene: Scene, position: Vector3) {
    super(scene, 'player', position)

    // Customize player mesh
    this.mesh.dispose()
    this.mesh = CreateCapsule('player', {
      height: 2,
      radius: 0.4
    }, scene)
    this.mesh.position = position

    const playerMaterial = new StandardMaterial('playerMaterial', scene)
    playerMaterial.emissiveColor = new Color3(0.2, 0.5, 1)
    playerMaterial.specularColor = new Color3(0.5, 0.5, 0.5)
    this.mesh.material = playerMaterial

    // Setup input listeners
    this.setupInput()
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

    if (moveVector.length() > 0) {
      moveVector.normalize()
      const move = moveVector.scale(this.speed * deltaTime)
      this.mesh.position.addInPlace(move)
      this.isMoving = true
    } else {
      this.isMoving = false
    }

    // Update cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime
    }

    if (this.attackWindupRemaining > 0) {
      this.attackWindupRemaining -= deltaTime
      if (this.attackWindupRemaining <= 0) {
        this.pendingAttackHit = true
      }
    }

    // Mana regeneration
    this.mana = Math.min(this.maxMana, this.mana + PLAYER_SETTINGS.manaRegenPerSecond * deltaTime)
  }

  public takeDamage(amount: number): number {
    const reduced = Math.max(1, Math.round(amount - this.defense))
    this.health = Math.max(0, this.health - reduced)
    return reduced
  }

  public heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount)
  }

  public addExperience(amount: number): void {
    this.experience += amount
    const expPerLevel = PLAYER_SETTINGS.baseExperiencePerLevel * this.level
    if (this.experience >= expPerLevel) {
      this.levelUp()
    }
  }

  private levelUp(): void {
    this.level++
    this.experience = 0
    this.maxHealth += PLAYER_SETTINGS.levelHealthGain
    this.health = this.maxHealth
    this.maxMana += PLAYER_SETTINGS.levelManaGain
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
    if (this.attackCooldown > 0 || this.attackWindupRemaining > 0) return false
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

  private recalculateStats(): void {
    const items = Object.values(this.equipment).filter((item): item is ItemData => Boolean(item))
    const attackBonus = items.reduce((total, item) => total + (item.stats.attack ?? 0), 0)
    const defenseBonus = items.reduce((total, item) => total + (item.stats.defense ?? 0), 0)
    const healthBonus = items.reduce((total, item) => total + (item.stats.maxHealth ?? 0), 0)
    const manaBonus = items.reduce((total, item) => total + (item.stats.maxMana ?? 0), 0)
    const speedBonus = items.reduce((total, item) => total + (item.stats.speed ?? 0), 0)

    this.attackDamage = PLAYER_SETTINGS.baseAttack + attackBonus
    this.defense = PLAYER_SETTINGS.baseDefense + defenseBonus
    this.speed = PLAYER_SETTINGS.baseSpeed + speedBonus

    const previousMaxHealth = this.maxHealth
    this.maxHealth = PLAYER_SETTINGS.baseHealth + healthBonus
    this.maxMana = PLAYER_SETTINGS.baseMana + manaBonus

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
