import type { Scene } from '@babylonjs/core/scene'
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { Color3 } from '@babylonjs/core/Maths/math.color'
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
const vegetationMaterialCache = new Map<string, StandardMaterial>()

function getVegetationMaterial(scene: Scene, key: string, texturePath: string, emissive: Color3): StandardMaterial {
  const cacheKey = `${scene.uid}_${key}`
  const existing = vegetationMaterialCache.get(cacheKey)
  if (existing) {
    return existing
  }

  const texture = new Texture(assetPath(texturePath), scene)
  texture.hasAlpha = true
  texture.anisotropicFilteringLevel = 8

  const material = new StandardMaterial(`veg_mat_${key}_${scene.uid}`, scene)
  material.diffuseTexture = texture
  material.opacityTexture = texture
  material.useAlphaFromDiffuseTexture = true
  material.backFaceCulling = false
  material.specularColor = Color3.Black()
  material.emissiveColor = emissive
  vegetationMaterialCache.set(cacheKey, material)
  return material
}

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

  const plane = CreatePlane(`vegetation_plane_${type}`, { width: 3.2, height: 2.8 }, scene)
  plane.parent = veg
  plane.billboardMode = 2
  plane.isPickable = false

  if (type === 'tree') {
    plane.position.y = 2.1
    plane.scaling.setAll(2.4)
    plane.material = getVegetationMaterial(scene, 'tree_cluster', 'vegetation/treesandlog.png', new Color3(0.16, 0.2, 0.14))
  } else if (type === 'grass') {
    plane.position.y = 0.48
    plane.scaling = new Vector3(1.3, 0.95, 1)
    plane.material = getVegetationMaterial(scene, 'grass_tuft', 'vegetation/bush.png', new Color3(0.18, 0.22, 0.15))
  } else {
    plane.position.y = 0.72
    plane.scaling = new Vector3(1.6, 1.2, 1)
    plane.material = getVegetationMaterial(scene, 'bush_cluster', 'vegetation/bush.png', new Color3(0.17, 0.22, 0.14))
  }

  // Metadata remains useful for future replacement with authored 3D vegetation.
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
