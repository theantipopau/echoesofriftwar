import type { Scene } from '@babylonjs/core/scene'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { CreateCapsule } from '@babylonjs/core/Meshes/Builders/capsuleBuilder'
import { Entity3D } from './Entity3D'
import { NpcData } from '../data/types'

export class NPC3D extends Entity3D {
  private data: NpcData
  private isInConversation: boolean = false
  private dialogueIndex: number = 0

  constructor(scene: Scene, data: NpcData, position: Vector3) {
    super(scene, `npc_${data.id}`, position)

    this.data = data

    // Customize NPC mesh
    this.mesh.dispose()
    this.mesh = CreateCapsule(`npc_${data.id}`, {
      height: 1.9,
      radius: 0.35
    }, scene)
    this.mesh.position = position

    const npcMaterial = new StandardMaterial(`npcMaterial_${data.id}`, scene)
    npcMaterial.emissiveColor = this.getRoleColor(data.role)
    npcMaterial.specularColor = new Color3(0.4, 0.4, 0.4)
    this.mesh.material = npcMaterial

    // Velocity is zero for NPCs (stationary)
    this.velocity = Vector3.Zero()
  }

  private getRoleColor(role: string): Color3 {
    switch (role) {
      case 'merchant':
        return new Color3(1, 0.84, 0)
      case 'quest':
        return new Color3(0.2, 0.8, 0.2)
      case 'trainer':
        return new Color3(0.8, 0.2, 0.8)
      case 'story':
        return new Color3(1, 0.5, 0)
      default:
        return new Color3(0.7, 0.7, 0.7)
    }
  }

  public override update(deltaTime: number): void {
    // NPCs don't move, only update position for conversations
    // Placeholder for future animation/interaction
  }

  public startConversation(): void {
    this.isInConversation = true
    this.dialogueIndex = 0
    console.log(`💬 ${this.data.name}: ${this.data.shortBio}`)
  }

  public endConversation(): void {
    this.isInConversation = false
    this.dialogueIndex = 0
  }

  public isInDialog(): boolean {
    return this.isInConversation
  }

  public getData(): NpcData {
    return this.data
  }

  public getName(): string {
    return this.data.name
  }

  public getRole(): string {
    return this.data.role
  }

  public getShortBio(): string {
    return this.data.shortBio
  }

  public getDialogueTree(): Record<string, any> {
    return this.data.dialogueTree
  }
}
