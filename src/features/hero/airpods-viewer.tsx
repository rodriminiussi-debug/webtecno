'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'
import { Bud, CASE, CaseBase, CaseLid, useAirpodsMaterials } from './airpods-model'
import { damp } from './choreography'

function Model({ open }: { open: boolean }) {
  const materials = useAirpodsMaterials()
  const lid = useRef<THREE.Group>(null)
  const right = useRef<THREE.Group>(null)
  const left = useRef<THREE.Group>(null)
  const amount = useRef(open ? 1 : 0)

  useFrame((_, delta) => {
    amount.current = damp(amount.current, open ? 1 : 0, 5, Math.min(delta, 1 / 20))
    const a = amount.current
    if (lid.current) lid.current.rotation.x = -1.92 * a
    const lift = Math.max(0, (a - 0.5) * 2)
    const place = (group: THREE.Group | null, dir: 1 | -1) => {
      if (!group) return
      group.position.set(dir * 0.25, CASE.baseHeight + 0.075 + lift * 0.22, 0)
      group.rotation.set(0, dir === 1 ? Math.PI - 0.5 : -(Math.PI - 0.5), 0)
    }
    place(right.current, 1)
    place(left.current, -1)
  })

  return (
    <group position={[0, -0.45, 0]}>
      <CaseBase materials={materials} />
      <CaseLid ref={lid} materials={materials} />
      <Bud ref={right} materials={materials} />
      <Bud ref={left} materials={materials} mirrored />
    </group>
  )
}

export default function AirpodsViewer({ open, autoRotate }: { open: boolean; autoRotate: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ fov: 28, position: [2.2, 1.2, 4.2] }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping }}
      aria-label="Modelo 3D interactivo"
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[-3, 4, 5]} intensity={1.4} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 5, -1]} rotation-x={Math.PI / 2} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={2.2} position={[-5, 1.5, 1]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[5, 1, 1]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="ring" intensity={1.4} position={[0, 1, 6]} scale={4} />
      </Environment>
      <Model open={open} />
      <OrbitControls enablePan={false} enableZoom={false} autoRotate={autoRotate} autoRotateSpeed={0.8} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 1.9} target={[0, 0, 0]} />
    </Canvas>
  )
}
