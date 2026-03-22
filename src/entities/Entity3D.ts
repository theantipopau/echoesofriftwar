import type { Scene } from '@babylonjs/core/scene'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { Mesh } from '@babylonjs/core/Meshes/mesh'
import { CreateCapsule } from '@babylonjs/core/Meshes/Builders/capsuleBuilder'

export class Entity3D {
  protected mesh: Mesh
  protected scene: Scene
  protected position: Vector3
  protected velocity: Vector3 = Vector3.Zero()
  protected isActive: boolean = true

  constructor(scene: Scene, name: string, position: Vector3) {
    this.scene = scene
    this.position = position

    // Create default mesh (capsule)
    this.mesh = CreateCapsule(name, {
      height: 2,
      radius: 0.5
    }, scene)
    this.mesh.position = position
  }

  public update(deltaTime: number): void {
    if (!this.isActive) return

    // Apply gravity
    this.velocity.y -= 9.8 * deltaTime

    // Update position
    this.mesh.position.addInPlace(
      this.velocity.scale(deltaTime)
    )

    // Keep above ground
    if (this.mesh.position.y < 1) {
      this.mesh.position.y = 1
      this.velocity.y = 0
    }
  }

  public getMesh(): Mesh {
    return this.mesh
  }

  public setPosition(pos: Vector3): void {
    this.position = pos
    this.mesh.position = pos
  }

  public getPosition(): Vector3 {
    return this.mesh.position
  }

  public destroy(): void {
    this.mesh.dispose()
    this.isActive = false
  }
}
