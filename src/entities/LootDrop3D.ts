import type { Scene } from '@babylonjs/core/scene'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import type { Mesh } from '@babylonjs/core/Meshes/mesh'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { CreatePolyhedron } from '@babylonjs/core/Meshes/Builders/polyhedronBuilder'
import type { ItemData } from '../data/types'

const rarityColors: Record<string, Color3> = {
  common: new Color3(0.79, 0.84, 0.92),
  uncommon: new Color3(0.33, 0.82, 0.53),
  rare: new Color3(0.35, 0.56, 0.96),
  epic: new Color3(0.79, 0.39, 0.9),
  legendary: new Color3(0.95, 0.69, 0.17),
}

export class LootDrop3D {
  private readonly mesh: Mesh
  private readonly baseY: number
  private phase = Math.random() * Math.PI * 2

  constructor(
    private readonly scene: Scene,
    private readonly item: ItemData,
    position: Vector3,
  ) {
    this.mesh = CreatePolyhedron(`loot_${item.id}_${Date.now()}`, { type: 1, size: 1.1 }, scene)
    this.mesh.position = position.clone()
    this.baseY = this.mesh.position.y

    const material = new StandardMaterial(`loot_mat_${item.id}_${Date.now()}`, scene)
    material.emissiveColor = rarityColors[item.rarity] ?? rarityColors.common
    material.specularColor = new Color3(0.1, 0.1, 0.1)
    this.mesh.material = material
  }

  public update(deltaTime: number): void {
    this.phase += deltaTime * 2.2
    this.mesh.position.y = this.baseY + Math.sin(this.phase) * 0.35
    this.mesh.rotation.y += deltaTime * 1.6
  }

  public getItem(): ItemData {
    return this.item
  }

  public getMesh(): Mesh {
    return this.mesh
  }

  public destroy(): void {
    this.mesh.dispose()
  }
}