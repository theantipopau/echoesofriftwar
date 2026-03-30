/**
 * Rift particle effects and magical visual elements
 * Used for corruption zones, rifts, and magical encounters
 */

import type { Scene } from '@babylonjs/core/scene'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder'
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder'
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'

export interface RiftParticleHandle {
  particles: ParticleSystem[]
  meshes: AbstractMesh[]
  dispose: () => void
}

/**
 * Create a rift corruption zone with particle effects
 */
export function createRiftCorruptionEffect(
  scene: Scene,
  position: Vector3,
  radius: number = 8,
): RiftParticleHandle {
  const particles: ParticleSystem[] = []
  const meshes: AbstractMesh[] = []

  // Purple glowing orb at center
  const orb = CreateSphere(`rift_orb_${position.x}`, { diameter: 1.6, segments: 8 }, scene)
  orb.position = position.add(new Vector3(0, 1.2, 0))
  orb.isPickable = false
  const orbMat = new StandardMaterial(`rift_orb_mat_${position.x}`, scene)
  orbMat.emissiveColor = new Color3(0.6, 0.2, 0.85)
  orbMat.alpha = 0.8
  orb.material = orbMat
  meshes.push(orb)

  // Rift crack pillars
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2
    const x = position.x + Math.cos(angle) * (radius * 0.5)
    const z = position.z + Math.sin(angle) * (radius * 0.5)
    const crack = CreateCylinder(`crack_${i}_${position.x}`, {
      height: 3 + i * 0.5,
      diameterTop: 0.1,
      diameterBottom: 0.8,
      tessellation: 4,
    }, scene)
    crack.position = new Vector3(x, position.y + (3 + i * 0.5) / 2, z)
    crack.rotation.z = 0.1 + i * 0.05
    crack.rotation.x = 0.05
    crack.isPickable = false
    const crackMat = new StandardMaterial(`crack_mat_${i}_${position.x}`, scene)
    crackMat.emissiveColor = new Color3(0.4, 0.15, 0.6)
    crack.material = crackMat
    meshes.push(crack)
  }

  // Particle system for rift energy
  const riftParticles = new ParticleSystem(`rift_particles_${position.x}`, 300, scene)
  riftParticles.emitter = position
  riftParticles.minEmitBox = new Vector3(-radius * 0.4, 0.5, -radius * 0.4)
  riftParticles.maxEmitBox = new Vector3(radius * 0.4, 2.5, radius * 0.4)
  riftParticles.color1 = new Color4(0.7, 0.3, 1, 1)
  riftParticles.color2 = new Color4(0.4, 0.1, 0.8, 0.8)
  riftParticles.colorDead = new Color4(0, 0, 0.1, 0)
  riftParticles.minSize = 0.15
  riftParticles.maxSize = 0.65
  riftParticles.minLifeTime = 1.8
  riftParticles.maxLifeTime = 4.2
  riftParticles.emitRate = 60
  riftParticles.gravity = new Vector3(0, 0.5, 0)
  riftParticles.direction1 = new Vector3(-1, 2, -1)
  riftParticles.direction2 = new Vector3(1, 4, 1)
  riftParticles.minAngularSpeed = 0
  riftParticles.maxAngularSpeed = Math.PI
  riftParticles.minEmitPower = 0.3
  riftParticles.maxEmitPower = 1.6
  riftParticles.updateSpeed = 0.015
  riftParticles.particleTexture = new Texture(
    `data:text/plain,`,
    scene,
    true,
    true,
    Texture.NEAREST_SAMPLINGMODE,
  )
  riftParticles.blendMode = ParticleSystem.BLENDMODE_ADD
  riftParticles.start()
  particles.push(riftParticles)

  // Ground glow circle
  const glow = CreatePlane(`rift_glow_${position.x}`, { width: radius * 2, height: radius * 2 }, scene)
  glow.position = new Vector3(position.x, position.y + 0.05, position.z)
  glow.rotation.x = Math.PI / 2
  glow.isPickable = false
  const glowMat = new StandardMaterial(`rift_glow_mat_${position.x}`, scene)
  glowMat.emissiveColor = new Color3(0.4, 0.1, 0.6)
  glowMat.alpha = 0.4
  glow.material = glowMat
  meshes.push(glow)

  return {
    particles,
    meshes,
    dispose: () => {
      particles.forEach((p) => p.dispose())
      meshes.forEach((m) => m.dispose())
    },
  }
}

/**
 * Create an ambient sparks effect (for forges, campfires, torches)
 */
export function createCampfireEffect(
  scene: Scene,
  position: Vector3,
): RiftParticleHandle {
  const particles: ParticleSystem[] = []
  const meshes: AbstractMesh[] = []

  // Ember glow column
  const glow = CreateCylinder(`fire_glow_${position.x}`, { height: 0.3, diameter: 1.5 }, scene)
  glow.position = position.add(new Vector3(0, 0.1, 0))
  glow.isPickable = false
  const glowMat = new StandardMaterial(`fire_glow_mat_${position.x}`, scene)
  glowMat.emissiveColor = new Color3(0.9, 0.4, 0.1)
  glowMat.alpha = 0.6
  glow.material = glowMat
  meshes.push(glow)

  // Flame particles
  const fireParticles = new ParticleSystem(`fire_particles_${position.x}`, 150, scene)
  fireParticles.emitter = position
  fireParticles.minEmitBox = new Vector3(-0.2, 0, -0.2)
  fireParticles.maxEmitBox = new Vector3(0.2, 0.5, 0.2)
  fireParticles.color1 = new Color4(1, 0.7, 0.2, 1)
  fireParticles.color2 = new Color4(1, 0.3, 0.05, 0.8)
  fireParticles.colorDead = new Color4(0.1, 0.05, 0.0, 0)
  fireParticles.minSize = 0.1
  fireParticles.maxSize = 0.4
  fireParticles.minLifeTime = 0.5
  fireParticles.maxLifeTime = 1.5
  fireParticles.emitRate = 80
  fireParticles.gravity = new Vector3(0, -0.2, 0)
  fireParticles.direction1 = new Vector3(-0.3, 2.5, -0.3)
  fireParticles.direction2 = new Vector3(0.3, 5, 0.3)
  fireParticles.minAngularSpeed = 0
  fireParticles.maxAngularSpeed = Math.PI * 2
  fireParticles.minEmitPower = 0.4
  fireParticles.maxEmitPower = 0.8
  fireParticles.updateSpeed = 0.016
  fireParticles.blendMode = ParticleSystem.BLENDMODE_ADD
  fireParticles.start()
  particles.push(fireParticles)

  // Smoke particles
  const smokeParticles = new ParticleSystem(`smoke_particles_${position.x}`, 60, scene)
  smokeParticles.emitter = position
  smokeParticles.minEmitBox = new Vector3(-0.2, 1, -0.2)
  smokeParticles.maxEmitBox = new Vector3(0.2, 1.5, 0.2)
  smokeParticles.color1 = new Color4(0.5, 0.5, 0.48, 0.5)
  smokeParticles.color2 = new Color4(0.3, 0.3, 0.3, 0.3)
  smokeParticles.colorDead = new Color4(0.2, 0.2, 0.2, 0)
  smokeParticles.minSize = 0.5
  smokeParticles.maxSize = 1.8
  smokeParticles.minLifeTime = 2
  smokeParticles.maxLifeTime = 4
  smokeParticles.emitRate = 15
  smokeParticles.gravity = new Vector3(0, 0, 0)
  smokeParticles.direction1 = new Vector3(-0.2, 1.5, -0.2)
  smokeParticles.direction2 = new Vector3(0.2, 3, 0.2)
  smokeParticles.minAngularSpeed = 0.2  
  smokeParticles.maxAngularSpeed = 0.8
  smokeParticles.minEmitPower = 0.2
  smokeParticles.maxEmitPower = 0.5
  smokeParticles.updateSpeed = 0.016
  smokeParticles.blendMode = ParticleSystem.BLENDMODE_MULTIPLY
  smokeParticles.start()
  particles.push(smokeParticles)

  return {
    particles,
    meshes,
    dispose: () => {
      particles.forEach((p) => p.dispose())
      meshes.forEach((m) => m.dispose())
    },
  }
}

/**
 * Create dust/sand particles for desert/warfront ambience
 */
export function createDustEffect(
  scene: Scene,
  center: Vector3,
  areaSize: number = 200,
): RiftParticleHandle {
  const particles: ParticleSystem[] = []

  const dustParticles = new ParticleSystem(`dust_${center.x}`, 200, scene)
  dustParticles.emitter = center
  dustParticles.minEmitBox = new Vector3(-areaSize / 2, 0, -areaSize / 2)
  dustParticles.maxEmitBox = new Vector3(areaSize / 2, 3, areaSize / 2)
  dustParticles.color1 = new Color4(0.7, 0.6, 0.5, 0.3)
  dustParticles.color2 = new Color4(0.8, 0.7, 0.6, 0.2)
  dustParticles.colorDead = new Color4(0.5, 0.45, 0.4, 0)
  dustParticles.minSize = 0.2
  dustParticles.maxSize = 1.2
  dustParticles.minLifeTime = 6
  dustParticles.maxLifeTime = 14
  dustParticles.emitRate = 8
  dustParticles.gravity = new Vector3(0, -0.05, 0)
  dustParticles.direction1 = new Vector3(-2, 0.2, -2)
  dustParticles.direction2 = new Vector3(2, 1.5, 2)
  dustParticles.minAngularSpeed = 0
  dustParticles.maxAngularSpeed = Math.PI / 4
  dustParticles.minEmitPower = 0.5
  dustParticles.maxEmitPower = 1.5
  dustParticles.updateSpeed = 0.016
  dustParticles.blendMode = ParticleSystem.BLENDMODE_STANDARD
  dustParticles.start()
  particles.push(dustParticles)

  return {
    particles,
    meshes: [],
    dispose: () => particles.forEach((p) => p.dispose()),
  }
}

/**
 * Create a flying debris effect for war zones
 */
export function createWarAshEffect(
  scene: Scene,
  center: Vector3,
  areaSize: number = 200,
): RiftParticleHandle {
  const particles: ParticleSystem[] = []

  const ashParticles = new ParticleSystem(`ash_${center.x}`, 180, scene)
  ashParticles.emitter = center
  ashParticles.minEmitBox = new Vector3(-areaSize / 2, 0.5, -areaSize / 2)
  ashParticles.maxEmitBox = new Vector3(areaSize / 2, 4, areaSize / 2)
  ashParticles.color1 = new Color4(0.5, 0.48, 0.45, 0.5)
  ashParticles.color2 = new Color4(0.3, 0.28, 0.25, 0.3)
  ashParticles.colorDead = new Color4(0.2, 0.2, 0.2, 0)
  ashParticles.minSize = 0.05
  ashParticles.maxSize = 0.3
  ashParticles.minLifeTime = 4
  ashParticles.maxLifeTime = 10
  ashParticles.emitRate = 12
  ashParticles.gravity = new Vector3(0.5, -0.02, 0.5)
  ashParticles.direction1 = new Vector3(-1.5, 0.1, -1.5)
  ashParticles.direction2 = new Vector3(1.5, 2, 1.5)
  ashParticles.minAngularSpeed = 0.5
  ashParticles.maxAngularSpeed = Math.PI
  ashParticles.minEmitPower = 0.2
  ashParticles.maxEmitPower = 1
  ashParticles.updateSpeed = 0.016
  ashParticles.blendMode = ParticleSystem.BLENDMODE_STANDARD
  ashParticles.start()
  particles.push(ashParticles)

  return {
    particles,
    meshes: [],
    dispose: () => particles.forEach((p) => p.dispose()),
  }
}

/**
 * Create a glowing ground sigil for major rift POIs
 */
export function createRiftGroundSigil(
  scene: Scene,
  position: Vector3,
  radius: number = 10,
): RiftParticleHandle {
  const meshes: AbstractMesh[] = []

  const outer = CreatePlane(`rift_sigil_outer_${position.x}`, { width: radius * 2, height: radius * 2 }, scene)
  outer.position = new Vector3(position.x, position.y + 0.06, position.z)
  outer.rotation.x = Math.PI / 2
  outer.isPickable = false
  const outerMat = new StandardMaterial(`rift_sigil_outer_mat_${position.x}`, scene)
  outerMat.emissiveColor = new Color3(0.35, 0.1, 0.55)
  outerMat.alpha = 0.3
  outer.material = outerMat
  meshes.push(outer)

  const inner = CreatePlane(`rift_sigil_inner_${position.x}`, { width: radius * 1.25, height: radius * 1.25 }, scene)
  inner.position = new Vector3(position.x, position.y + 0.08, position.z)
  inner.rotation.x = Math.PI / 2
  inner.isPickable = false
  const innerMat = new StandardMaterial(`rift_sigil_inner_mat_${position.x}`, scene)
  innerMat.emissiveColor = new Color3(0.55, 0.18, 0.75)
  innerMat.alpha = 0.24
  inner.material = innerMat
  meshes.push(inner)

  return {
    particles: [],
    meshes,
    dispose: () => meshes.forEach((m) => m.dispose()),
  }
}

/**
 * Create a field of dark scorch marks for warfront terrain dressing
 */
export function createWarScorchField(
  scene: Scene,
  center: Vector3,
  radius: number = 28,
  marks: number = 8,
): RiftParticleHandle {
  const meshes: AbstractMesh[] = []

  for (let i = 0; i < marks; i++) {
    const angle = (i / marks) * Math.PI * 2
    const spread = radius * (0.35 + ((i * 37) % 100) / 140)
    const x = center.x + Math.cos(angle) * spread
    const z = center.z + Math.sin(angle) * spread

    const burn = CreatePlane(`war_scorch_${center.x}_${i}`, {
      width: 2.4 + (i % 4) * 0.6,
      height: 1.8 + (i % 3) * 0.7,
    }, scene)
    burn.position = new Vector3(x, center.y + 0.03, z)
    burn.rotation.x = Math.PI / 2
    burn.rotation.z = ((i * 17) % 180) * (Math.PI / 180)
    burn.isPickable = false

    const burnMat = new StandardMaterial(`war_scorch_mat_${center.x}_${i}`, scene)
    burnMat.diffuseColor = new Color3(0.06, 0.05, 0.05)
    burnMat.emissiveColor = new Color3(0.02, 0.015, 0.01)
    burnMat.alpha = 0.36
    burn.material = burnMat
    meshes.push(burn)
  }

  return {
    particles: [],
    meshes,
    dispose: () => meshes.forEach((m) => m.dispose()),
  }
}
