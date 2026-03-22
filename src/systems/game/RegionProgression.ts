import type { RegionData } from '../../data/types'
import type { RegionProgressViewState } from '../ui/uiTypes'
import type RegionManager from '../content/RegionManager'

export interface RegionProgressionSnapshot {
  unlockedRegionIds: string[]
  completedQuestIds: string[]
  discoveredPoiIds: string[]
  resolvedEncounterIds: string[]
  clearedDungeonIds: string[]
  claimedDungeonRewardIds: string[]
  worldStateTags: string[]
  currentRegionId: string
}

export class RegionProgression {
  private unlockedRegionIds = new Set<string>()
  private completedQuestIds = new Set<string>()
  private discoveredPoiIds = new Set<string>()
  private resolvedEncounterIds = new Set<string>()
  private clearedDungeonIds = new Set<string>()
  private claimedDungeonRewardIds = new Set<string>()
  private worldStateTags = new Set<string>()
  private currentRegionId = ''

  constructor(private readonly regionManager: RegionManager) {}

  public initialize(initialRegionId: string): void {
    this.regionManager.getRegions().forEach((region) => {
      if (region.unlockedByDefault) {
        this.unlockedRegionIds.add(region.id)
      }
    })

    this.unlockedRegionIds.add(initialRegionId)
    this.currentRegionId = initialRegionId
    this.evaluateUnlocks()
  }

  public setCurrentRegion(regionId: string): void {
    if (this.unlockedRegionIds.has(regionId)) {
      this.currentRegionId = regionId
    }
  }

  public isRegionUnlocked(regionId: string): boolean {
    return this.unlockedRegionIds.has(regionId)
  }

  public getCurrentRegionId(): string {
    return this.currentRegionId
  }

  public hasDiscoveredPoi(poiId: string): boolean {
    return this.discoveredPoiIds.has(poiId)
  }

  public onPoiDiscovered(poiId: string): RegionData[] {
    this.discoveredPoiIds.add(poiId)
    return this.evaluateUnlocks()
  }

  public onQuestsCompleted(questIds: string[]): RegionData[] {
    questIds.forEach((questId) => this.completedQuestIds.add(questId))
    return this.evaluateUnlocks()
  }

  public setWorldStateTag(tag: string): RegionData[] {
    if (!tag) {
      return []
    }

    this.worldStateTags.add(tag)
    return this.evaluateUnlocks()
  }

  public hasWorldStateTag(tag: string): boolean {
    return this.worldStateTags.has(tag)
  }

  public getSnapshot(): RegionProgressionSnapshot {
    return {
      unlockedRegionIds: Array.from(this.unlockedRegionIds),
      completedQuestIds: Array.from(this.completedQuestIds),
      discoveredPoiIds: Array.from(this.discoveredPoiIds),
      resolvedEncounterIds: Array.from(this.resolvedEncounterIds),
      clearedDungeonIds: Array.from(this.clearedDungeonIds),
      claimedDungeonRewardIds: Array.from(this.claimedDungeonRewardIds),
      worldStateTags: Array.from(this.worldStateTags),
      currentRegionId: this.currentRegionId,
    }
  }

  public restoreFromSnapshot(snapshot: RegionProgressionSnapshot): void {
    const validRegionIds = new Set(this.regionManager.getRegions().map((region) => region.id))

    this.unlockedRegionIds = new Set((snapshot.unlockedRegionIds ?? []).filter((regionId) => validRegionIds.has(regionId)))
    this.completedQuestIds = new Set(snapshot.completedQuestIds ?? [])
    this.discoveredPoiIds = new Set(snapshot.discoveredPoiIds ?? [])
    this.resolvedEncounterIds = new Set(snapshot.resolvedEncounterIds ?? [])
    this.clearedDungeonIds = new Set(snapshot.clearedDungeonIds ?? [])
    this.claimedDungeonRewardIds = new Set(snapshot.claimedDungeonRewardIds ?? [])
    this.worldStateTags = new Set(snapshot.worldStateTags ?? [])

    if (!this.unlockedRegionIds.has(snapshot.currentRegionId)) {
      const firstRegion = Array.from(this.unlockedRegionIds)[0] ?? ''
      this.currentRegionId = firstRegion
    } else {
      this.currentRegionId = snapshot.currentRegionId
    }

    this.evaluateUnlocks()
  }

  public isEncounterResolved(encounterId: string): boolean {
    return this.resolvedEncounterIds.has(encounterId)
  }

  public markEncounterResolved(encounterId: string): void {
    this.resolvedEncounterIds.add(encounterId)
  }

  public isDungeonCleared(dungeonId: string): boolean {
    return this.clearedDungeonIds.has(dungeonId)
  }

  public markDungeonCleared(dungeonId: string): void {
    this.clearedDungeonIds.add(dungeonId)
  }

  public hasClaimedDungeonReward(dungeonId: string): boolean {
    return this.claimedDungeonRewardIds.has(dungeonId)
  }

  public markDungeonRewardClaimed(dungeonId: string): void {
    this.claimedDungeonRewardIds.add(dungeonId)
  }

  public getUnlockHint(regionId: string): string {
    const region = this.regionManager.getRegionById(regionId)
    if (!region?.unlockRequirements) {
      return `The route to ${region?.name ?? regionId} is not yet ready.`
    }

    const missing: string[] = []
    region.unlockRequirements.requiredQuestIds?.forEach((questId) => {
      if (!this.completedQuestIds.has(questId)) {
        missing.push('finish the frontier questline')
      }
    })
    region.unlockRequirements.requiredPoiIds?.forEach((poiId) => {
      if (!this.discoveredPoiIds.has(poiId)) {
        missing.push('investigate the marked frontier sites')
      }
    })
    region.unlockRequirements.requiredWorldStateTags?.forEach((tag) => {
      if (!this.worldStateTags.has(tag)) {
        missing.push('stabilize the road and relay line')
      }
    })

    if (missing.length === 0) {
      return `The route to ${region.name} is almost secure.`
    }

    return `To reach ${region.name}, ${missing[0]}.`
  }

  public getViewState(): RegionProgressViewState {
    const currentRegion = this.regionManager.getRegionById(this.currentRegionId)
    return {
      currentRegion: currentRegion
        ? {
            id: currentRegion.id,
            name: currentRegion.name,
            description: currentRegion.description,
            dangerLevel: currentRegion.dangerLevel,
            recommendedLevel: currentRegion.recommendedLevel,
          }
        : null,
      routes: (currentRegion?.connectedRegionIds ?? [])
        .map((regionId) => this.regionManager.getRegionById(regionId))
        .filter((region): region is RegionData => Boolean(region))
        .map((region) => ({
          id: region.id,
          name: region.name,
          description: region.description,
          unlocked: this.unlockedRegionIds.has(region.id),
          playable: region.playable ?? true,
          dangerLevel: region.dangerLevel,
          recommendedLevel: region.recommendedLevel,
        })),
    }
  }

  private evaluateUnlocks(): RegionData[] {
    const unlocked: RegionData[] = []

    this.regionManager.getRegions().forEach((region) => {
      if (this.unlockedRegionIds.has(region.id)) {
        return
      }

      if (!this.canUnlock(region)) {
        return
      }

      this.unlockedRegionIds.add(region.id)
      unlocked.push(region)
    })

    return unlocked
  }

  private canUnlock(region: RegionData): boolean {
    if (region.unlockedByDefault) {
      return true
    }

    if (!region.unlockRequirements) {
      return false
    }

    const questsComplete = (region.unlockRequirements.requiredQuestIds ?? []).every((questId) => this.completedQuestIds.has(questId))
    const poisDiscovered = (region.unlockRequirements.requiredPoiIds ?? []).every((poiId) => this.discoveredPoiIds.has(poiId))
    const worldStateMet = (region.unlockRequirements.requiredWorldStateTags ?? []).every((tag) => this.worldStateTags.has(tag))
    return questsComplete && poisDiscovered && worldStateMet
  }
}