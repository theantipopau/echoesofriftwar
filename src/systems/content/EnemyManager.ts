import enemiesData from '../../data/content/enemies.json'
import type { EnemyData } from '../../data/types'

export default class EnemyManager {
  private enemies: Record<string, EnemyData> = {}

  async load(): Promise<void> {
    this.enemies = (enemiesData as EnemyData[]).reduce((acc, enemy) => {
      acc[enemy.id] = enemy
      return acc
    }, {} as Record<string, EnemyData>)
  }

  getEnemy(id: string): EnemyData | undefined {
    return this.enemies[id]
  }

  getEnemies(): EnemyData[] {
    return Object.values(this.enemies)
  }

  getAll(): EnemyData[] {
    return Object.values(this.enemies)
  }
}
