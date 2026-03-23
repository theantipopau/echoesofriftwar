import type { CharacterModelSpec } from './characterModelRegistry'

const OUTFIT_BASE = 'models/outfits/'

const MALE_RANGER: CharacterModelSpec = { folder: OUTFIT_BASE, file: 'Male_Ranger.gltf', scale: 0.95, yOffset: -1.08 }
const FEMALE_RANGER: CharacterModelSpec = { folder: OUTFIT_BASE, file: 'Female_Ranger.gltf', scale: 0.95, yOffset: -1.08 }
const MALE_PEASANT: CharacterModelSpec = { folder: OUTFIT_BASE, file: 'Male_Peasant.gltf', scale: 0.95, yOffset: -1.08 }
const FEMALE_PEASANT: CharacterModelSpec = { folder: OUTFIT_BASE, file: 'Female_Peasant.gltf', scale: 0.95, yOffset: -1.08 }

export const PLAYER_MODEL_SPEC: CharacterModelSpec = MALE_RANGER

export const NPC_MODEL_BY_ID: Record<string, CharacterModelSpec> = {
  captain_rennic: MALE_RANGER,
  scout_tavia: FEMALE_RANGER,
  camp_marshal_iona: FEMALE_RANGER,
  beren_thal: MALE_RANGER,
  crydee_guard: MALE_RANGER,
  torvin_hale: MALE_PEASANT,
  larat_merchant: MALE_PEASANT,
  mara_kethryn: FEMALE_PEASANT,
}

export const ENEMY_MODEL_BY_ID: Record<string, CharacterModelSpec> = {
  trench_raider: MALE_RANGER,
  ashbound_deserter: MALE_PEASANT,
  siege_hound: FEMALE_PEASANT,
  war_wretch: FEMALE_RANGER,
}

export const ENEMY_MODEL_BY_TYPE: Record<string, CharacterModelSpec> = {
  raider: MALE_RANGER,
  wretch: FEMALE_PEASANT,
  bandit: MALE_PEASANT,
  goblin: MALE_PEASANT,
  rift_hound: FEMALE_RANGER,
}
