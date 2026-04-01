export type MerchantStockTier = 'common' | 'uncommon' | 'rare'

export interface MerchantStockEntry {
  itemId: string
  tier: MerchantStockTier
  requiredWorldStateTags?: string[]
}

export interface MerchantBalanceProfile {
  regionId: string
  specialty: string
  stock: MerchantStockEntry[]
}

export interface TrainerBalanceProfile {
  focus: string
  tier: number
  recommendedLevel: number
  baseXp: number
  minXp: number
  maxXp: number
  aboveLevelPenalty: number
  belowLevelBonus: number
}

export interface ResolvedMerchantStock {
  available: MerchantStockEntry[]
  locked: MerchantStockEntry[]
  highestAvailableTier: MerchantStockTier | null
}

const STOCK_TIER_WEIGHT: Record<MerchantStockTier, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
}

export const REGION_PROGRESS_TIER: Record<string, number> = {
  crydee: 1,
  forest_outskirts: 1,
  warfront_approach: 2,
  culvert_breach: 2,
  outer_roads_to_krondor: 3,
}

export const MERCHANT_BALANCE_BY_NPC_ID: Record<string, MerchantBalanceProfile> = {
  larat_merchant: {
    regionId: 'crydee',
    specialty: 'frontier provisions',
    stock: [
      { itemId: 'traveler_rations', tier: 'common' },
      { itemId: 'healing_potion', tier: 'common' },
    ],
  },
  torvin_hale: {
    regionId: 'crydee',
    specialty: 'frontier steel',
    stock: [
      { itemId: 'iron_dagger', tier: 'uncommon' },
      { itemId: 'sturdy_shield', tier: 'uncommon' },
    ],
  },
  mara_kethryn: {
    regionId: 'crydee',
    specialty: 'quiet contraband',
    stock: [
      { itemId: 'tattered_cloak', tier: 'common' },
      { itemId: 'ritual_dust', tier: 'rare', requiredWorldStateTags: ['route_krondor_secured'] },
    ],
  },
  quartermaster_sella: {
    regionId: 'warfront_approach',
    specialty: 'field requisitions',
    stock: [
      { itemId: 'traveler_rations', tier: 'common' },
      { itemId: 'trench_knife', tier: 'uncommon' },
    ],
  },
  merchant_aldric: {
    regionId: 'outer_roads_to_krondor',
    specialty: 'reopened road stock',
    stock: [
      { itemId: 'pack_mule', tier: 'uncommon' },
      { itemId: 'wardens_seal', tier: 'rare', requiredWorldStateTags: ['outer_roads_secured'] },
      { itemId: 'crydee_horse', tier: 'rare', requiredWorldStateTags: ['rift_ritual_sealed'] },
    ],
  },
}

export const TRAINER_BALANCE_BY_NPC_ID: Record<string, TrainerBalanceProfile> = {
  apprentice_mage: {
    focus: 'rift discipline',
    tier: 1,
    recommendedLevel: 1,
    baseXp: 42,
    minXp: 20,
    maxXp: 52,
    aboveLevelPenalty: 0.14,
    belowLevelBonus: 0.08,
  },
  elira_voss: {
    focus: 'arcane handling',
    tier: 1,
    recommendedLevel: 2,
    baseXp: 46,
    minXp: 24,
    maxXp: 58,
    aboveLevelPenalty: 0.12,
    belowLevelBonus: 0.06,
  },
}

export function resolveMerchantStock(
  profile: MerchantBalanceProfile,
  hasWorldStateTag: (tag: string) => boolean,
): ResolvedMerchantStock {
  const available: MerchantStockEntry[] = []
  const locked: MerchantStockEntry[] = []

  profile.stock.forEach((entry) => {
    const meetsRequirements = (entry.requiredWorldStateTags ?? []).every((tag) => hasWorldStateTag(tag))
    if (meetsRequirements) {
      available.push(entry)
      return
    }
    locked.push(entry)
  })

  available.sort((left, right) => STOCK_TIER_WEIGHT[left.tier] - STOCK_TIER_WEIGHT[right.tier])
  locked.sort((left, right) => STOCK_TIER_WEIGHT[left.tier] - STOCK_TIER_WEIGHT[right.tier])

  const highestAvailableTier = available.length > 0
    ? available.reduce((highest, entry) => {
        if (!highest || STOCK_TIER_WEIGHT[entry.tier] > STOCK_TIER_WEIGHT[highest]) {
          return entry.tier
        }
        return highest
      }, null as MerchantStockTier | null)
    : null

  return {
    available,
    locked,
    highestAvailableTier,
  }
}

export function calculateTrainingXp(profile: TrainerBalanceProfile, playerLevel: number): number {
  const levelDelta = playerLevel - profile.recommendedLevel

  let scale = 1
  if (levelDelta > 0) {
    scale = Math.max(0.55, 1 - (levelDelta * profile.aboveLevelPenalty))
  } else if (levelDelta < 0) {
    scale = Math.min(1.2, 1 + (Math.abs(levelDelta) * profile.belowLevelBonus))
  }

  const scaledXp = Math.round(profile.baseXp * scale)
  return Math.max(profile.minXp, Math.min(profile.maxXp, scaledXp))
}

export function getMerchantTierLabel(tier: MerchantStockTier | null): string {
  if (tier === 'rare') {
    return 'rare reserve stock'
  }

  if (tier === 'uncommon') {
    return 'specialist stock'
  }

  return 'frontier stock'
}