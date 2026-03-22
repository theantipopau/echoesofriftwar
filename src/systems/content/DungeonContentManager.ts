import dungeonsData from '../../data/content/dungeons.json'
import type { DungeonData } from '../../data/types'

export default class DungeonContentManager {
  private dungeons: Record<string, DungeonData> = {}

  async load(): Promise<void> {
    this.dungeons = (dungeonsData as DungeonData[]).reduce((accumulator, dungeon) => {
      accumulator[dungeon.id] = dungeon
      return accumulator
    }, {} as Record<string, DungeonData>)
  }

  public getDungeon(id: string): DungeonData | undefined {
    return this.dungeons[id]
  }

  public getByEntry(regionId: string, poiId: string): DungeonData | undefined {
    return Object.values(this.dungeons).find((dungeon) => dungeon.entryRegionId === regionId && dungeon.entryPoiId === poiId)
  }

  public getDungeons(): DungeonData[] {
    return Object.values(this.dungeons)
  }
}