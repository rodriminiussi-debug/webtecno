'use client'

import { forwardRef, useMemo } from 'react'
import * as THREE from 'three'

// Procedural model built from a handful of primitives: no downloaded asset,
// ~20 draw calls, and every moving part (lid, buds) is its own group so the
// scene can choreograph it.

export const CASE = { width: 1.2, baseHeight: 0.56, lidHeight: 0.34, depth: 0.44, bevel: 0.11 } as const

function roundedProfile(width: number, height: number, bottomRadius: number, topRadius: number) {
  const shape = new THREE.Shape()
  const x0 = -width / 2
  const x1 = width / 2
  shape.moveTo(x0 + bottomRadius, 0)
  shape.lineTo(x1 - bottomRadius, 0)
  shape.quadraticCurveTo(x1, 0, x1, bottomRadius)
  shape.lineTo(x1, height - topRadius)
  shape.quadraticCurveTo(x1, height, x1 - topRadius, height)
  shape.lineTo(x0 + topRadius, height)
  shape.quadraticCurveTo(x0, height, x0, height - topRadius)
  shape.lineTo(x0, bottomRadius)
  shape.quadraticCurveTo(x0, 0, x0 + bottomRadius, 0)
  return shape
}

function pillowGeometry(height: number, bottomRadius: number, topRadius: number) {
  const { width, depth, bevel } = CASE
  const inner = roundedProfile(width - bevel * 2, height - bevel * 2, bottomRadius, topRadius)
  const geometry = new THREE.ExtrudeGeometry(inner, {
    depth: depth - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 12,
    curveSegments: 40,
  })
  // Origin at bottom-center of the outer volume, centered in depth
  geometry.translate(0, bevel, -(depth - bevel * 2) / 2)
  geometry.computeVertexNormals()
  return geometry
}

export type Materials = ReturnType<typeof useAirpodsMaterials>

export function useAirpodsMaterials() {
  return useMemo(
    () => ({
      shell: new THREE.MeshPhysicalMaterial({
        color: '#f7f7f5',
        roughness: 0.32,
        metalness: 0,
        clearcoat: 0.7,
        clearcoatRoughness: 0.18,
        sheen: 0.2,
      }),
      inner: new THREE.MeshStandardMaterial({ color: '#d7d7d3', roughness: 0.55 }),
      cavity: new THREE.MeshStandardMaterial({ color: '#8f8f8a', roughness: 0.9 }),
      silicone: new THREE.MeshPhysicalMaterial({ color: '#e9e9e6', roughness: 0.62, sheen: 0.4 }),
      mesh: new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.85 }),
      chrome: new THREE.MeshStandardMaterial({ color: '#dcdcdc', metalness: 1, roughness: 0.16 }),
      led: new THREE.MeshStandardMaterial({ color: '#bff5cf', emissive: '#7dffa8', emissiveIntensity: 2.2 }),
    }),
    [],
  )
}

export const CaseBase = forwardRef<THREE.Group, { materials: Materials }>(function CaseBase({ materials }, ref) {
  const geometry = useMemo(() => pillowGeometry(CASE.baseHeight, 0.19, 0.012), [])
  const top = CASE.baseHeight + 0.001
  return (
    <group ref={ref}>
      <mesh geometry={geometry} material={materials.shell} />
      {/* Bud cavities */}
      {[-0.25, 0.25].map((x) => (
        <mesh key={x} position={[x, top, 0]} scale={[1, 1, 0.62]} material={materials.cavity}>
          <cylinderGeometry args={[0.15, 0.15, 0.004, 48]} />
        </mesh>
      ))}
      {/* Status LED */}
      <mesh position={[0, CASE.baseHeight * 0.52, CASE.depth / 2 + 0.001]} material={materials.led}>
        <sphereGeometry args={[0.012, 16, 16]} />
      </mesh>
      {/* Charging port */}
      <mesh position={[0, 0.004, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.35]} material={materials.mesh}>
        <capsuleGeometry args={[0.025, 0.09, 6, 12]} />
      </mesh>
    </group>
  )
})

/** Lid geometry is offset so the group origin sits on the hinge (back-bottom edge). */
export const CaseLid = forwardRef<THREE.Group, { materials: Materials }>(function CaseLid({ materials }, ref) {
  const geometry = useMemo(() => {
    const lid = pillowGeometry(CASE.lidHeight, 0.012, 0.12)
    lid.translate(0, 0, CASE.depth / 2)
    return lid
  }, [])
  return (
    <group ref={ref} position={[0, CASE.baseHeight + 0.002, -CASE.depth / 2]}>
      <mesh geometry={geometry} material={materials.shell} />
      {/* Hinge */}
      <mesh position={[0, 0, 0.01]} rotation={[0, 0, Math.PI / 2]} material={materials.chrome}>
        <cylinderGeometry args={[0.018, 0.018, 0.34, 16]} />
      </mesh>
    </group>
  )
})

/**
 * One earbud, modelled as the right one: ear tip on +X, stem pointing down.
 * The left bud is the same group mirrored on X.
 */
export const Bud = forwardRef<THREE.Group, { materials: Materials; mirrored?: boolean }>(function Bud({ materials, mirrored = false }, ref) {
  return (
    <group ref={ref}>
      <group scale={[mirrored ? -1 : 1, 1, 1]}>
        {/* Head: an oblong shell leaning toward the ear tip */}
        <mesh position={[0.015, 0, 0]} rotation={[0, 0, -0.18]} scale={[1.28, 0.94, 0.92]} material={materials.shell}>
          <sphereGeometry args={[0.1, 56, 56]} />
        </mesh>
        {/* Silicone tip + speaker mesh */}
        <mesh position={[0.128, -0.012, 0]} rotation={[0, 0, -0.35]} scale={[0.72, 0.95, 0.95]} material={materials.silicone}>
          <sphereGeometry args={[0.064, 40, 40]} />
        </mesh>
        <mesh position={[0.172, -0.028, 0]} rotation={[0, 0, Math.PI / 2 - 0.35]} material={materials.mesh}>
          <cylinderGeometry args={[0.028, 0.028, 0.01, 32]} />
        </mesh>
        {/* Acoustic vent */}
        <mesh position={[-0.062, 0.045, 0.07]} rotation={[0.35, -0.5, 0.5]} scale={[0.55, 1, 0.3]} material={materials.mesh}>
          <capsuleGeometry args={[0.016, 0.034, 6, 12]} />
        </mesh>
        {/* Stem */}
        <group position={[-0.055, -0.055, 0]} rotation={[0, 0, 0.12]}>
          <mesh position={[0, -0.15, 0]} material={materials.shell}>
            <capsuleGeometry args={[0.031, 0.28, 12, 32]} />
          </mesh>
          <mesh position={[0, -0.318, 0]} material={materials.chrome}>
            <cylinderGeometry args={[0.0305, 0.028, 0.03, 32]} />
          </mesh>
        </group>
      </group>
    </group>
  )
})
