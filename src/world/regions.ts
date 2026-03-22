import { RegionConfig } from './regionConfig'

export const Regions: Record<string, RegionConfig> = {
  crydee: {
    id: 'crydee',
    name: 'Crydee Frontier',
    description: 'A coastal duchy on the edge of the Western Realm, recently shaken by rifts and incursions.',
    connections: ['western_wilderness'],
    fastTravelNodes: [
      { id: 'crydee_keep', name: 'Crydee Keep', x: 400, y: 320 },
      { id: 'larat_village', name: 'Larat Village', x: 600, y: 520 }
    ],
    pointsOfInterest: [
      { id: 'crydee_keep', name: 'Crydee Keep', type: 'town', x: 400, y: 320 },
      { id: 'crydee_forest_ruins', name: 'Forest Ruins', type: 'dungeon', x: 200, y: 420 },
      { id: 'rift_site_01', name: 'Rift Site', type: 'rift', x: 700, y: 180 }
    ],
    spawnTables: [
      { category: 'wild', weight: 70, enemies: ['goblin', 'bandit'] },
      { category: 'rift', weight: 30, enemies: ['rift_hound'] }
    ],
    npcSpawns: [
      { templateId: 'crydee_guard', x: 520, y: 300 }
    ]
  }
}
