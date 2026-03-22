import type { EnemyData } from './types'

export const EnemyDefinitions: Record<string, EnemyData> = {
  goblin: {
    id: 'goblin',
    name: 'Goblin',
    type: 'goblin',
    spriteKey: 'enemy_goblin',
    stats: { maxHealth: 20, attack: 3, speed: 60 },
    behavior: 'aggro',
    lootTable: [{ itemId: 'bronze_sword', chance: 0.05 }]
  },
  bandit: {
    id: 'bandit',
    name: 'Bandit',
    type: 'bandit',
    spriteKey: 'enemy_bandit',
    stats: { maxHealth: 28, attack: 4, speed: 70 },
    behavior: 'aggro',
    lootTable: [{ itemId: 'iron_dagger', chance: 0.1 }]
  },
  rift_hound: {
    id: 'rift_hound',
    name: 'Rift Hound',
    type: 'rift_hound',
    spriteKey: 'enemy_rift_hound',
    stats: { maxHealth: 35, attack: 5, speed: 80 },
    behavior: 'aggro',
    lootTable: [{ itemId: 'ritual_dust', chance: 0.14 }]
  }
}
