export type FastTravelNode = {
  id: string
  name: string
  x: number
  y: number
}

export type PointOfInterest = {
  id: string
  name: string
  type: 'town' | 'dungeon' | 'rift' | 'camp'
  x: number
  y: number
}

export type RegionConfig = {
  id: string
  name: string
  description: string
  connections: string[]
  fastTravelNodes: FastTravelNode[]
  pointsOfInterest: PointOfInterest[]
  spawnTables: Array<{ category: 'wild' | 'patrol' | 'rift'; weight: number; enemies: string[] }>
  npcSpawns: Array<{ templateId: string; x: number; y: number; guardRadius?: number }>
}
