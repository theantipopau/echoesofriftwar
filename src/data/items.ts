export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export type ItemType = 'weapon' | 'armor' | 'accessory'

export type EquipmentSlot = 'head' | 'chest' | 'legs' | 'weapon' | 'offhand' | 'accessory'

export interface ItemStats {
  attack?: number
  defense?: number
  maxHealth?: number
  maxMana?: number
}

export interface ItemDefinition {
  id: string
  name: string
  description: string
  type: ItemType
  slot: EquipmentSlot
  rarity: ItemRarity
  stats: ItemStats
  // Sprite used for UI inventory icons
  spriteKey: string
  // Optional player overlay sprite (should match player dimensions)
  playerSpriteKey?: string
}

export const ItemDefinitions: Record<string, ItemDefinition> = {
  bronze_sword: {
    id: 'bronze_sword',
    name: 'Bronze Sword',
    description: 'A simple sword used by frontier guards.',
    type: 'weapon',
    slot: 'weapon',
    rarity: 'common',
    stats: { attack: 2 },
    spriteKey: 'item_bronze_sword',
    playerSpriteKey: 'player_weapon'
  },
  leather_armor: {
    id: 'leather_armor',
    name: 'Leather Armor',
    description: 'Basic leather armor, light and flexible.',
    type: 'armor',
    slot: 'chest',
    rarity: 'common',
    stats: { defense: 1 },
    spriteKey: 'item_leather_armor',
    playerSpriteKey: 'player_chest'
  }
}
