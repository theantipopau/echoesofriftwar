import type { Scene } from '@babylonjs/core/scene'
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { assetPath } from '../../utils/assetPaths'

export interface BuildingSpec {
  model: string
  position: Vector3
  rotation?: Vector3
  scale?: number
}

export interface PropSpec {
  model: string
  position: Vector3
  rotation?: Vector3
  scale?: number
}

const BUILDING_MODELS_FOLDER = 'models/buildings/'
const templateCache = new Map<string, TransformNode>()
const loadingCache = new Map<string, Promise<TransformNode | null>>()

/**
 * Load and cache a building model template from the Medieval Village MegaKit
 */
async function loadBuildingTemplate(scene: Scene, modelFile: string): Promise<TransformNode | null> {
  const cacheKey = `building_${modelFile}`
  
  const existing = templateCache.get(cacheKey)
  if (existing) {
    return existing
  }

  const inFlight = loadingCache.get(cacheKey)
  if (inFlight) {
    return inFlight
  }

  const promise = (async (): Promise<TransformNode | null> => {
    try {
      const result = await SceneLoader.ImportMeshAsync(
        '',
        assetPath(BUILDING_MODELS_FOLDER),
        modelFile,
        scene
      )

      const root = new TransformNode(`building_template_${modelFile.replace(/[^a-zA-Z0-9_]/g, '_')}`, scene)
      root.setEnabled(false)

      const meshes = result.meshes.filter((m) => m.name !== '__root__')
      meshes.forEach((mesh) => {
        mesh.parent = root
        mesh.isPickable = false
        mesh.receiveShadows = true
      })

      templateCache.set(cacheKey, root)
      return root
    } catch (error) {
      console.warn(`Failed to load building model: ${modelFile}`, error)
      return null
    } finally {
      loadingCache.delete(cacheKey)
    }
  })()

  loadingCache.set(cacheKey, promise)
  return promise
}

/**
 * Place a building instance in the world
 */
export async function placeBuilding(
  scene: Scene,
  spec: BuildingSpec,
  name: string
): Promise<TransformNode | null> {
  const template = await loadBuildingTemplate(scene, spec.model)
  if (!template) {
    return null
  }

  const instance = template.instantiateHierarchy(undefined, { doNotInstantiate: false }) as TransformNode | null
  if (!instance) {
    return null
  }

  instance.name = name
  instance.position = spec.position
  if (spec.rotation) {
    instance.rotation = spec.rotation
  }
  if (spec.scale !== undefined) {
    instance.scaling = new Vector3(spec.scale, spec.scale, spec.scale)
  }

  instance.setEnabled(true)
  return instance
}

/**
 * Create a simple wood fence from individual pieces
 */
export function createFenceSegment(
  scene: Scene,
  position: Vector3,
  length: number = 1,
  height: number = 1.5
): TransformNode {
  const fence = new TransformNode('fence_segment', scene)
  fence.position = position

  // Placeholder: will be replaced with actual model instances when available
  // For now, using simple geometric representation
  return fence
}

/**
 * Create terrain vegetation markers (trees, grass, etc.)
 */
export function createVegetationMarker(
  scene: Scene,
  position: Vector3,
  type: 'tree' | 'bush' | 'grass'
): TransformNode {
  const veg = new TransformNode(`vegetation_${type}`, scene)
  veg.position = position
  
  // Metadata for rendering system to replace with proper models
  veg.metadata = { type: `vegetation_${type}` }
  
  return veg
}

/**
 * Batch load multiple building models for a region
 */
export async function preloadBuildingModels(scene: Scene, modelFiles: string[]): Promise<void> {
  await Promise.all(modelFiles.map((file) => loadBuildingTemplate(scene, file)))
}

/**
 * Clear the model template cache (useful for memory management)
 */
export function clearModelCache(): void {
  templateCache.forEach((template) => template.dispose())
  templateCache.clear()
  loadingCache.clear()
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): { cached: number; loading: number } {
  return {
    cached: templateCache.size,
    loading: loadingCache.size,
  }
}
