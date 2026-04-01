import type { Scene } from '@babylonjs/core/scene'
import type { Node } from '@babylonjs/core/node'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { PointLight } from '@babylonjs/core/Lights/pointLight'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder'
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder'
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder'
import { CreatePolyhedron } from '@babylonjs/core/Meshes/Builders/polyhedronBuilder'
import type { DungeonData, DungeonInteractableData, DungeonRoomData } from '../../data/types'

export type DungeonInteractableRuntime = {
  data: DungeonInteractableData
  root: TransformNode
  marker: Node
  resolved: boolean
}

export interface DungeonRuntimeSnapshot {
  dungeonId: string
  clearedEncounterIds: string[]
  resolvedInteractableIds: string[]
}

export default class DungeonManager {
  private activeDungeon: DungeonData | null = null
  private roots: Node[] = []
  private lights: PointLight[] = []
  private animatedNodes: TransformNode[] = []
  private interactables = new Map<string, DungeonInteractableRuntime>()
  private clearedEncounterIds = new Set<string>()

  constructor(private readonly scene: Scene) {}

  public generateDungeon(dungeon: DungeonData): void {
    this.clear()
    this.activeDungeon = dungeon

    dungeon.rooms.forEach((room) => this.createRoom(room))
    dungeon.corridors.forEach((corridor) => this.createCorridor(corridor.fromRoomId, corridor.toRoomId, corridor.width, dungeon.rooms))
    dungeon.rooms.forEach((room) => this.decorateRoom(room))
    dungeon.interactables.forEach((interactable) => this.createInteractable(interactable))
  }

  public update(deltaTime: number): void {
    this.animatedNodes.forEach((node, index) => {
      node.rotation.y += deltaTime * (0.45 + index * 0.03)
      node.position.y += Math.sin(performance.now() / 700 + index) * 0.002
    })
  }

  public clear(): void {
    this.interactables.forEach((runtime) => runtime.root.dispose())
    this.interactables.clear()
    this.animatedNodes = []
    this.roots.forEach((root) => root.dispose())
    this.lights.forEach((light) => light.dispose())
    this.roots = []
    this.lights = []
    this.clearedEncounterIds.clear()
    this.activeDungeon = null
  }

  public isActive(): boolean {
    return Boolean(this.activeDungeon)
  }

  public getActiveDungeon(): DungeonData | null {
    return this.activeDungeon
  }

  public getSpawnPosition(): Vector3 {
    if (!this.activeDungeon) {
      return new Vector3(0, 1.2, 0)
    }

    return new Vector3(this.activeDungeon.startPosition.x, 1.2, this.activeDungeon.startPosition.y)
  }

  public getEnemySpawnDefinitions(): Array<{ id: string; encounterId: string; enemyId: string; position: Vector3 }> {
    if (!this.activeDungeon) {
      return []
    }

    return this.activeDungeon.encounters.flatMap((encounter) =>
      encounter.enemyIds.map((enemyId, index) => {
        const angle = (Math.PI * 2 * index) / Math.max(1, encounter.enemyIds.length)
        const radius = encounter.enemyIds.length > 1 ? 4.5 : 0
        return {
          id: `${encounter.id}_${index}`,
          encounterId: encounter.id,
          enemyId,
          position: new Vector3(
            encounter.position.x + Math.cos(angle) * radius,
            1.2,
            encounter.position.y + Math.sin(angle) * radius,
          ),
        }
      }),
    )
  }

  public getInteractablesByActivation(activation: DungeonInteractableData['activation']): DungeonInteractableRuntime[] {
    return Array.from(this.interactables.values()).filter((runtime) => runtime.data.activation === activation && !runtime.resolved)
  }

  public markInteractableResolved(interactableId: string): void {
    const runtime = this.interactables.get(interactableId)
    if (!runtime) {
      return
    }

    runtime.resolved = true
    runtime.root.setEnabled(false)
  }

  public markEncounterCleared(encounterId: string): void {
    this.clearedEncounterIds.add(encounterId)
  }

  public isEncounterCleared(encounterId: string): boolean {
    return this.clearedEncounterIds.has(encounterId)
  }

  public getSnapshot(): DungeonRuntimeSnapshot | null {
    if (!this.activeDungeon) {
      return null
    }

    return {
      dungeonId: this.activeDungeon.id,
      clearedEncounterIds: Array.from(this.clearedEncounterIds),
      resolvedInteractableIds: Array.from(this.interactables.values())
        .filter((runtime) => runtime.resolved)
        .map((runtime) => runtime.data.id),
    }
  }

  public restoreFromSnapshot(snapshot: DungeonRuntimeSnapshot): void {
    if (!this.activeDungeon || snapshot.dungeonId !== this.activeDungeon.id) {
      return
    }

    this.clearedEncounterIds = new Set(snapshot.clearedEncounterIds ?? [])
    const resolvedInteractableIds = new Set(snapshot.resolvedInteractableIds ?? [])
    this.interactables.forEach((runtime, interactableId) => {
      if (!resolvedInteractableIds.has(interactableId)) {
        return
      }

      runtime.resolved = true
      runtime.root.setEnabled(false)
    })
  }

  public getNearestInteractable(position: Vector3, range: number, activation: DungeonInteractableData['activation']): DungeonInteractableRuntime | null {
    const candidates = this.getInteractablesByActivation(activation)
      .map((runtime) => ({ runtime, distance: Vector3.Distance(position, runtime.root.position) }))
      .filter((entry) => entry.distance <= range)
      .sort((left, right) => left.distance - right.distance)

    return candidates[0]?.runtime ?? null
  }

  private createRoom(room: DungeonRoomData): void {
    const root = new TransformNode(`dungeon_room_${room.id}`, this.scene)
    root.position = new Vector3(room.position.x, 0, room.position.y)

    const floor = CreateBox(`dungeon_floor_${room.id}`, { width: room.size.width, depth: room.size.height, height: 1.2 }, this.scene)
    floor.parent = root
    floor.position.y = -0.6
    floor.material = this.makeMaterial(`dungeon_floor_mat_${room.id}`, this.getFloorColor(room.kind))

    const ceiling = CreateBox(`dungeon_ceiling_${room.id}`, { width: room.size.width, depth: room.size.height, height: 0.8 }, this.scene)
    ceiling.parent = root
    ceiling.position.y = room.ceilingHeight ?? 6
    ceiling.material = this.makeMaterial(`dungeon_ceiling_mat_${room.id}`, new Color3(0.08, 0.09, 0.12))

    const wallDepth = 1.2
    const wallHeight = (room.ceilingHeight ?? 6) + 0.6
    const walls = [
      { width: room.size.width, depth: wallDepth, x: 0, z: room.size.height / 2 },
      { width: room.size.width, depth: wallDepth, x: 0, z: -room.size.height / 2 },
      { width: wallDepth, depth: room.size.height, x: room.size.width / 2, z: 0 },
      { width: wallDepth, depth: room.size.height, x: -room.size.width / 2, z: 0 },
    ]

    walls.forEach((wall, index) => {
      const mesh = CreateBox(`dungeon_wall_${room.id}_${index}`, { width: wall.width, depth: wall.depth, height: wallHeight }, this.scene)
      mesh.parent = root
      mesh.position = new Vector3(wall.x, wallHeight / 2 - 0.3, wall.z)
      mesh.material = this.makeMaterial(`dungeon_wall_mat_${room.id}_${index}`, this.getWallColor(room.kind))
    })

    const light = new PointLight(`dungeon_light_${room.id}`, new Vector3(room.position.x, (room.ceilingHeight ?? 6) - 1, room.position.y), this.scene)
    light.diffuse = this.getLightColor(room.kind)
    light.intensity = room.kind === 'final' ? 2.1 : room.kind === 'corrupted' ? 1.5 : 0.8
    light.range = Math.max(room.size.width, room.size.height) * 1.1
    this.lights.push(light)
    this.roots.push(root)
  }

  private createCorridor(fromRoomId: string, toRoomId: string, width: number, rooms: DungeonRoomData[]): void {
    const from = rooms.find((room) => room.id === fromRoomId)
    const to = rooms.find((room) => room.id === toRoomId)
    if (!from || !to) {
      return
    }

    const fromPosition = new Vector3(from.position.x, 0, from.position.y)
    const toPosition = new Vector3(to.position.x, 0, to.position.y)
    const direction = toPosition.subtract(fromPosition)
    const length = Math.max(6, direction.length())
    const center = fromPosition.add(direction.scale(0.5))
    const rotationY = Math.atan2(direction.z, direction.x)
    const corridorHeight = 6
    const root = new TransformNode(`dungeon_corridor_${fromRoomId}_${toRoomId}`, this.scene)
    root.position = center
    root.rotation.y = -rotationY

    const floor = CreateBox(`dungeon_corridor_floor_${fromRoomId}_${toRoomId}`, { width: length, depth: width, height: 1 }, this.scene)
    floor.parent = root
    floor.position.y = -0.5
    floor.material = this.makeMaterial(`dungeon_corridor_floor_mat_${fromRoomId}_${toRoomId}`, new Color3(0.12, 0.12, 0.13))

    const ceiling = CreateBox(`dungeon_corridor_ceiling_${fromRoomId}_${toRoomId}`, { width: length, depth: width, height: 0.7 }, this.scene)
    ceiling.parent = root
    ceiling.position.y = corridorHeight
    ceiling.material = this.makeMaterial(`dungeon_corridor_ceiling_mat_${fromRoomId}_${toRoomId}`, new Color3(0.07, 0.08, 0.1))

    const leftWall = CreateBox(`dungeon_corridor_left_${fromRoomId}_${toRoomId}`, { width: length, depth: 0.9, height: corridorHeight }, this.scene)
    leftWall.parent = root
    leftWall.position = new Vector3(0, corridorHeight / 2, width / 2)
    leftWall.material = this.makeMaterial(`dungeon_corridor_left_mat_${fromRoomId}_${toRoomId}`, new Color3(0.15, 0.14, 0.16))

    const rightWall = CreateBox(`dungeon_corridor_right_${fromRoomId}_${toRoomId}`, { width: length, depth: 0.9, height: corridorHeight }, this.scene)
    rightWall.parent = root
    rightWall.position = new Vector3(0, corridorHeight / 2, -width / 2)
    rightWall.material = this.makeMaterial(`dungeon_corridor_right_mat_${fromRoomId}_${toRoomId}`, new Color3(0.15, 0.14, 0.16))

    for (let index = 0; index < Math.max(2, Math.floor(length / 18)); index++) {
      const support = CreateBox(`dungeon_corridor_support_${fromRoomId}_${toRoomId}_${index}`, { width: 0.6, depth: width - 1.6, height: corridorHeight - 0.6 }, this.scene)
      support.parent = root
      support.position = new Vector3(-length / 2 + 8 + index * 14, corridorHeight / 2 - 0.2, 0)
      support.material = this.makeMaterial(`dungeon_corridor_support_mat_${fromRoomId}_${toRoomId}_${index}`, new Color3(0.29, 0.25, 0.22))
    }

    this.roots.push(root)
  }

  private decorateRoom(room: DungeonRoomData): void {
    const center = new Vector3(room.position.x, 0, room.position.y)

    for (let index = 0; index < 3; index++) {
      const support = CreateCylinder(`dungeon_support_${room.id}_${index}`, { height: (room.ceilingHeight ?? 6) - 0.6, diameter: 0.9 }, this.scene)
      support.position = center.add(new Vector3(-room.size.width / 3 + index * (room.size.width / 3), (room.ceilingHeight ?? 6) / 2 - 0.3, room.kind === 'final' ? -room.size.height / 4 : room.size.height / 4))
      support.material = this.makeMaterial(`dungeon_support_mat_${room.id}_${index}`, new Color3(0.24, 0.21, 0.18))
      this.roots.push(support)
    }

    if (room.kind === 'corrupted' || room.kind === 'final') {
      for (let index = 0; index < 4; index++) {
        const cluster = new TransformNode(`dungeon_rift_cluster_${room.id}_${index}`, this.scene)
        cluster.position = center.add(new Vector3(-room.size.width / 4 + index * 5, 0, room.size.height / 4 - index * 3))
        const crystal = CreatePolyhedron(`dungeon_rift_crystal_${room.id}_${index}`, { type: 1, size: room.kind === 'final' ? 3.8 : 2.2 }, this.scene)
        crystal.parent = cluster
        crystal.position.y = room.kind === 'final' ? 3.5 : 2.2
        crystal.material = this.makeMaterial(`dungeon_rift_crystal_mat_${room.id}_${index}`, room.kind === 'final' ? new Color3(0.8, 0.2, 0.95) : new Color3(0.58, 0.18, 0.7))
        const seep = CreateSphere(`dungeon_seep_${room.id}_${index}`, { diameter: room.kind === 'final' ? 5.5 : 3.2 }, this.scene)
        seep.parent = cluster
        seep.position.y = 0.15
        seep.scaling.y = 0.08
        seep.material = this.makeMaterial(`dungeon_seep_mat_${room.id}_${index}`, new Color3(0.12, 0.08, 0.15))
        this.animatedNodes.push(cluster)
        this.roots.push(cluster)
      }
    }

    for (let index = 0; index < 5; index++) {
      const mote = CreateSphere(`dungeon_mote_${room.id}_${index}`, { diameter: room.kind === 'entrance' ? 0.18 : 0.26 }, this.scene)
      mote.position = center.add(new Vector3(-room.size.width / 3 + index * 3.8, 1.5 + index * 0.4, -room.size.height / 4 + index))
      mote.material = this.makeMaterial(`dungeon_mote_mat_${room.id}_${index}`, room.kind === 'final' ? new Color3(0.58, 0.42, 0.92) : new Color3(0.32, 0.36, 0.4))
      this.roots.push(mote)
    }
  }

  private createInteractable(interactable: DungeonInteractableData): void {
    const root = new TransformNode(`dungeon_interactable_${interactable.id}`, this.scene)
    root.position = new Vector3(interactable.position.x, 0, interactable.position.y)

    const marker = interactable.kind === 'exit'
      ? CreateCylinder(`dungeon_interactable_marker_${interactable.id}`, { height: 2.8, diameter: 1.2 }, this.scene)
      : CreatePolyhedron(`dungeon_interactable_marker_${interactable.id}`, { type: 1, size: interactable.kind === 'rift_node' ? 3.2 : 2.4 }, this.scene)
    marker.parent = root
    marker.position.y = interactable.kind === 'exit' ? 1.4 : 2.2
    marker.material = this.makeMaterial(
      `dungeon_interactable_marker_mat_${interactable.id}`,
      interactable.kind === 'exit' ? new Color3(0.62, 0.56, 0.46) : interactable.kind === 'rift_node' ? new Color3(0.84, 0.24, 0.96) : new Color3(0.82, 0.62, 0.24),
    )

    this.interactables.set(interactable.id, {
      data: interactable,
      root,
      marker,
      resolved: false,
    })
    this.roots.push(root)
  }

  private makeMaterial(name: string, emissiveColor: Color3): StandardMaterial {
    const material = new StandardMaterial(name, this.scene)
    material.emissiveColor = emissiveColor
    material.specularColor = new Color3(0.08, 0.08, 0.08)
    return material
  }

  private getFloorColor(kind: DungeonRoomData['kind']): Color3 {
    switch (kind) {
      case 'entrance':
        return new Color3(0.14, 0.14, 0.15)
      case 'corrupted':
        return new Color3(0.13, 0.1, 0.14)
      case 'final':
        return new Color3(0.11, 0.08, 0.14)
      default:
        return new Color3(0.12, 0.12, 0.13)
    }
  }

  private getWallColor(kind: DungeonRoomData['kind']): Color3 {
    switch (kind) {
      case 'entrance':
        return new Color3(0.21, 0.2, 0.19)
      case 'corrupted':
        return new Color3(0.19, 0.13, 0.18)
      case 'final':
        return new Color3(0.18, 0.1, 0.2)
      default:
        return new Color3(0.17, 0.17, 0.18)
    }
  }

  private getLightColor(kind: DungeonRoomData['kind']): Color3 {
    switch (kind) {
      case 'entrance':
        return new Color3(0.45, 0.42, 0.36)
      case 'corrupted':
        return new Color3(0.5, 0.26, 0.62)
      case 'final':
        return new Color3(0.68, 0.22, 0.82)
      default:
        return new Color3(0.3, 0.3, 0.34)
    }
  }
}