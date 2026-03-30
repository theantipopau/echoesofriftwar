/**
 * Regional atmosphere configuration system
 * Defines lighting, fog, color grading, and visual mood for each region
 */

import { Scene } from '@babylonjs/core/scene'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { ColorCurves } from '@babylonjs/core/Materials/colorCurves'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'

export interface AtmosphereConfig {
  regionId: string
  // Lighting
  ambientColor: Color3
  ambientIntensity: number
  sunColor: Color3
  sunIntensity: number
  sunDirection: Vector3
  // Fog
  fogMode: 'exp2' | 'linear'
  fogDensity?: number
  fogStart?: number
  fogEnd?: number
  fogColor: Color3
  // Color grading
  contrast: number
  saturation: number
  brightness: number
  hueShift: number
  // Special effects
  hazeFactor: number // 0-1, atmospheric haze
  riftInfluence: number // 0-1, magical corruption level
}

/**
 * Crydee Frontier - Safe, well-lit coastal town
 */
export const CRYDEE_ATMOSPHERE: AtmosphereConfig = {
  regionId: 'crydee',
  // Golden hour coastal lighting
  ambientColor: new Color3(0.6, 0.62, 0.66),
  ambientIntensity: 0.52,
  sunColor: new Color3(1, 0.95, 0.8),
  sunIntensity: 1.35,
  sunDirection: new Vector3(-0.35, -1, -0.2),
  // Clear atmosphere
  fogMode: 'exp2',
  fogDensity: 0.0004,
  fogColor: new Color3(0.75, 0.8, 0.88),
  // Neutral to warm color grading
  contrast: 1.15,
  saturation: 1.2,
  brightness: 1.05,
  hueShift: 0.02,
  hazeFactor: 0.1,
  riftInfluence: 0,
}

/**
 * Forest Outskirts - Shadowy, mysterious woodland
 */
export const FOREST_ATMOSPHERE: AtmosphereConfig = {
  regionId: 'forest_outskirts',
  // Dappled forest lighting
  ambientColor: new Color3(0.4, 0.48, 0.44),
  ambientIntensity: 0.48,
  sunColor: new Color3(0.95, 0.92, 0.8),
  sunIntensity: 0.95,
  sunDirection: new Vector3(-0.3, -0.95, -0.25),
  // Dense mist
  fogMode: 'exp2',
  fogDensity: 0.001,
  fogColor: new Color3(0.5, 0.55, 0.52),
  // Cool, desaturated tones
  contrast: 1.05,
  saturation: 0.95,
  brightness: 0.92,
  hueShift: -0.05,
  hazeFactor: 0.35,
  riftInfluence: 0.15,
}

/**
 * Warfront Approach - Harsh military zone, signs of conflict
 */
export const WARFRONT_ATMOSPHERE: AtmosphereConfig = {
  regionId: 'warfront_approach',
  // Harsh, desaturated war-time lighting
  ambientColor: new Color3(0.48, 0.45, 0.42),
  ambientIntensity: 0.54,
  sunColor: new Color3(0.9, 0.85, 0.75),
  sunIntensity: 1.28,
  sunDirection: new Vector3(-0.4, -0.98, -0.15),
  // Smoke and ash
  fogMode: 'exp2',
  fogDensity: 0.0012,
  fogColor: new Color3(0.65, 0.62, 0.58),
  // Gritty, war-torn color grades
  contrast: 1.25,
  saturation: 0.75,
  brightness: 0.88,
  hueShift: 0.08,
  hazeFactor: 0.5,
  riftInfluence: 0.4,
}

/**
 * Culvert Breach - Underground darkness, rift corruption
 */
export const CULVERT_ATMOSPHERE: AtmosphereConfig = {
  regionId: 'culvert_breach',
  // Minimal lighting, magical glow
  ambientColor: new Color3(0.35, 0.3, 0.4),
  ambientIntensity: 0.35,
  sunColor: new Color3(0.7, 0.6, 0.8),
  sunIntensity: 0.7,
  sunDirection: new Vector3(0, -1, 0),
  // Dense underground darkness
  fogMode: 'exp2',
  fogDensity: 0.0025,
  fogColor: new Color3(0.25, 0.2, 0.35),
  // Eerie, magical color grade
  contrast: 1.35,
  saturation: 0.6,
  brightness: 0.75,
  hueShift: -0.15,
  hazeFactor: 0.7,
  riftInfluence: 0.8,
}

/**
 * Outer Roads to Krondor - Transitional wilderness, dawn of hope
 */
export const OUTER_ROADS_ATMOSPHERE: AtmosphereConfig = {
  regionId: 'outer_roads_to_krondor',
  // Golden dawn lighting
  ambientColor: new Color3(0.62, 0.6, 0.58),
  ambientIntensity: 0.55,
  sunColor: new Color3(1, 0.9, 0.7),
  sunIntensity: 1.32,
  sunDirection: new Vector3(-0.32, -0.92, -0.22),
  // Clearing mist
  fogMode: 'exp2',
  fogDensity: 0.0005,
  fogColor: new Color3(0.7, 0.72, 0.75),
  // Hopeful color grade
  contrast: 1.18,
  saturation: 1.1,
  brightness: 0.98,
  hueShift: 0.03,
  hazeFactor: 0.2,
  riftInfluence: 0.2,
}

// Export all atmospheres
export const REGION_ATMOSPHERES: Record<string, AtmosphereConfig> = {
  crydee: CRYDEE_ATMOSPHERE,
  forest_outskirts: FOREST_ATMOSPHERE,
  warfront_approach: WARFRONT_ATMOSPHERE,
  culvert_breach: CULVERT_ATMOSPHERE,
  outer_roads_to_krondor: OUTER_ROADS_ATMOSPHERE,
}

/**
 * Apply atmosphere configuration to a scene
 */
export function applyRegionAtmosphere(scene: Scene, config: AtmosphereConfig): void {
  // Apply fog
  if (config.fogMode === 'linear') {
    scene.fogMode = Scene.FOGMODE_LINEAR
    if (config.fogStart !== undefined && config.fogEnd !== undefined) {
      scene.fogStart = config.fogStart
      scene.fogEnd = config.fogEnd
    }
  } else {
    scene.fogMode = Scene.FOGMODE_EXP2
    scene.fogDensity = config.fogDensity ?? 0.001
  }
  scene.fogColor = config.fogColor

  // Apply image processing (color grading)
  const imgProc = scene.imageProcessingConfiguration
  imgProc.isEnabled = true
  imgProc.contrast = config.contrast
  imgProc.exposure = config.brightness
  imgProc.colorCurvesEnabled = true

  const curves = imgProc.colorCurves ?? new ColorCurves()
  curves.globalSaturation = (config.saturation - 1) * 100
  curves.globalHue = config.hueShift * 180
  curves.highlightsHue = 35 + config.hueShift * 180
  curves.highlightsDensity = config.hazeFactor * 20
  curves.shadowsHue = 220 + config.hueShift * 180
  curves.shadowsDensity = config.riftInfluence * 40
  imgProc.colorCurves = curves

  // Store atmosphere config as metadata for dynamic updates
  ;(scene as any).atmosphereConfig = config
}

/**
 * Get atmosphere config for a region
 */
export function getRegionAtmosphere(regionId: string): AtmosphereConfig | undefined {
  return REGION_ATMOSPHERES[regionId]
}

/**
 * Blend between two atmosphere configurations
 */
export function blendAtmospheres(
  from: AtmosphereConfig,
  to: AtmosphereConfig,
  t: number, // 0-1 blend factor
): AtmosphereConfig {
  return {
    regionId: to.regionId,
    ambientColor: Color3.Lerp(from.ambientColor, to.ambientColor, t),
    ambientIntensity: from.ambientIntensity + (to.ambientIntensity - from.ambientIntensity) * t,
    sunColor: Color3.Lerp(from.sunColor, to.sunColor, t),
    sunIntensity: from.sunIntensity + (to.sunIntensity - from.sunIntensity) * t,
    sunDirection: Vector3.Lerp(from.sunDirection, to.sunDirection, t),
    fogMode: t < 0.5 ? from.fogMode : to.fogMode,
    fogDensity: (from.fogDensity ?? 0.001) + ((to.fogDensity ?? 0.001) - (from.fogDensity ?? 0.001)) * t,
    fogColor: Color3.Lerp(from.fogColor, to.fogColor, t),
    contrast: from.contrast + (to.contrast - from.contrast) * t,
    saturation: from.saturation + (to.saturation - from.saturation) * t,
    brightness: from.brightness + (to.brightness - from.brightness) * t,
    hueShift: from.hueShift + (to.hueShift - from.hueShift) * t,
    hazeFactor: from.hazeFactor + (to.hazeFactor - from.hazeFactor) * t,
    riftInfluence: from.riftInfluence + (to.riftInfluence - from.riftInfluence) * t,
  }
}
