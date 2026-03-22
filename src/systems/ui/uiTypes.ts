export interface InventoryViewItem {
  id: string
  name: string
  type: string
  rarity: string
  description: string
  stats: Record<string, number | undefined>
}

export interface InventoryViewState {
  items: InventoryViewItem[]
  equipment: Array<{ slot: string; item: InventoryViewItem | null }>
  stats: {
    attack: number
    defense: number
    maxHealth: number
    maxMana: number
    speed: number
  }
}

export interface DialogueViewState {
  name: string
  text: string
  options: Array<{ id: string; text: string }>
}

export interface QuestViewState {
  id: string
  title: string
  complete: boolean
  objectives: Array<{
    id: string
    description: string
    current: number
    target: number
    complete: boolean
  }>
}

export interface RegionProgressViewState {
  currentRegion: {
    id: string
    name: string
    description: string
    dangerLevel: number
    recommendedLevel?: number
  } | null
  routes: Array<{
    id: string
    name: string
    description: string
    unlocked: boolean
    playable?: boolean
    dangerLevel: number
    recommendedLevel?: number
  }>
}