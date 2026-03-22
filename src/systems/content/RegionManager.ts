import regionsData from '../../data/content/regions.json'
import type { RegionData } from '../../data/types'

export default class RegionManager {
  private regions: Record<string, RegionData> = {}

  async load(): Promise<void> {
    this.regions = (regionsData as RegionData[]).reduce((acc, region) => {
      acc[region.id] = region
      return acc
    }, {} as Record<string, RegionData>)
  }

  getRegion(id: string): RegionData | undefined {
    return this.regions[id]
  }

  getRegionById(id: string): RegionData | undefined {
    return this.regions[id]
  }

  getRegions(): RegionData[] {
    return Object.values(this.regions)
  }

  getAll(): RegionData[] {
    return Object.values(this.regions)
  }
}
