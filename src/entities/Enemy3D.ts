import type { Scene } from '@babylonjs/core/scene'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { CreateCapsule } from '@babylonjs/core/Meshes/Builders/capsuleBuilder'
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder'
import { Entity3D } from './Entity3D'
import { EnemyData } from '../data/types'
import { ENEMY_SETTINGS } from '../config/gameBalance'

export class Enemy3D extends Entity3D {
  private data: EnemyData
  private health: number
  private maxHealth: number
  private attackDamage: number
  private speed: number
  private aggro: boolean = false
  private targetPosition: Vector3 | null = null
  private patrolRange: number = ENEMY_SETTINGS.patrolRange
  private attackCooldown: number = 0
  private attackRange: number = ENEMY_SETTINGS.attackRange
  private readonly material: StandardMaterial
  private readonly baseColor: Color3
  private hitFlashRemaining = 0
  private readonly healthBarRoot: TransformNode
  private readonly healthBarFill: Mesh

  constructor(scene: Scene, data: EnemyData, position: Vector3) {
    super(scene, `enemy_${data.id}`, position)

    this.data = data
    this.health = data.stats.maxHealth
    this.maxHealth = data.stats.maxHealth
    this.attackDamage = data.stats.attack
    this.speed = data.stats.speed

    // Customize enemy mesh
    this.mesh.dispose()
    this.mesh = CreateCapsule(`enemy_${data.id}`, {
      height: 1.8,
      radius: 0.4
    }, scene)
    this.mesh.position = position

    this.baseColor = this.getEnemyColor(data.type)
    this.material = new StandardMaterial(`enemyMaterial_${data.id}`, scene)
    this.material.emissiveColor = this.baseColor.clone()
    this.material.specularColor = new Color3(0.3, 0.3, 0.3)
    this.mesh.material = this.material

    this.healthBarRoot = new TransformNode(`enemyHealth_${data.id}`, scene)
    this.healthBarRoot.parent = this.mesh
    this.healthBarRoot.position = new Vector3(0, 1.6, 0)

    const healthBarBg = CreatePlane(`enemyHealthBg_${data.id}`, { width: 1.6, height: 0.18 }, scene)
    healthBarBg.parent = this.healthBarRoot
    healthBarBg.billboardMode = Mesh.BILLBOARDMODE_ALL
    const bgMaterial = new StandardMaterial(`enemyHealthBgMat_${data.id}`, scene)
    bgMaterial.emissiveColor = new Color3(0.12, 0.12, 0.16)
    bgMaterial.disableLighting = true
    healthBarBg.material = bgMaterial

    this.healthBarFill = CreatePlane(`enemyHealthFill_${data.id}`, { width: 1.52, height: 0.1 }, scene)
    this.healthBarFill.parent = this.healthBarRoot
    this.healthBarFill.position.z = -0.01
    this.healthBarFill.billboardMode = Mesh.BILLBOARDMODE_ALL
    const fillMaterial = new StandardMaterial(`enemyHealthFillMat_${data.id}`, scene)
    fillMaterial.emissiveColor = new Color3(0.88, 0.24, 0.2)
    fillMaterial.disableLighting = true
    this.healthBarFill.material = fillMaterial
  }

  private getEnemyColor(type: string): Color3 {
    switch (type) {
      case 'goblin':
        return new Color3(0.2, 0.8, 0.2)
      case 'bandit':
        return new Color3(0.8, 0.2, 0.2)
      case 'rift_hound':
        return new Color3(0.5, 0.2, 0.8)
      case 'raider':
        return new Color3(0.85, 0.42, 0.18)
      case 'wretch':
        return new Color3(0.45, 0.72, 0.58)
      default:
        return new Color3(0.5, 0.5, 0.5)
    }
  }

  public override update(deltaTime: number): void {
    super.update(deltaTime)

    // Simple patrol/aggro behavior
    if (this.aggro && this.targetPosition) {
      this.moveToward(this.targetPosition, deltaTime)
    } else {
      this.patrol(deltaTime)
    }

    // Update cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime
    }

    if (this.hitFlashRemaining > 0) {
      this.hitFlashRemaining -= deltaTime
      this.material.emissiveColor = Color3.Lerp(this.baseColor, Color3.White(), 0.6)
    } else {
      this.material.emissiveColor = this.baseColor.clone()
    }

    const healthPercent = Math.max(0.05, this.health / this.maxHealth)
    this.healthBarFill.scaling.x = healthPercent
    this.healthBarFill.position.x = -(1 - healthPercent) * 0.38
  }

  private moveToward(target: Vector3, deltaTime: number): void {
    const direction = target.subtract(this.mesh.position)
    const distance = direction.length()

    if (distance > this.attackRange) {
      direction.normalize()
      const moveVector = direction.scale(this.speed * deltaTime)
      this.mesh.position.addInPlace(moveVector)
    }
  }

  private patrol(deltaTime: number): void {
    if (!this.targetPosition) {
      const randomAngle = Math.random() * Math.PI * 2
      const randomDistance = Math.random() * this.patrolRange
      this.targetPosition = new Vector3(
        this.mesh.position.x + Math.cos(randomAngle) * randomDistance,
        this.mesh.position.y,
        this.mesh.position.z + Math.sin(randomAngle) * randomDistance
      )
    }

    const direction = this.targetPosition.subtract(this.mesh.position)
    if (direction.length() < 1) {
      this.targetPosition = null
    } else {
      direction.normalize()
      const moveVector = direction.scale(this.speed * 0.5 * deltaTime)
      this.mesh.position.addInPlace(moveVector)
    }
  }

  public takeDamage(amount: number): number {
    this.health = Math.max(0, this.health - amount)
    this.aggro = true
    this.hitFlashRemaining = 0.12
    return amount
  }

  public attack(player: Entity3D): boolean {
    if (this.attackCooldown > 0) return false
    if (Vector3.Distance(this.mesh.position, player.getPosition()) > this.attackRange) return false

    this.attackCooldown = ENEMY_SETTINGS.attackCooldownSeconds
    return true
  }

  public setTarget(target: Vector3): void {
    this.targetPosition = target
    this.aggro = true
  }

  public getHealth(): number {
    return this.health
  }

  public getMaxHealth(): number {
    return this.maxHealth
  }

  public getAttackDamage(): number {
    return this.attackDamage
  }

  public isDead(): boolean {
    return this.health <= 0
  }

  public getData(): EnemyData {
    return this.data
  }
}
