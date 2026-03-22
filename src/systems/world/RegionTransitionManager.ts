import { Regions, RegionDefinition } from '../../config/regions'

export type RegionState = RegionDefinition & {
  unlocked: boolean
}

export default class RegionTransitionManager {
  private unlocked = new Set<string>()
  private currentRegionId: string
  private lastSelectedRegionId?: string

  constructor() {
    for (const region of Regions) {
      if (region.unlockedByDefault) {
        this.unlocked.add(region.id)
      }
    }
    this.currentRegionId = Regions.find((r) => r.unlockedByDefault)?.id ?? Regions[0].id
  }

  getCurrentRegionId() {
    return this.currentRegionId
  }

  setCurrentRegion(id: string) {
    this.currentRegionId = id
  }

  setLastSelectedRegion(id: string) {
    this.lastSelectedRegionId = id
  }

  getLastSelectedRegion(): string | undefined {
    return this.lastSelectedRegionId
  }

  getAllRegions(): RegionState[] {
    return Regions.map((r) => ({ ...r, unlocked: this.unlocked.has(r.id) }))
  }

  getRegion(id: string): RegionState | undefined {
    const def = Regions.find((r) => r.id === id)
    if (!def) return undefined
    return { ...def, unlocked: this.unlocked.has(def.id) }
  }

  isUnlocked(id: string) {
    return this.unlocked.has(id)
  }

  unlock(id: string) {
    if (this.unlocked.has(id)) return false
    this.unlocked.add(id)
    return true
  }

  unlockByQuest(questId: string): RegionState[] {
    const unlocked: RegionState[] = []
    for (const region of Regions) {
      if (!region.unlockQuestId) continue
      if (region.unlockQuestId !== questId) continue
      if (this.unlocked.has(region.id)) continue
      this.unlocked.add(region.id)
      unlocked.push({ ...region, unlocked: true })
    }
    return unlocked
  }
}

export const regionTransitionManager = new RegionTransitionManager()
