import type { Scene } from '@babylonjs/core/scene'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import { Entity3D } from '../../entities/Entity3D'

export class CameraController {
  private camera: UniversalCamera
  private scene: Scene
  private target: Entity3D | null = null
  private offset: Vector3 = new Vector3(0, 8, -15)
  private smoothness: number = 0.15  // Slightly snappier response
  private distance: number = 20
  private height: number = 12
  private angle: number = 0
  private combatFocus: Vector3 | null = null
  private kickOffset = Vector3.Zero()

  constructor(scene: Scene) {
    this.scene = scene

    // Create camera
    this.camera = new UniversalCamera('camera', new Vector3(0, 10, -20), scene)
    this.camera.attachControl(scene.getEngine().getRenderingCanvas(), true)

    // Camera settings
    this.camera.inertia = 0.7
    this.camera.angularSensibility = 1000
    this.camera.speed = 0
  }

  public setTarget(entity: Entity3D): void {
    this.target = entity
  }

  public setCombatFocus(point: Vector3 | null): void {
    this.combatFocus = point ? point.clone() : null
  }

  public addImpactKick(intensity: number): void {
    this.kickOffset.addInPlace(new Vector3((Math.random() - 0.5) * intensity, intensity * 0.4, -intensity))
  }

  public update(): void {
    if (!this.target) return

    const targetPos = this.target.getPosition()
    const cameraPos = this.camera.position
    const anchorPoint = this.combatFocus
      ? Vector3.Lerp(targetPos, this.combatFocus, 0.35)
      : targetPos.clone()

    this.kickOffset.scaleInPlace(0.82)

    // Calculate desired position
    const focusDistanceBoost = this.combatFocus ? 1.14 : 1
    const desiredX = anchorPoint.x + this.offset.x * focusDistanceBoost + this.kickOffset.x
    const desiredY = anchorPoint.y + this.offset.y + this.kickOffset.y
    const desiredZ = anchorPoint.z + this.offset.z * focusDistanceBoost + this.kickOffset.z

    // Smooth camera movement
    cameraPos.x += (desiredX - cameraPos.x) * this.smoothness
    cameraPos.y += (desiredY - cameraPos.y) * this.smoothness
    cameraPos.z += (desiredZ - cameraPos.z) * this.smoothness

    // Look at player with slight offset above
    const lookAtPoint = anchorPoint.clone()
    lookAtPoint.y += 1
    this.camera.setTarget(lookAtPoint)
  }

  public rotateAround(deltaX: number, deltaY: number): void {
    if (!this.target) return

    this.angle += deltaX * 0.01
    const x = Math.cos(this.angle) * this.distance
    const z = Math.sin(this.angle) * this.distance

    this.offset = new Vector3(x, this.height, z)
  }

  public zoom(delta: number): void {
    this.distance = Math.max(5, Math.min(50, this.distance + delta))
    this.offset.scaleInPlace(this.distance / 20)
  }

  public getCamera(): UniversalCamera {
    return this.camera
  }
}
