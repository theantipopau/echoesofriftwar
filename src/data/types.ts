// Core data models for content-driven world building.

export type ItemType = 'weapon' | 'armor' | 'consumable' | 'material' | 'quest' | 'mount' | 'relic'
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface ItemStats {
  attack?: number
  defense?: number
  maxHealth?: number
  maxMana?: number
  crit?: number
  speed?: number
}

export interface ItemData {
  id: string
  name: string
  type: ItemType
  rarity: ItemRarity
  stats: ItemStats
  description: string
  loreText?: string
  visual: {
    spriteKey: string
    tint?: number
    layer?: 'base' | 'weapon' | 'armor' | 'accessory'
  }
}

export type EquipmentSlot = 'head' | 'chest' | 'legs' | 'weapon' | 'offhand' | 'accessory'

export interface EquipmentData {
  itemId: string
  slot: EquipmentSlot
  modifiers: ItemStats
  visualLayer: 'head' | 'chest' | 'weapon' | 'offhand' | 'accessory'
}

export type DialogueOption = {
  id: string
  text: string
  next?: string
  actions?: string[]
}

export type DialogueNode = {
  id: string
  text: string
  options?: DialogueOption[]
}

export interface DialogueStartCondition {
  nodeId: string
  requiredWorldStateTags?: string[]
  blockedWorldStateTags?: string[]
  requiredQuestIds?: string[]
  activeQuestIds?: string[]
  requiredItemIds?: string[]
}

export interface NpcData {
  id: string
  name: string
  role: 'merchant' | 'quest' | 'trainer' | 'story' | 'neutral'
  faction?: string
  regionId: string
  position: { x: number; y: number }
  portraitKey: string
  shortBio: string
  requiredWorldStateTags?: string[]
  blockedWorldStateTags?: string[]
  conditionalStartNodes?: DialogueStartCondition[]
  dialogueTree: Record<string, DialogueNode>
}

export type EnemyType = 'goblin' | 'bandit' | 'rift_hound' | 'raider' | 'wretch'

export interface EnemyStats {
  maxHealth: number
  attack: number
  speed: number
}

export type EnemyModifier = 'shielded' | 'fast' | 'tanky' | 'elemental' | 'explosive' | 'teleporter'

export interface EnemyData {
  id: string
  name: string
  type: EnemyType
  stats: EnemyStats
  behavior: 'patrol' | 'aggro' | 'static'
  lootTable: Array<{ itemId: string; chance: number }>
  spriteKey: string
  isElite?: boolean
  modifiers?: EnemyModifier[]
}

export interface RegionPOI {
  id: string
  name: string
  type: 'town' | 'dungeon' | 'rift' | 'camp' | 'fort' | 'road'
  position: { x: number; y: number }
}

export interface RegionTransition {
  poiId: string
  toRegionId: string
  label: string
  description: string
}

export interface RegionUnlockRequirements {
  requiredQuestIds?: string[]
  requiredPoiIds?: string[]
  requiredWorldStateTags?: string[]
}

export interface RegionSpecialEncounter {
  id: string
  poiId: string
  enemyId?: string
  dungeonId?: string
  title: string
  description: string
  spawnOffset?: { x: number; y: number }
}

export interface RegionSpawnPoint {
  id: string
  position: { x: number; y: number }
  enemyIds?: string[]
}

export interface RegionStateProp {
  id: string
  kind: 'crate' | 'signal' | 'banner' | 'brazier' | 'beacon' | 'supplies'
  position: { x: number; y: number }
}

export interface RegionStateVariant {
  id: string
  requiredWorldStateTags: string[]
  additionalNpcIds?: string[]
  additionalTransitionPoints?: RegionTransition[]
  additionalProps?: RegionStateProp[]
}

export interface RegionData {
  id: string
  name: string
  description: string
  biome: 'forest' | 'coast' | 'wilderness' | 'city' | 'ruins' | 'warfront'
  dangerLevel: number
  recommendedLevel?: number
  unlockedByDefault?: boolean
  playable?: boolean
  enemyPool: string[]
  npcPool: string[]
  connectedRegionIds: string[]
  pointsOfInterest: RegionPOI[]
  fastTravelNodes: Array<{ id: string; name: string; position: { x: number; y: number } }>
  unlockRequirements?: RegionUnlockRequirements
  transitionPoints?: RegionTransition[]
  specialEncounters?: RegionSpecialEncounter[]
  spawnPoints?: RegionSpawnPoint[]
  stateVariants?: RegionStateVariant[]
  startPosition?: { x: number; y: number }
}

export interface DungeonRoomData {
  id: string
  kind: 'entrance' | 'passage' | 'corrupted' | 'final'
  position: { x: number; y: number }
  size: { width: number; height: number }
  ceilingHeight?: number
}

export interface DungeonCorridorData {
  id: string
  fromRoomId: string
  toRoomId: string
  width: number
}

export interface DungeonEncounterData {
  id: string
  position: { x: number; y: number }
  enemyIds: string[]
  title?: string
}

export interface DungeonInteractableData {
  id: string
  kind: 'exit' | 'cache' | 'rift_node'
  label: string
  position: { x: number; y: number }
  activation: 'auto' | 'interact'
  questVisitId?: string
  grantsItemId?: string
  message?: string
  requiresEncounterId?: string
  oneTime?: boolean
}

export interface DungeonData {
  id: string
  name: string
  description: string
  entryRegionId: string
  entryPoiId: string
  questId?: string
  completionEncounterId?: string
  rewardItemId?: string
  returnOffset?: { x: number; y: number }
  startPosition: { x: number; y: number }
  rooms: DungeonRoomData[]
  corridors: DungeonCorridorData[]
  encounters: DungeonEncounterData[]
  interactables: DungeonInteractableData[]
}

export interface QuestObjective {
  id: string
  description: string
  type: 'kill' | 'collect' | 'talk' | 'visit'
  targetId?: string
  count?: number
  requiredObjectiveIds?: string[]
}

export interface QuestReward {
  experience?: number
  gold?: number
  itemId?: string
}

export interface QuestData {
  id: string
  title: string
  description: string
  objectives: QuestObjective[]
  rewards: QuestReward[]
  linkedNpcs: string[]
  branching?: boolean
}
