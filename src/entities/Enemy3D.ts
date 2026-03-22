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

interface EnemyBehaviorProfile {
  speedMultiplier: number
  attackRange: number
  preferredDistance: number
  attackWindupSeconds: number
  attackCooldownSeconds: number
  attackDamageMultiplier: number
  strafeStrength: number
  knockbackStrength: number
}

export class Enemy3D extends Entity3D {
  private data: EnemyData
  private health: number
  private maxHealth: number
  private attackDamage: number
  private speed: number
  private readonly behaviorProfile: EnemyBehaviorProfile
  private aggro: boolean = false
  private targetPosition: Vector3 | null = null
  private patrolRange: number = ENEMY_SETTINGS.patrolRange
  private attackCooldown: number = 0
  private attackRange: number = ENEMY_SETTINGS.attackRange
  private readonly material: StandardMaterial
  private readonly baseColor: Color3
  private hitFlashRemaining = 0
  private attackWindupRemaining = 0
  private attackPrimed = false
  private telegraphPulse = 0
  private staggerRemaining = 0
  private readonly healthBarRoot: TransformNode
  private readonly healthBarFill: Mesh

  constructor(scene: Scene, data: EnemyData, position: Vector3) {
    super(scene, `enemy_${data.id}`, position)

    this.data = data
    this.behaviorProfile = this.createBehaviorProfile(data)
    this.health = data.stats.maxHealth
    this.maxHealth = data.stats.maxHealth
    this.attackDamage = Math.round(data.stats.attack * this.behaviorProfile.attackDamageMultiplier)
    this.speed = data.stats.speed * this.behaviorProfile.speedMultiplier
    this.attackRange = this.behaviorProfile.attackRange

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

  private createBehaviorProfile(data: EnemyData): EnemyBehaviorProfile {
    switch (data.type) {
      case 'goblin':
        return {
          speedMultiplier: 1.18,
          attackRange: 2.6,
          preferredDistance: 2.2,
          attackWindupSeconds: 0.26,
          attackCooldownSeconds: 1.05,
          attackDamageMultiplier: 0.9,
          strafeStrength: 0.55,
          knockbackStrength: 1.15,
        }
      case 'bandit':
        return {
          speedMultiplier: 0.96,
          attackRange: 3.2,
          preferredDistance: 2.8,
          attackWindupSeconds: 0.54,
          attackCooldownSeconds: 1.8,
          attackDamageMultiplier: 1.2,
          strafeStrength: 0.1,
          knockbackStrength: 0.7,
        }
      case 'rift_hound':
        return {
          speedMultiplier: 1.32,
          attackRange: 2.8,
          preferredDistance: 2.1,
          attackWindupSeconds: 0.22,
          attackCooldownSeconds: 1.0,
          attackDamageMultiplier: 0.95,
          strafeStrength: 0.3,
          knockbackStrength: 1.3,
        }
      case 'raider':
        return {
          speedMultiplier: 1.05,
          attackRange: 3.8,
          preferredDistance: 3.1,
          attackWindupSeconds: 0.38,
          attackCooldownSeconds: 1.35,
          attackDamageMultiplier: 1,
          strafeStrength: 0.38,
          knockbackStrength: 0.9,
        }
      case 'wretch':
        return {
          speedMultiplier: 0.88,
          attackRange: 4.4,
          preferredDistance: 3.9,
          attackWindupSeconds: 0.62,
          attackCooldownSeconds: 2.05,
          attackDamageMultiplier: 1.05,
          strafeStrength: 0.2,
          knockbackStrength: 0.8,
        }
      default:
        return {
          speedMultiplier: 1,
          attackRange: ENEMY_SETTINGS.attackRange,
          preferredDistance: ENEMY_SETTINGS.attackRange - 0.3,
          attackWindupSeconds: ENEMY_SETTINGS.attackWindupSeconds,
          attackCooldownSeconds: ENEMY_SETTINGS.attackCooldownSeconds,
          attackDamageMultiplier: 1,
          strafeStrength: 0.15,
          knockbackStrength: 1,
        }
    }
  }

  public override update(deltaTime: number): void {
    super.update(deltaTime)

    // Simple patrol/aggro behavior
    if (this.staggerRemaining > 0) {
      this.staggerRemaining -= deltaTime
    } else if (this.aggro && this.targetPosition) {
      this.moveToward(this.targetPosition, deltaTime)
    } else {
      this.patrol(deltaTime)
    }

    // Update cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime
    }

    if (this.attackWindupRemaining > 0) {
      this.attackWindupRemaining -= deltaTime
      this.telegraphPulse += deltaTime * 16
      if (this.attackWindupRemaining <= 0) {
        this.attackWindupRemaining = 0
        this.attackPrimed = true
      }
    }

    if (this.hitFlashRemaining > 0) {
      this.hitFlashRemaining -= deltaTime
      this.material.emissiveColor = Color3.Lerp(this.baseColor, Color3.White(), 0.6)
    } else if (this.attackWindupRemaining > 0) {
      const pulse = 0.45 + Math.abs(Math.sin(this.telegraphPulse)) * 0.35
      this.material.emissiveColor = Color3.Lerp(this.baseColor, new Color3(1, 0.22, 0.12), pulse)
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

    if (distance === 0) {
      return
    }

    direction.normalize()
    const tangent = new Vector3(-direction.z, 0, direction.x)
    const standoff = this.behaviorProfile.preferredDistance
    let moveDirection = Vector3.Zero()

    if (distance > standoff + 0.4) {
      moveDirection = direction.add(tangent.scale(this.behaviorProfile.strafeStrength))
    } else if (distance < Math.max(1.4, standoff - 0.55)) {
      moveDirection = direction.scale(-0.75).add(tangent.scale(this.behaviorProfile.strafeStrength * 0.5))
    } else if (this.behaviorProfile.strafeStrength > 0) {
      moveDirection = tangent.scale(this.behaviorProfile.strafeStrength)
    }

    if (moveDirection.lengthSquared() > 0) {
      moveDirection.normalize()
      const moveVector = moveDirection.scale(this.speed * deltaTime)
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

  public takeDamage(amount: number, sourcePosition?: Vector3): number {
    this.health = Math.max(0, this.health - amount)
    this.aggro = true
    this.hitFlashRemaining = 0.12
    this.staggerRemaining = 0.12
    this.attackPrimed = false
    this.attackWindupRemaining = 0
    if (sourcePosition) {
      const away = this.mesh.position.subtract(sourcePosition)
      away.y = 0
      if (away.lengthSquared() > 0) {
        away.normalize()
        this.mesh.position.addInPlace(away.scale(this.behaviorProfile.knockbackStrength))
      }
    }
    return amount
  }

  public attack(player: Entity3D): boolean {
    const distance = Vector3.Distance(this.mesh.position, player.getPosition())
    if (distance > this.attackRange) {
      this.attackWindupRemaining = 0
      this.attackPrimed = false
      return false
    }

    if (this.attackCooldown > 0 || this.staggerRemaining > 0) {
      return false
    }

    if (this.attackPrimed) {
      this.attackCooldown = this.behaviorProfile.attackCooldownSeconds
      this.attackPrimed = false
      this.attackWindupRemaining = 0
      return true
    }

    if (this.attackWindupRemaining <= 0) {
      this.attackWindupRemaining = this.behaviorProfile.attackWindupSeconds
      this.telegraphPulse = 0
      return false
    }

    return false
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

  public getAttackRange(): number {
    return this.attackRange
  }

  public isWindingUpAttack(): boolean {
    return this.attackWindupRemaining > 0
  }

  public isDead(): boolean {
    return this.health <= 0
  }

  public getData(): EnemyData {
    return this.data
  }
}
