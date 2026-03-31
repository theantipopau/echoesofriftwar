import type { CharacterModelSpec } from './characterModelRegistry'
import { Color3 } from '@babylonjs/core/Maths/math.color'

const OUTFIT_BASE = 'models/outfits/'

const MALE_RANGER: CharacterModelSpec = { folder: OUTFIT_BASE, file: 'Male_Ranger.gltf', scale: 0.95, yOffset: -1.08 }
const FEMALE_RANGER: CharacterModelSpec = { folder: OUTFIT_BASE, file: 'Female_Ranger.gltf', scale: 0.95, yOffset: -1.08 }
const MALE_PEASANT: CharacterModelSpec = { folder: OUTFIT_BASE, file: 'Male_Peasant.gltf', scale: 0.95, yOffset: -1.08 }
const FEMALE_PEASANT: CharacterModelSpec = { folder: OUTFIT_BASE, file: 'Female_Peasant.gltf', scale: 0.95, yOffset: -1.08 }

function variant(base: CharacterModelSpec, overrides: Partial<CharacterModelSpec>): CharacterModelSpec {
  return {
    ...base,
    ...overrides,
    tint: overrides.tint ?? base.tint,
  }
}

const WARDEN_GOLD = new Color3(0.82, 0.74, 0.54)
const RANGER_GREEN = new Color3(0.54, 0.67, 0.52)
const MERCHANT_MAROON = new Color3(0.63, 0.44, 0.36)
const SCHOLAR_BLUE = new Color3(0.45, 0.55, 0.72)
const CLERGY_IVORY = new Color3(0.72, 0.7, 0.62)
const RIFT_VIOLET = new Color3(0.58, 0.38, 0.74)
const ASH_BROWN = new Color3(0.42, 0.34, 0.28)
const SICKLY_GREEN = new Color3(0.46, 0.6, 0.42)
const BANDIT_RED = new Color3(0.64, 0.37, 0.34)

const ROAD_WARDEN_MALE = variant(MALE_RANGER, { tint: { color: WARDEN_GOLD, emissive: new Color3(0.08, 0.07, 0.03) } })
const ROAD_WARDEN_FEMALE = variant(FEMALE_RANGER, { tint: { color: WARDEN_GOLD, emissive: new Color3(0.08, 0.07, 0.03) } })
const CRYDEE_RANGER_MALE = variant(MALE_RANGER, { tint: { color: RANGER_GREEN, emissive: new Color3(0.04, 0.06, 0.04) } })
const CRYDEE_RANGER_FEMALE = variant(FEMALE_RANGER, { tint: { color: RANGER_GREEN, emissive: new Color3(0.04, 0.06, 0.04) } })
const MERCHANT_MALE = variant(MALE_PEASANT, { tint: { color: MERCHANT_MAROON, emissive: new Color3(0.05, 0.03, 0.02) } })
const MERCHANT_FEMALE = variant(FEMALE_PEASANT, { tint: { color: MERCHANT_MAROON, emissive: new Color3(0.05, 0.03, 0.02) } })
const SCHOLAR_FEMALE = variant(FEMALE_PEASANT, { tint: { color: SCHOLAR_BLUE, emissive: new Color3(0.03, 0.04, 0.06) } })
const SCHOLAR_MALE = variant(MALE_PEASANT, { tint: { color: SCHOLAR_BLUE, emissive: new Color3(0.03, 0.04, 0.06) } })
const CLERGY_MALE = variant(MALE_PEASANT, { tint: { color: CLERGY_IVORY, emissive: new Color3(0.05, 0.05, 0.04) } })
const ELDER_MALE = variant(MALE_PEASANT, { scale: 0.9, tint: { color: new Color3(0.58, 0.56, 0.52), emissive: new Color3(0.03, 0.03, 0.03) } })
const CONVOY_FEMALE = variant(FEMALE_RANGER, { tint: { color: new Color3(0.67, 0.52, 0.42), emissive: new Color3(0.05, 0.04, 0.03) } })
const ENGINEER_MALE = variant(MALE_PEASANT, { tint: { color: new Color3(0.58, 0.48, 0.36), emissive: new Color3(0.05, 0.04, 0.03) } })
const RIFT_TOUCHED_FEMALE = variant(FEMALE_RANGER, { tint: { color: RIFT_VIOLET, emissive: new Color3(0.12, 0.05, 0.14) } })
const ASHBOUND_MALE = variant(MALE_PEASANT, { tint: { color: ASH_BROWN, emissive: new Color3(0.05, 0.03, 0.02) } })
const BANDIT_MALE = variant(MALE_PEASANT, { tint: { color: BANDIT_RED, emissive: new Color3(0.07, 0.03, 0.03) } })
const BANDIT_CAPTAIN = variant(MALE_RANGER, { tint: { color: BANDIT_RED, emissive: new Color3(0.09, 0.03, 0.03) } })
const GOBLIN_RAIDER = variant(MALE_PEASANT, { scale: 0.88, tint: { color: SICKLY_GREEN, emissive: new Color3(0.04, 0.06, 0.03) } })
const GOBLIN_ELITE = variant(MALE_RANGER, { scale: 0.9, tint: { color: new Color3(0.52, 0.7, 0.34), emissive: new Color3(0.08, 0.1, 0.05) } })
const RIFT_HARBINGER_MODEL = variant(FEMALE_RANGER, { scale: 1.05, tint: { color: RIFT_VIOLET, emissive: new Color3(0.16, 0.05, 0.18) } })
const RIFT_OVERSEER_MODEL = variant(MALE_RANGER, { scale: 1.03, tint: { color: new Color3(0.52, 0.42, 0.68), emissive: new Color3(0.12, 0.05, 0.14) } })
const SAPper_MODEL = variant(MALE_PEASANT, { scale: 0.98, tint: { color: new Color3(0.56, 0.46, 0.7), emissive: new Color3(0.1, 0.05, 0.12) } })
const WRETCH_HUMANOID = variant(FEMALE_PEASANT, { tint: { color: new Color3(0.48, 0.54, 0.42), emissive: new Color3(0.04, 0.05, 0.03) } })

export const PLAYER_MODEL_SPEC: CharacterModelSpec = MALE_RANGER

export const NPC_MODEL_BY_ID: Record<string, CharacterModelSpec> = {
  // Crydee frontier
  crydee_guard: ROAD_WARDEN_MALE,
  larat_merchant: MERCHANT_MALE,
  apprentice_mage: SCHOLAR_FEMALE,
  village_elder: ELDER_MALE,
  beren_thal: CRYDEE_RANGER_MALE,
  elira_voss: variant(FEMALE_RANGER, { tint: { color: SCHOLAR_BLUE, emissive: new Color3(0.05, 0.05, 0.08) } }),
  torvin_hale: variant(MALE_PEASANT, { tint: { color: new Color3(0.52, 0.4, 0.3), emissive: new Color3(0.06, 0.03, 0.02) } }),
  mara_kethryn: MERCHANT_FEMALE,
  brother_caldus: CLERGY_MALE,
  // Forest Outskirts
  lost_scout: CRYDEE_RANGER_MALE,
  herbalist_myla: variant(FEMALE_PEASANT, { tint: { color: new Color3(0.46, 0.62, 0.44), emissive: new Color3(0.03, 0.05, 0.03) } }),
  // Warfront Approach
  captain_rennic: ROAD_WARDEN_MALE,
  scout_tavia: CRYDEE_RANGER_FEMALE,
  camp_marshal_iona: CONVOY_FEMALE,
  relay_engineer_ves: ENGINEER_MALE,
  roadwarden_hal: ROAD_WARDEN_MALE,
  quartermaster_sella: MERCHANT_FEMALE,
  // Outer Roads
  veteran_kess: ROAD_WARDEN_FEMALE,
  dispatcher_galt: SCHOLAR_MALE,
  merchant_aldric: MERCHANT_MALE,
  warden_thorne: ROAD_WARDEN_MALE,
  chronicler_nara: variant(FEMALE_PEASANT, { tint: { color: new Color3(0.54, 0.52, 0.62), emissive: new Color3(0.04, 0.04, 0.06) } }),
  signalmaster_oren: ROAD_WARDEN_MALE,
}

export const ENEMY_MODEL_BY_ID: Record<string, CharacterModelSpec> = {
  goblin_elite: GOBLIN_ELITE,
  bandit_captain: BANDIT_CAPTAIN,
  trench_raider: ROAD_WARDEN_MALE,
  ashbound_deserter: ASHBOUND_MALE,
  war_wretch: WRETCH_HUMANOID,
  rift_sapper: SAPper_MODEL,
  culvert_brood: WRETCH_HUMANOID,
  culvert_overseer: RIFT_OVERSEER_MODEL,
  rift_harbinger: RIFT_HARBINGER_MODEL,
}

export const ENEMY_MODEL_BY_TYPE: Partial<Record<string, CharacterModelSpec>> = {
  raider: ROAD_WARDEN_MALE,
  bandit: BANDIT_MALE,
  goblin: GOBLIN_RAIDER,
}
