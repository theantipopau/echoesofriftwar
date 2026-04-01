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
  y?: number               // Y offset above terrain (for roof pieces, elevated features)
  z: number
  rotation?: number        // Y-axis rotation in radians
  scale?: number           // Uniform scale
  poiId?: string          // Links to POI if applicable
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

const PI = Math.PI

// Crydee Frontier - coastal keep and merchant quarter
export const CRYDEE_ENVIRONMENT: RegionEnvironmentConfig = {
  regionId: 'crydee',
  buildings: [
    { id: 'keep_gate', model: 'Wall_UnevenBrick_Door_Round.gltf', x: 400, z: 321, scale: 2.0 },
    { id: 'keep_wall_fl', model: 'Wall_UnevenBrick_Straight.gltf', x: 391, z: 321, scale: 2.0 },
    { id: 'keep_wall_fr', model: 'Wall_UnevenBrick_Straight.gltf', x: 409, z: 321, scale: 2.0 },
    { id: 'keep_door_frame', model: 'DoorFrame_Round_WoodDark.gltf', x: 400, z: 321, scale: 1.8 },
    { id: 'keep_corner_nw', model: 'Corner_Exterior_Brick.gltf', x: 382, z: 321, scale: 2.0 },
    { id: 'keep_corner_ne', model: 'Corner_Exterior_Brick.gltf', x: 418, z: 321, rotation: PI / 2, scale: 2.0 },
    { id: 'keep_wall_lf', model: 'Wall_UnevenBrick_Straight.gltf', x: 381, z: 313, rotation: PI / 2, scale: 2.0 },
    { id: 'keep_wall_lb', model: 'Wall_UnevenBrick_Window_Wide_Round.gltf', x: 381, z: 305, rotation: PI / 2, scale: 2.0 },
    { id: 'keep_wall_rf', model: 'Wall_UnevenBrick_Straight.gltf', x: 419, z: 313, rotation: PI / 2, scale: 2.0 },
    { id: 'keep_wall_rb', model: 'Wall_UnevenBrick_Window_Wide_Round.gltf', x: 419, z: 305, rotation: PI / 2, scale: 2.0 },
    { id: 'keep_wall_back', model: 'Wall_UnevenBrick_Straight.gltf', x: 400, z: 299, rotation: PI, scale: 2.0 },
    { id: 'keep_corner_sw', model: 'Corner_Exterior_Brick.gltf', x: 382, z: 299, rotation: PI, scale: 2.0 },
    { id: 'keep_corner_se', model: 'Corner_Exterior_Brick.gltf', x: 418, z: 299, rotation: -PI / 2, scale: 2.0 },
    { id: 'keep_roof', model: 'Roof_RoundTiles_4x4.gltf', x: 400, y: 7, z: 311, scale: 2.2 },
    { id: 'keep_tower_nw', model: 'Roof_Tower_RoundTiles.gltf', x: 381, y: 7, z: 321, scale: 2.0 },
    { id: 'keep_tower_ne', model: 'Roof_Tower_RoundTiles.gltf', x: 419, y: 7, z: 321, scale: 2.0 },
    { id: 'keep_tower_sw', model: 'Roof_Tower_RoundTiles.gltf', x: 381, y: 7, z: 299, scale: 2.0 },
    { id: 'keep_tower_se', model: 'Roof_Tower_RoundTiles.gltf', x: 419, y: 7, z: 299, scale: 2.0 },
    { id: 'keep_steps', model: 'Stairs_Exterior_Straight.gltf', x: 400, z: 325, scale: 1.5 },
    { id: 'keep_border_l', model: 'Prop_ExteriorBorder_Straight1.gltf', x: 390, z: 326, scale: 1.6 },
    { id: 'keep_border_r', model: 'Prop_ExteriorBorder_Straight1.gltf', x: 410, z: 326, scale: 1.6 },
    { id: 'keep_border_corner_nw', model: 'Prop_ExteriorBorder_Corner.gltf', x: 383, z: 326, scale: 1.6 },
    { id: 'keep_border_corner_ne', model: 'Prop_ExteriorBorder_Corner.gltf', x: 417, z: 326, rotation: PI / 2, scale: 1.6 },
    { id: 'merch_a_front', model: 'Wall_Plaster_Door_Flat.gltf', x: 368, z: 443, scale: 1.5 },
    { id: 'merch_a_win', model: 'Wall_Plaster_Window_Wide_Flat.gltf', x: 360, z: 443, scale: 1.5 },
    { id: 'merch_a_side_l', model: 'Wall_Plaster_Straight.gltf', x: 355, z: 438, rotation: PI / 2, scale: 1.5 },
    { id: 'merch_a_side_r', model: 'Wall_Plaster_Straight.gltf', x: 375, z: 438, rotation: PI / 2, scale: 1.5 },
    { id: 'merch_a_roof', model: 'Roof_Wooden_2x1.gltf', x: 365, y: 5, z: 439, scale: 1.5 },
    { id: 'merch_a_corner_l', model: 'Corner_ExteriorWide_Wood.gltf', x: 354, z: 443, scale: 1.4 },
    { id: 'merch_a_corner_r', model: 'Corner_ExteriorWide_Wood.gltf', x: 376, z: 443, rotation: PI / 2, scale: 1.4 },
    { id: 'smith_front', model: 'Wall_Plaster_Door_Flat.gltf', x: 420, z: 443, scale: 1.5 },
    { id: 'smith_side_l', model: 'Wall_Plaster_Straight.gltf', x: 414, z: 438, rotation: PI / 2, scale: 1.5 },
    { id: 'smith_side_r', model: 'Wall_Plaster_Straight.gltf', x: 426, z: 438, rotation: PI / 2, scale: 1.5 },
    { id: 'smith_roof', model: 'Roof_Wooden_2x1.gltf', x: 420, y: 5, z: 438, scale: 1.5 },
    { id: 'smith_chimney', model: 'Prop_Chimney.gltf', x: 423, y: 5, z: 434, scale: 1.2 },
    { id: 'smith_corner_l', model: 'Corner_ExteriorWide_Wood.gltf', x: 413, z: 443, scale: 1.4 },
    { id: 'smith_corner_r', model: 'Corner_ExteriorWide_Wood.gltf', x: 427, z: 443, rotation: PI / 2, scale: 1.4 },
    { id: 'priory_front', model: 'Wall_Plaster_Straight.gltf', x: 460, z: 362, scale: 1.6 },
    { id: 'priory_door', model: 'DoorFrame_Flat_WoodDark.gltf', x: 460, z: 363, scale: 1.4 },
    { id: 'priory_side_l', model: 'Wall_Plaster_Window_Thin_Round.gltf', x: 453, z: 357, rotation: PI / 2, scale: 1.5 },
    { id: 'priory_side_r', model: 'Wall_Plaster_Window_Thin_Round.gltf', x: 467, z: 357, rotation: PI / 2, scale: 1.5 },
    { id: 'priory_roof', model: 'Roof_RoundTiles_4x4.gltf', x: 460, y: 5, z: 357, scale: 1.6 },
    { id: 'fence_mkt_1', model: 'Prop_WoodenFence_Single.gltf', x: 345, z: 455, scale: 1.3 },
    { id: 'fence_mkt_2', model: 'Prop_WoodenFence_Extension1.gltf', x: 352, z: 455, scale: 1.3 },
    { id: 'fence_mkt_3', model: 'Prop_WoodenFence_Extension2.gltf', x: 359, z: 455, scale: 1.3 },
    { id: 'fence_mkt_4', model: 'Prop_WoodenFence_Extension1.gltf', x: 366, z: 455, scale: 1.3 },
    { id: 'fence_mkt_5', model: 'Prop_WoodenFence_Single.gltf', x: 373, z: 455, scale: 1.3 },
    { id: 'vine_keep_l', model: 'Prop_Vine1.gltf', x: 383, z: 322, scale: 1.8 },
    { id: 'vine_keep_r', model: 'Prop_Vine2.gltf', x: 417, z: 322, scale: 1.8 },
    { id: 'vine_keep_back', model: 'Prop_Vine4.gltf', x: 395, z: 300, scale: 2.0 },
  ],
  props: [
    { id: 'torch_gate_l', type: 'torch', x: 390, z: 323 },
    { id: 'torch_gate_r', type: 'torch', x: 410, z: 323 },
    { id: 'banner_keep', type: 'sign', x: 380, z: 318 },
    { id: 'crate_court_1', type: 'crate', x: 395, z: 310 },
    { id: 'crate_court_2', type: 'crate', x: 405, z: 308 },
    { id: 'bench_court', type: 'bench', x: 410, z: 313 },
    { id: 'wagon_market', type: 'wagon', x: 384, z: 432, rotation: PI / 6 },
    { id: 'crate_mkt_1', type: 'crate', x: 372, z: 428 },
    { id: 'crate_mkt_2', type: 'crate', x: 368, z: 436 },
    { id: 'torch_mkt', type: 'torch', x: 395, z: 435 },
    { id: 'crate_mkt_3', type: 'crate', x: 420, z: 425 },
    { id: 'sign_market', type: 'sign', x: 358, z: 445 },
    { id: 'sign_road_s', type: 'sign', x: 360, z: 500 },
    { id: 'torch_road_s', type: 'torch', x: 370, z: 495 },
    { id: 'bench_priory', type: 'bench', x: 465, z: 365 },
    { id: 'torch_priory', type: 'torch', x: 455, z: 360 },
  ],
  vegetation: [
    { type: 'tree', x: 248, z: 252, density: 0.8 },
    { type: 'tree', x: 274, z: 220, density: 0.7 },
    { type: 'bush', x: 302, z: 242, density: 0.6 },
    { type: 'tree', x: 552, z: 198, density: 0.7 },
    { type: 'tree', x: 578, z: 178, density: 0.6 },
    { type: 'bush', x: 340, z: 475, density: 0.5 },
    { type: 'bush', x: 445, z: 465, density: 0.5 },
  ],
}

// Forest Outskirts - abandoned ranger post with overgrowth
export const FOREST_OUTSKIRTS_ENVIRONMENT: RegionEnvironmentConfig = {
  regionId: 'forest_outskirts',
  buildings: [
    { id: 'post_front', model: 'Wall_UnevenBrick_Door_Round.gltf', x: 520, z: 262, scale: 1.6 },
    { id: 'post_wall_fl', model: 'Wall_UnevenBrick_Straight.gltf', x: 511, z: 262, scale: 1.6 },
    { id: 'post_wall_fr', model: 'Wall_UnevenBrick_Window_Wide_Round.gltf', x: 529, z: 262, scale: 1.6 },
    { id: 'post_side_l', model: 'Wall_UnevenBrick_Straight.gltf', x: 509, z: 257, rotation: PI / 2, scale: 1.6 },
    { id: 'post_side_r', model: 'Wall_UnevenBrick_Straight.gltf', x: 531, z: 257, rotation: PI / 2, scale: 1.6 },
    { id: 'post_back', model: 'Wall_UnevenBrick_Straight.gltf', x: 520, z: 252, rotation: PI, scale: 1.6 },
    { id: 'post_corner_nw', model: 'Corner_Exterior_Brick.gltf', x: 509, z: 262, scale: 1.5 },
    { id: 'post_corner_ne', model: 'Corner_Exterior_Brick.gltf', x: 531, z: 262, rotation: PI / 2, scale: 1.5 },
    { id: 'post_roof', model: 'Roof_Wooden_2x1.gltf', x: 520, y: 5, z: 257, scale: 1.6 },
    { id: 'post_roof_l', model: 'Roof_Wooden_2x1_L.gltf', x: 512, y: 5, z: 257, scale: 1.6 },
    { id: 'post_roof_r', model: 'Roof_Wooden_2x1_R.gltf', x: 528, y: 5, z: 257, scale: 1.6 },
    { id: 'tower_base', model: 'Wall_UnevenBrick_Straight.gltf', x: 558, z: 242, scale: 1.4 },
    { id: 'tower_base_s', model: 'Wall_UnevenBrick_Straight.gltf', x: 558, z: 236, rotation: PI / 2, scale: 1.4 },
    { id: 'tower_base_s2', model: 'Wall_UnevenBrick_Straight.gltf', x: 564, z: 239, rotation: PI / 2, scale: 1.4 },
    { id: 'tower_roof', model: 'Roof_Tower_RoundTiles.gltf', x: 558, y: 6, z: 240, scale: 1.6 },
    { id: 'tower_support', model: 'Prop_Support.gltf', x: 554, z: 242, scale: 1.4 },
    { id: 'tower_support2', model: 'Prop_Support.gltf', x: 562, z: 242, scale: 1.4 },
    { id: 'ruin_wall_1', model: 'Wall_UnevenBrick_Straight.gltf', x: 490, z: 278, rotation: PI / 4, scale: 1.4 },
    { id: 'ruin_wall_2', model: 'Wall_UnevenBrick_Straight.gltf', x: 482, z: 268, scale: 1.3 },
    { id: 'vine_post', model: 'Prop_Vine1.gltf', x: 510, z: 262, scale: 1.6 },
    { id: 'vine_ruin_1', model: 'Prop_Vine5.gltf', x: 491, z: 278, scale: 1.8 },
    { id: 'vine_ruin_2', model: 'Prop_Vine6.gltf', x: 482, z: 267, scale: 1.6 },
    { id: 'fence_post_1', model: 'Prop_WoodenFence_Single.gltf', x: 504, z: 268, rotation: PI / 2, scale: 1.2 },
    { id: 'fence_post_2', model: 'Prop_WoodenFence_Extension1.gltf', x: 504, z: 274, rotation: PI / 2, scale: 1.2 },
    { id: 'fence_post_3', model: 'Prop_WoodenFence_Single.gltf', x: 536, z: 268, rotation: -PI / 2, scale: 1.2 },
  ],
  props: [
    { id: 'fire_pit', type: 'torch', x: 502, z: 278 },
    { id: 'supplies', type: 'crate', x: 521, z: 270 },
    { id: 'log_pile', type: 'fallen_log', x: 479, z: 260 },
    { id: 'bench_post', type: 'bench', x: 530, z: 255 },
    { id: 'crate_twr', type: 'crate', x: 554, z: 246 },
    { id: 'barrel_post', type: 'barrel', x: 525, z: 270 },
  ],
  vegetation: [
    { type: 'tree', x: 400, z: 200, density: 0.9 },
    { type: 'tree', x: 420, z: 220, density: 0.9 },
    { type: 'tree', x: 452, z: 248, density: 0.8 },
    { type: 'tree', x: 478, z: 278, density: 0.8 },
    { type: 'tree', x: 622, z: 302, density: 0.8 },
    { type: 'tree', x: 642, z: 322, density: 0.9 },
    { type: 'bush', x: 498, z: 242, density: 0.7 },
    { type: 'bush', x: 538, z: 198, density: 0.6 },
  ],
}

// Warfront Approach - fortifications and battlefield ruins
export const WARFRONT_ENVIRONMENT: RegionEnvironmentConfig = {
  regionId: 'warfront_approach',
  buildings: [
    { id: 'muster_front', model: 'Wall_Plaster_Door_Flat.gltf', x: 180, z: 422, scale: 1.6 },
    { id: 'muster_wall_l', model: 'Wall_Plaster_Straight.gltf', x: 172, z: 418, rotation: PI / 2, scale: 1.6 },
    { id: 'muster_wall_r', model: 'Wall_Plaster_Straight.gltf', x: 188, z: 418, rotation: PI / 2, scale: 1.6 },
    { id: 'muster_back', model: 'Wall_Plaster_Straight.gltf', x: 180, z: 414, rotation: PI, scale: 1.6 },
    { id: 'muster_roof', model: 'Roof_Front_Brick4.gltf', x: 180, y: 5, z: 418, scale: 1.5 },
    { id: 'muster_corner_l', model: 'Corner_Exterior_Wood.gltf', x: 172, z: 422, scale: 1.5 },
    { id: 'muster_corner_r', model: 'Corner_Exterior_Wood.gltf', x: 188, z: 422, rotation: PI / 2, scale: 1.5 },
    { id: 'depot_front', model: 'Wall_Plaster_Straight.gltf', x: 160, z: 452, scale: 1.5 },
    { id: 'depot_side_l', model: 'Wall_Plaster_Straight.gltf', x: 154, z: 448, rotation: PI / 2, scale: 1.5 },
    { id: 'depot_side_r', model: 'Wall_Plaster_Straight.gltf', x: 166, z: 448, rotation: PI / 2, scale: 1.5 },
    { id: 'depot_roof', model: 'Roof_Wooden_2x1.gltf', x: 160, y: 5, z: 448, scale: 1.4 },
    { id: 'ashfall_gate', model: 'Wall_UnevenBrick_Door_Flat.gltf', x: 300, z: 213, scale: 2.0 },
    { id: 'ashfall_w_l', model: 'Wall_UnevenBrick_Straight.gltf', x: 291, z: 213, scale: 2.0 },
    { id: 'ashfall_w_r', model: 'Wall_UnevenBrick_Straight.gltf', x: 309, z: 213, scale: 2.0 },
    { id: 'ashfall_w_l2', model: 'Wall_UnevenBrick_Straight.gltf', x: 282, z: 213, scale: 2.0 },
    { id: 'ashfall_w_r2', model: 'Wall_UnevenBrick_Straight.gltf', x: 318, z: 213, scale: 2.0 },
    { id: 'ashfall_side_l', model: 'Wall_UnevenBrick_Straight.gltf', x: 281, z: 206, rotation: PI / 2, scale: 2.0 },
    { id: 'ashfall_side_r', model: 'Wall_UnevenBrick_Straight.gltf', x: 319, z: 206, rotation: PI / 2, scale: 2.0 },
    { id: 'ashfall_c_nw', model: 'Corner_Exterior_Brick.gltf', x: 281, z: 213, scale: 2.0 },
    { id: 'ashfall_c_ne', model: 'Corner_Exterior_Brick.gltf', x: 319, z: 213, rotation: PI / 2, scale: 2.0 },
    { id: 'ashfall_tower', model: 'Roof_Tower_RoundTiles.gltf', x: 340, y: 6, z: 192, scale: 2.0 },
    { id: 'ashfall_tw_l', model: 'Wall_UnevenBrick_Straight.gltf', x: 336, z: 194, rotation: PI / 2, scale: 1.8 },
    { id: 'ashfall_tw_r', model: 'Wall_UnevenBrick_Straight.gltf', x: 344, z: 194, rotation: PI / 2, scale: 1.8 },
    { id: 'ashfall_parapet', model: 'HoleCover_Straight.gltf', x: 300, y: 6, z: 213, scale: 2.0 },
    { id: 'signal_base', model: 'Roof_Support2.gltf', x: 620, z: 182, scale: 2.2 },
    { id: 'signal_support_l', model: 'Prop_Support.gltf', x: 614, z: 182, scale: 1.8 },
    { id: 'signal_support_r', model: 'Prop_Support.gltf', x: 626, z: 182, scale: 1.8 },
    { id: 'signal_rail', model: 'HoleCover_StraightHalf.gltf', x: 620, y: 4, z: 182, scale: 1.8 },
    { id: 'redt_fence_1', model: 'Prop_MetalFence_Simple.gltf', x: 310, z: 222, scale: 1.4 },
    { id: 'redt_fence_2', model: 'Prop_MetalFence_Simple.gltf', x: 318, z: 222, scale: 1.4 },
    { id: 'redt_fence_3', model: 'Prop_MetalFence_Ornament.gltf', x: 302, z: 222, scale: 1.4 },
    { id: 'redt_fence_4', model: 'Prop_MetalFence_Simple.gltf', x: 286, z: 218, rotation: PI / 2, scale: 1.4 },
    { id: 'redt_fence_5', model: 'Prop_MetalFence_Simple.gltf', x: 286, z: 210, rotation: PI / 2, scale: 1.4 },
    { id: 'rubble_brick_1', model: 'Prop_Brick1.gltf', x: 258, z: 346, scale: 1.5 },
    { id: 'rubble_brick_2', model: 'Prop_Brick2.gltf', x: 264, z: 352, scale: 1.4 },
    { id: 'rubble_brick_3', model: 'Prop_Brick3.gltf', x: 268, z: 344, scale: 1.6 },
    { id: 'rubble_brick_4', model: 'Prop_Brick4.gltf', x: 248, z: 358, scale: 1.3 },
  ],
  props: [
    { id: 'banner_cmd', type: 'sign', x: 174, z: 410 },
    { id: 'supply_1', type: 'crate', x: 196, z: 446 },
    { id: 'supply_2', type: 'barrel', x: 204, z: 452 },
    { id: 'campfire', type: 'torch', x: 184, z: 462 },
    { id: 'corpse_1', type: 'corpse', x: 254, z: 352 },
    { id: 'corpse_2', type: 'corpse', x: 408, z: 282 },
    { id: 'burnt_wagon', type: 'wagon', x: 402, z: 302, rotation: PI / 3 },
    { id: 'rubble_crate', type: 'crate', x: 322, z: 242 },
    { id: 'fence_redt_l', type: 'fence', x: 312, z: 202, rotation: PI / 6 },
    { id: 'fence_redt_r', type: 'fence', x: 282, z: 242, rotation: PI / 4 },
    { id: 'barrel_depot', type: 'barrel', x: 156, z: 462 },
    { id: 'torch_muster', type: 'torch', x: 172, z: 428 },
  ],
  vegetation: [
    { type: 'bush', x: 252, z: 382, density: 0.4 },
    { type: 'bush', x: 452, z: 252, density: 0.3 },
    { type: 'fallen_log', x: 202, z: 382, density: 0.5 },
    { type: 'bush', x: 480, z: 360, density: 0.4 },
  ],
}

// Culvert Breach - reinforced dungeon entrance
export const CULVERT_ENVIRONMENT: RegionEnvironmentConfig = {
  regionId: 'culvert_breach',
  buildings: [
    { id: 'culvert_entry', model: 'HoleCover_Straight.gltf', x: 890, z: 412, scale: 2.2 },
    { id: 'culvert_angle', model: 'HoleCover_90Angle.gltf', x: 898, z: 408, scale: 1.8 },
    { id: 'culvert_cover', model: 'HoleCover_90Stairs.gltf', x: 882, z: 412, scale: 1.8 },
    { id: 'cul_wall_l', model: 'Wall_UnevenBrick_Straight.gltf', x: 876, z: 404, rotation: PI / 2, scale: 1.6 },
    { id: 'cul_wall_r', model: 'Wall_UnevenBrick_Straight.gltf', x: 904, z: 404, rotation: PI / 2, scale: 1.6 },
    { id: 'cul_brick_l', model: 'Prop_Brick1.gltf', x: 872, z: 416, scale: 1.4 },
    { id: 'cul_brick_r', model: 'Prop_Brick2.gltf', x: 908, z: 416, scale: 1.4 },
    { id: 'cul_station', model: 'Wall_BottomCover.gltf', x: 864, z: 403, scale: 1.5 },
    { id: 'cul_support', model: 'Prop_Support.gltf', x: 864, z: 408, scale: 1.4 },
  ],
  props: [
    { id: 'warning_sign', type: 'sign', x: 872, z: 402 },
    { id: 'rope_bundle', type: 'crate', x: 912, z: 422 },
    { id: 'entry_torch_l', type: 'torch', x: 882, z: 416 },
    { id: 'entry_torch_r', type: 'torch', x: 898, z: 416 },
  ],
  vegetation: [],
}

// Outer Roads to Krondor - roadwarden gate, staging yard, relay rise, and eastern checkpoint
export const OUTER_ROADS_ENVIRONMENT: RegionEnvironmentConfig = {
  regionId: 'outer_roads_to_krondor',
  buildings: [
    { id: 'gate_arch', model: 'Wall_UnevenBrick_Door_Flat.gltf', x: 170, z: 292, scale: 1.9, poiId: 'roadwarden_gate' },
    { id: 'gate_wall_l1', model: 'Wall_UnevenBrick_Straight.gltf', x: 160, z: 292, scale: 1.8 },
    { id: 'gate_wall_r1', model: 'Wall_UnevenBrick_Straight.gltf', x: 180, z: 292, scale: 1.8 },
    { id: 'gate_wall_l2', model: 'Wall_UnevenBrick_Straight.gltf', x: 150, z: 292, scale: 1.7 },
    { id: 'gate_wall_r2', model: 'Wall_UnevenBrick_Straight.gltf', x: 190, z: 292, scale: 1.7 },
    { id: 'gate_tower_l', model: 'Roof_Tower_RoundTiles.gltf', x: 148, y: 6, z: 286, scale: 1.5 },
    { id: 'gate_tower_r', model: 'Roof_Tower_RoundTiles.gltf', x: 192, y: 6, z: 286, scale: 1.5 },
    { id: 'gate_support_l', model: 'Prop_Support.gltf', x: 162, z: 299, scale: 1.6 },
    { id: 'gate_support_r', model: 'Prop_Support.gltf', x: 178, z: 299, scale: 1.6 },

    { id: 'staging_hall_front', model: 'Wall_Plaster_Door_Flat.gltf', x: 430, z: 310, scale: 1.8, poiId: 'caravan_staging' },
    { id: 'staging_hall_side_l', model: 'Wall_Plaster_Straight.gltf', x: 422, z: 304, rotation: PI / 2, scale: 1.8 },
    { id: 'staging_hall_side_r', model: 'Wall_Plaster_Straight.gltf', x: 438, z: 304, rotation: PI / 2, scale: 1.8 },
    { id: 'staging_hall_back', model: 'Wall_Plaster_Straight.gltf', x: 430, z: 298, rotation: PI, scale: 1.8 },
    { id: 'staging_hall_roof', model: 'Roof_Wooden_2x1.gltf', x: 430, y: 5, z: 304, scale: 1.8 },
    { id: 'staging_store_front', model: 'Wall_Plaster_Window_Wide_Flat.gltf', x: 462, z: 318, scale: 1.6 },
    { id: 'staging_store_side_l', model: 'Wall_Plaster_Straight.gltf', x: 454, z: 312, rotation: PI / 2, scale: 1.6 },
    { id: 'staging_store_side_r', model: 'Wall_Plaster_Straight.gltf', x: 470, z: 312, rotation: PI / 2, scale: 1.6 },
    { id: 'staging_store_back', model: 'Wall_Plaster_Straight.gltf', x: 462, z: 306, rotation: PI, scale: 1.6 },
    { id: 'staging_store_roof', model: 'Roof_Wooden_2x1.gltf', x: 462, y: 5, z: 312, scale: 1.6 },
    { id: 'staging_fence_1', model: 'Prop_WoodenFence_Single.gltf', x: 392, z: 324, scale: 1.4 },
    { id: 'staging_fence_2', model: 'Prop_WoodenFence_Extension1.gltf', x: 400, z: 324, scale: 1.4 },
    { id: 'staging_fence_3', model: 'Prop_WoodenFence_Extension2.gltf', x: 408, z: 324, scale: 1.4 },
    { id: 'staging_fence_4', model: 'Prop_WoodenFence_Extension1.gltf', x: 416, z: 324, scale: 1.4 },
    { id: 'staging_fence_5', model: 'Prop_WoodenFence_Single.gltf', x: 424, z: 324, scale: 1.4 },

    { id: 'relay_post_front', model: 'Wall_UnevenBrick_Door_Round.gltf', x: 780, z: 248, scale: 1.6, poiId: 'north_relay_station' },
    { id: 'relay_post_side_l', model: 'Wall_UnevenBrick_Straight.gltf', x: 772, z: 242, rotation: PI / 2, scale: 1.6 },
    { id: 'relay_post_side_r', model: 'Wall_UnevenBrick_Straight.gltf', x: 788, z: 242, rotation: PI / 2, scale: 1.6 },
    { id: 'relay_post_back', model: 'Wall_UnevenBrick_Straight.gltf', x: 780, z: 236, rotation: PI, scale: 1.6 },
    { id: 'relay_post_roof', model: 'Roof_Tower_RoundTiles.gltf', x: 780, y: 6, z: 242, scale: 1.6 },
    { id: 'relay_signal_frame', model: 'Roof_Support2.gltf', x: 792, z: 230, scale: 1.9 },
    { id: 'relay_signal_support_l', model: 'Prop_Support.gltf', x: 786, z: 230, scale: 1.5 },
    { id: 'relay_signal_support_r', model: 'Prop_Support.gltf', x: 798, z: 230, scale: 1.5 },

    { id: 'toll_ruin_front', model: 'Wall_UnevenBrick_Window_Wide_Round.gltf', x: 604, z: 380, scale: 1.5, poiId: 'broken_tollhouse' },
    { id: 'toll_ruin_side', model: 'Wall_UnevenBrick_Straight.gltf', x: 596, z: 374, rotation: PI / 2, scale: 1.4 },
    { id: 'toll_ruin_corner', model: 'Corner_Exterior_Brick.gltf', x: 596, z: 380, scale: 1.4 },
    { id: 'toll_ruin_wall', model: 'Wall_UnevenBrick_Straight.gltf', x: 614, z: 388, rotation: PI / 5, scale: 1.3 },
    { id: 'toll_rubble_1', model: 'Prop_Brick2.gltf', x: 620, z: 384, scale: 1.4 },
    { id: 'toll_rubble_2', model: 'Prop_Brick4.gltf', x: 612, z: 392, scale: 1.3 },

    { id: 'nexus_stone_1', model: 'Wall_BottomCover.gltf', x: 926, z: 220, scale: 1.6, poiId: 'sealed_nexus' },
    { id: 'nexus_stone_2', model: 'Wall_BottomCover.gltf', x: 942, z: 214, rotation: PI / 4, scale: 1.5 },
    { id: 'nexus_stone_3', model: 'HoleCover_90Angle.gltf', x: 936, z: 206, scale: 1.5 },
    { id: 'nexus_support', model: 'Prop_Support.gltf', x: 948, z: 222, scale: 1.3 },

    { id: 'east_gate', model: 'Wall_UnevenBrick_Door_Flat.gltf', x: 1040, z: 296, scale: 1.8, poiId: 'eastern_passage' },
    { id: 'east_wall_l', model: 'Wall_UnevenBrick_Straight.gltf', x: 1031, z: 296, scale: 1.7 },
    { id: 'east_wall_r', model: 'Wall_UnevenBrick_Straight.gltf', x: 1049, z: 296, scale: 1.7 },
    { id: 'east_parapet', model: 'HoleCover_Straight.gltf', x: 1040, y: 5, z: 296, scale: 1.8 },
    { id: 'east_watchtower', model: 'Roof_Tower_RoundTiles.gltf', x: 1060, y: 6, z: 284, scale: 1.5 },
    { id: 'east_watchtower_wall_l', model: 'Wall_UnevenBrick_Straight.gltf', x: 1056, z: 286, rotation: PI / 2, scale: 1.4 },
    { id: 'east_watchtower_wall_r', model: 'Wall_UnevenBrick_Straight.gltf', x: 1064, z: 286, rotation: PI / 2, scale: 1.4 },
  ],
  props: [
    { id: 'gate_sign', type: 'sign', x: 156, z: 304 },
    { id: 'gate_torch_l', type: 'torch', x: 162, z: 300 },
    { id: 'gate_torch_r', type: 'torch', x: 178, z: 300 },
    { id: 'gate_crate', type: 'crate', x: 188, z: 306 },

    { id: 'staging_wagon_1', type: 'wagon', x: 404, z: 338, rotation: PI / 12 },
    { id: 'staging_wagon_2', type: 'wagon', x: 454, z: 336, rotation: -PI / 10 },
    { id: 'staging_crate_1', type: 'crate', x: 436, z: 324 },
    { id: 'staging_crate_2', type: 'crate', x: 448, z: 326 },
    { id: 'staging_barrel', type: 'barrel', x: 470, z: 330 },
    { id: 'staging_torch', type: 'torch', x: 420, z: 320 },
    { id: 'staging_bench', type: 'bench', x: 458, z: 302 },
    { id: 'staging_guide_post', type: 'sign', x: 494, z: 310 },

    { id: 'relay_crate', type: 'crate', x: 768, z: 256 },
    { id: 'relay_torch', type: 'torch', x: 788, z: 254 },
    { id: 'relay_sign', type: 'sign', x: 804, z: 242 },

    { id: 'toll_corpse', type: 'corpse', x: 616, z: 376 },
    { id: 'toll_crate', type: 'crate', x: 600, z: 388 },
    { id: 'toll_wagon', type: 'wagon', x: 630, z: 390, rotation: PI / 4 },
    { id: 'toll_torch', type: 'torch', x: 592, z: 372 },

    { id: 'nexus_warning', type: 'sign', x: 922, z: 230 },
    { id: 'nexus_brazier', type: 'torch', x: 946, z: 216 },

    { id: 'east_torch_l', type: 'torch', x: 1032, z: 304 },
    { id: 'east_torch_r', type: 'torch', x: 1048, z: 304 },
    { id: 'east_bench', type: 'bench', x: 1022, z: 292 },
    { id: 'east_sign', type: 'sign', x: 1068, z: 296 },
    { id: 'east_marker_l', type: 'crate', x: 1012, z: 296 },
    { id: 'east_marker_r', type: 'crate', x: 1068, z: 296 },
    { id: 'east_banner_far', type: 'sign', x: 1088, z: 280 },
  ],
  vegetation: [
    { type: 'tree', x: 120, z: 236, density: 0.5 },
    { type: 'tree', x: 252, z: 228, density: 0.4 },
    { type: 'bush', x: 318, z: 356, density: 0.4 },
    { type: 'tree', x: 520, z: 250, density: 0.4 },
    { type: 'bush', x: 556, z: 338, density: 0.5 },
    { type: 'tree', x: 706, z: 196, density: 0.5 },
    { type: 'tree', x: 852, z: 176, density: 0.4 },
    { type: 'bush', x: 896, z: 268, density: 0.3 },
    { type: 'tree', x: 978, z: 252, density: 0.4 },
    { type: 'bush', x: 1086, z: 336, density: 0.3 },
  ],
}

export const REGION_ENVIRONMENTS: Record<string, RegionEnvironmentConfig> = {
  crydee: CRYDEE_ENVIRONMENT,
  forest_outskirts: FOREST_OUTSKIRTS_ENVIRONMENT,
  warfront_approach: WARFRONT_ENVIRONMENT,
  culvert_breach: CULVERT_ENVIRONMENT,
  outer_roads_to_krondor: OUTER_ROADS_ENVIRONMENT,
}

export function getRegionEnvironment(regionId: string): RegionEnvironmentConfig | undefined {
  return REGION_ENVIRONMENTS[regionId]
}
