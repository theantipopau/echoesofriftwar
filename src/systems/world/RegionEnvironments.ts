/**
 * Environment configuration for each region
 * Defines building placement, props, and layout
 */

export interface RegionEnvironmentConfig {
  regionId: string
  buildings: EnvironmentBuildingSpec[]
  props: EnvironmentPropSpec[]
  vegetation: EnvironmentVegetationSpec[]
}

export interface EnvironmentBuildingSpec {
  id: string
  model: string  // glTF file name from buildings folder
  x: number
  z: number
  rotation?: number        // Y-axis rotation in radians
  scale?: number           // Uniform scale
  poiId?: string          // Links to POI if applicable
  description?: string
}

export interface EnvironmentPropSpec {
  id: string
  type: 'crate' | 'barrel' | 'wagon' | 'fence' | 'torch' | 'bench' | 'sign' | 'corpse' | 'fallen_log'
  x: number
  z: number
  rotation?: number
  scale?: number
}

export interface EnvironmentVegetationSpec {
  type: 'tree' | 'bush' | 'grass' | 'fallen_log'
  x: number
  z: number
  density?: number  // 0-1, for clustering
}

// Crydee Frontier - coastal town with keep, docks, merchant stalls
export const CRYDEE_ENVIRONMENT: RegionEnvironmentConfig = {
  regionId: 'crydee',
  buildings: [
    // Main keep area
    {
      id: 'crydee_keep_main',
      model: 'Wall_Plaster_Window_Wide_Flat.gltf',
      x: 400,
      z: 320,
      scale: 2.5,
    },
    {
      id: 'crydee_keep_gate',
      model: 'DoorFrame_Flat_Brick.gltf',
      x: 420,
      z: 320,
      scale: 1.8,
    },
    // Guard towers
    {
      id: 'guard_tower_ne',
      model: 'Roof_Tower_RoundTiles.gltf',
      x: 470,
      z: 270,
      scale: 1.8,
    },
    {
      id: 'guard_tower_nw',
      model: 'Roof_Tower_RoundTiles.gltf',
      x: 330,
      z: 270,
      scale: 1.8,
    },
    // Village buildings - merchant area
    {
      id: 'merchant_stall_1',
      model: 'Floor_Brick.gltf',
      x: 380,
      z: 380,
      scale: 1.4,
    },
    {
      id: 'merchant_stall_2',
      model: 'Floor_Brick.gltf',
      x: 420,
      z: 380,
      scale: 1.4,
    },
  ],
  props: [
    // Gate area
    { id: 'banner_1', type: 'sign', x: 380, z: 310 },
    { id: 'torch_1', type: 'torch', x: 390, z: 320 },
    { id: 'torch_2', type: 'torch', x: 410, z: 320 },
    // Market area
    { id: 'stall_1', type: 'wagon', x: 380, z: 420, rotation: Math.PI / 4 },
    { id: 'stall_2', type: 'crate', x: 400, z: 410 },
    { id: 'stall_3', type: 'crate', x: 420, z: 410 },
    // Road
    { id: 'sign_road', type: 'sign', x: 360, z: 500 },
  ],
  vegetation: [
    // Forest edges
    { type: 'tree', x: 250, z: 250, density: 0.8 },
    { type: 'tree', x: 280, z: 220, density: 0.7 },
    { type: 'bush', x: 300, z: 240, density: 0.6 },
    { type: 'tree', x: 550, z: 200, density: 0.7 },
    { type: 'tree', x: 580, z: 180, density: 0.6 },
  ],
}

// Forest Outskirts - abandoned ranger post with wild vegetation
export const FOREST_OUTSKIRTS_ENVIRONMENT: RegionEnvironmentConfig = {
  regionId: 'forest_outskirts',
  buildings: [
    {
      id: 'ranger_post_main',
      model: 'Wall_UnevenBrick_Straight.gltf',
      x: 520,
      z: 260,
      scale: 1.6,
    },
    {
      id: 'ranger_post_roof',
      model: 'Roof_Modular_RoundTiles.gltf',
      x: 520,
      z: 260,
      scale: 1.5,
    },
    {
      id: 'watchtower',
      model: 'Roof_Tower_RoundTiles.gltf',
      x: 560,
      z: 240,
      scale: 1.4,
    },
  ],
  props: [
    { id: 'fire_pit', type: 'torch', x: 500, z: 280 },
    { id: 'supplies', type: 'barrel', x: 520, z: 310 },
    { id: 'logs', type: 'fallen_log', x: 480, z: 260 },
    { id: 'bench', type: 'bench', x: 530, z: 250 },
  ],
  vegetation: [
    // Dense forest
    { type: 'tree', x: 400, z: 200, density: 0.9 },
    { type: 'tree', x: 420, z: 220, density: 0.9 },
    { type: 'tree', x: 450, z: 250, density: 0.8 },
    { type: 'tree', x: 480, z: 280, density: 0.8 },
    { type: 'tree', x: 620, z: 300, density: 0.8 },
    { type: 'tree', x: 640, z: 320, density: 0.9 },
    { type: 'bush', x: 500, z: 240, density: 0.7 },
    { type: 'bush', x: 540, z: 200, density: 0.6 },
  ],
}

// Warfront Approach - military fortifications, trenches, destroyed buildings
export const WARFRONT_ENVIRONMENT: RegionEnvironmentConfig = {
  regionId: 'warfront_approach',
  buildings: [
    // Muster camp
    {
      id: 'muster_tent',
      model: 'Floor_WoodDark.gltf',
      x: 180,
      z: 420,
      scale: 1.8,
    },
    {
      id: 'supply_depot',
      model: 'Wall_Plaster_Straight.gltf',
      x: 160,
      z: 450,
      scale: 1.5,
    },
    // Ashfall Redoubt
    {
      id: 'ashfall_wall',
      model: 'Wall_UnevenBrick_Straight.gltf',
      x: 300,
      z: 210,
      scale: 2.2,
    },
    {
      id: 'ashfall_tower',
      model: 'Roof_Tower_RoundTiles.gltf',
      x: 340,
      z: 190,
      scale: 1.8,
    },
    // Broken Signal Tower
    {
      id: 'signal_tower_base',
      model: 'Roof_Support2.gltf',
      x: 620,
      z: 180,
      scale: 2.0,
    },
  ],
  props: [
    // Military encampment
    { id: 'banner_command', type: 'sign', x: 175, z: 410 },
    { id: 'supply_stack_1', type: 'crate', x: 195, z: 445 },
    { id: 'supply_stack_2', type: 'barrel', x: 205, z: 450 },
    { id: 'campfire', type: 'torch', x: 185, z: 460 },
    // War debris
    { id: 'corpse_1', type: 'corpse', x: 250, z: 350 },
    { id: 'burnt_wagon', type: 'wagon', x: 400, z: 300, rotation: Math.PI / 3 },
    { id: 'rubble_1', type: 'crate', x: 320, z: 240 },
    // Fortifications
    { id: 'fence_redoubt', type: 'fence', x: 310, z: 200, rotation: Math.PI / 6 },
    { id: 'fence_outer', type: 'fence', x: 280, z: 240, rotation: Math.PI / 4 },
  ],
  vegetation: [
    // Sparse, war-torn landscape
    { type: 'bush', x: 250, z: 380, density: 0.4 },
    { type: 'bush', x: 450, z: 250, density: 0.3 },
    { type: 'fallen_log', x: 200, z: 380, density: 0.5 },
  ],
}

// Culvert Breach - underground dungeon (handled differently, minimal exterior)
export const CULVERT_ENVIRONMENT: RegionEnvironmentConfig = {
  regionId: 'culvert_breach',
  buildings: [
    {
      id: 'culvert_entrance',
      model: 'HoleCover_Straight.gltf',
      x: 890,
      z: 410,
      scale: 2.0,
    },
  ],
  props: [
    { id: 'warning_sign', type: 'sign', x: 870, z: 400 },
    { id: 'rope_bundle', type: 'crate', x: 910, z: 420 },
  ],
  vegetation: [],
}

// Outer Roads to Krondor - wilderness road with checkpoints
export const OUTER_ROADS_ENVIRONMENT: RegionEnvironmentConfig = {
  regionId: 'outer_roads_to_krondor',
  buildings: [
    {
      id: 'eastern_checkpoint',
      model: 'Wall_Plaster_Door_Flat.gltf',
      x: 480,
      z: 300,
      scale: 1.8,
    },
    {
      id: 'relay_beacon',
      model: 'Roof_Tower_RoundTiles.gltf',
      x: 500,
      z: 320,
      scale: 1.6,
    },
  ],
  props: [
    { id: 'checkpoint_banner', type: 'sign', x: 470, z: 310 },
    { id: 'supplies_cache', type: 'crate', x: 490, z: 340 },
    { id: 'signal_cart', type: 'wagon', x: 520, z: 350, rotation: Math.PI / 6 },
    { id: 'brazier', type: 'torch', x: 510, z: 310 },
  ],
  vegetation: [
    { type: 'tree', x: 400, z: 200, density: 0.6 },
    { type: 'tree', x: 420, z: 240, density: 0.5 },
    { type: 'tree', x: 550, z: 400, density: 0.7 },
    { type: 'tree', x: 580, z: 380, density: 0.6 },
    { type: 'bush', x: 450, z: 280, density: 0.4 },
  ],
}

// Export all region configs
export const REGION_ENVIRONMENTS: Record<string, RegionEnvironmentConfig> = {
  crydee: CRYDEE_ENVIRONMENT,
  forest_outskirts: FOREST_OUTSKIRTS_ENVIRONMENT,
  warfront_approach: WARFRONT_ENVIRONMENT,
  culvert_breach: CULVERT_ENVIRONMENT,
  outer_roads_to_krondor: OUTER_ROADS_ENVIRONMENT,
}

/**
 * Get environment config for a region
 */
export function getRegionEnvironment(regionId: string): RegionEnvironmentConfig | undefined {
  return REGION_ENVIRONMENTS[regionId]
}
