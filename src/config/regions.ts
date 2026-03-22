export type RegionDefinition = {
  id: string
  name: string
  description: string
  sceneKey: string
  worldX: number
  worldY: number
  unlockedByDefault?: boolean
  unlockQuestId?: string
  recommendedLevel?: number
}

export const Regions: RegionDefinition[] = [
  {
    id: 'crydee',
    name: 'Crydee',
    description: 'The frontier town of Crydee, where adventures begin.',
    sceneKey: 'GameScene',
    worldX: 220,
    worldY: 240,
    unlockedByDefault: true,
    recommendedLevel: 1
  },
  {
    id: 'forest_outskirts',
    name: 'Forest Outskirts',
    description: 'The wooded edges around Crydee, full of beasts and hidden trails.',
    sceneKey: 'GameScene',
    worldX: 360,
    worldY: 180,
    unlockedByDefault: false,
    unlockQuestId: 'quest_guardians_help',
    recommendedLevel: 2
  },
  {
    id: 'krondor',
    name: 'Krondor',
    description: 'The ancient city of Krondor, a hub of trade and intrigue.',
    sceneKey: 'GameScene',
    worldX: 520,
    worldY: 220,
    unlockedByDefault: false,
    recommendedLevel: 4
  },
  {
    id: 'warfront',
    name: 'Warfront',
    description: 'A battlefield where armies clash and danger lurks.',
    sceneKey: 'GameScene',
    worldX: 600,
    worldY: 120,
    unlockedByDefault: false,
    recommendedLevel: 6
  },
  {
    id: 'stardock',
    name: 'Stardock',
    description: 'A mystic port where ships sail the astral seas.',
    sceneKey: 'GameScene',
    worldX: 440,
    worldY: 340,
    unlockedByDefault: false,
    recommendedLevel: 8
  }
]
