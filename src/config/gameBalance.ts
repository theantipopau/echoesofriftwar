export const PLAYER_SETTINGS = {
  baseHealth: 100,
  baseMana: 50,
  baseSpeed: 15,
  baseAttack: 10,
  baseDefense: 1,
  attackDelaySeconds: 0.5,
  attackWindupSeconds: 0.12,
  dodgeCooldownSeconds: 0.8,
  dodgeDurationSeconds: 0.24,
  dodgeInvulnerabilitySeconds: 0.18,
  dodgeSpeedMultiplier: 2.8,
  dodgeManaCost: 14,
  manaRegenPerSecond: 5,
  levelHealthGain: 10,
  levelManaGain: 5,
  baseExperiencePerLevel: 100,
}

export const ENEMY_SETTINGS = {
  patrolRange: 10,
  attackRange: 3,
  attackWindupSeconds: 0.42,
  attackCooldownSeconds: 1.5,
  aggroRadius: 15,
}

export const WORLD_SETTINGS = {
  enemySpawnLimit: 6,
  enemySpawnBaseRadius: 80,
  enemySpawnRadiusStep: 24,
  interactionRange: 35,
  interactionCooldownSeconds: 0.4,
  playerAttackRange: 5,
  lootPickupRange: 8,
  poiVisitRange: 24,
}