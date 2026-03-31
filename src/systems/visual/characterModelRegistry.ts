import type { Scene } from '@babylonjs/core/scene'
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { assetPath } from '../../utils/assetPaths'

export interface CharacterTintSpec {
  color: Color3
  emissive?: Color3
}

export interface CharacterModelSpec {
  folder: string
  file: string
  scale: number
  yOffset: number
  tint?: CharacterTintSpec
}

const templateByKey = new Map<string, TransformNode>()
const loadingByKey = new Map<string, Promise<TransformNode | null>>()

function buildModelKey(spec: CharacterModelSpec): string {
  return `${spec.folder}/${spec.file}`
}

async function loadTemplate(scene: Scene, spec: CharacterModelSpec): Promise<TransformNode | null> {
  const key = buildModelKey(spec)
  const existing = templateByKey.get(key)
  if (existing) {
    return existing
  }

  const inFlight = loadingByKey.get(key)
  if (inFlight) {
    return inFlight
  }

  const promise = (async (): Promise<TransformNode | null> => {
    try {
      const result = await SceneLoader.ImportMeshAsync('', assetPath(spec.folder), spec.file, scene)
      const root = new TransformNode(`template_${spec.file.replace(/[^a-zA-Z0-9_]/g, '_')}`, scene)
      root.setEnabled(false)

      const meshes = result.meshes.filter((mesh) => mesh.name !== '__root__')
      if (meshes.length === 0) {
        root.dispose()
        return null
      }

      meshes.forEach((mesh) => {
        mesh.parent = root
        mesh.isPickable = false
      })

      templateByKey.set(key, root)
      return root
    } catch (error) {
      console.warn(`Model template failed to load: ${key}`, error)
      return null
    } finally {
      loadingByKey.delete(key)
    }
  })()

  loadingByKey.set(key, promise)
  return promise
}

function configureInstanceMeshes(meshes: AbstractMesh[]): void {
  meshes.forEach((mesh) => {
    mesh.isPickable = false
    mesh.receiveShadows = true
  })
}

function applyMaterialTint(meshes: AbstractMesh[], tint: CharacterTintSpec, instanceName: string): void {
  const materialCache = new Map<string, StandardMaterial | PBRMaterial>()

  meshes.forEach((mesh) => {
    const material = mesh.material
    if (!material) {
      return
    }

    const cacheKey = material.uniqueId.toString()
    let tinted = materialCache.get(cacheKey)
    if (!tinted) {
      const cloned = material.clone(`${material.name}_${instanceName}`)
      if (!cloned) {
        return
      }

      if (cloned instanceof PBRMaterial) {
        cloned.albedoColor = tint.color.clone()
        if (tint.emissive) {
          cloned.emissiveColor = tint.emissive.clone()
        }
        tinted = cloned
      } else if (cloned instanceof StandardMaterial) {
        cloned.diffuseColor = tint.color.clone()
        if (tint.emissive) {
          cloned.emissiveColor = tint.emissive.clone()
        }
        tinted = cloned
      } else {
        return
      }

      materialCache.set(cacheKey, tinted)
    }

    mesh.material = tinted
  })
}

export async function createCharacterModelInstance(
  scene: Scene,
  spec: CharacterModelSpec,
  name: string,
): Promise<TransformNode | null> {
  const template = await loadTemplate(scene, spec)
  if (!template) {
    return null
  }

  const instanceRoot = template.instantiateHierarchy(undefined, { doNotInstantiate: false }) as TransformNode | null
  if (!instanceRoot) {
    return null
  }

  instanceRoot.name = name
  instanceRoot.setEnabled(true)
  instanceRoot.position = new Vector3(0, spec.yOffset, 0)
  instanceRoot.scaling = new Vector3(spec.scale, spec.scale, spec.scale)
  const childMeshes = instanceRoot.getChildMeshes()
  configureInstanceMeshes(childMeshes)
  if (spec.tint) {
    applyMaterialTint(childMeshes, spec.tint, name)
  }
  return instanceRoot
}
