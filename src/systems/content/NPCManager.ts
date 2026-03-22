import npcsData from '../../data/content/npcs.json'
import type { NpcData } from '../../data/types'

export default class NPCManager {
  private npcs: Record<string, NpcData> = {}

  async load(): Promise<void> {
    // JSON data may not exactly match the TypeScript type, so cast via unknown.
    const parsed = npcsData as unknown as NpcData[]
    this.npcs = parsed.reduce((acc, npc) => {
      acc[npc.id] = npc
      return acc
    }, {} as Record<string, NpcData>)
  }

  getNpc(id: string): NpcData | undefined {
    return this.npcs[id]
  }

  getNPCs(): NpcData[] {
    return Object.values(this.npcs)
  }

  getAll(): NpcData[] {
    return Object.values(this.npcs)
  }

  getByRegion(regionId: string): NpcData[] {
    return Object.values(this.npcs).filter((n) => n.regionId === regionId)
  }
}
