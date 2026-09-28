'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { Bud, CASE, CaseBase, CaseLid, useAirpodsMaterials } from './airpods-model'
import { TIMELINE, damp, easeInOutCubic, easeOutExpo, lerp, segment } from './choreography'

export type SceneInputs = {
  /** Scroll progress through the hero, 0 → 1 */
  progress: () => number
  /** Normalized pointer position, -1 → 1 */
  pointer: MutableRefObject<{ x: number; y: number }>
  /** Horizontal offset of the product before the story starts: -1 left, 0 center, 1 right */
  side: number
  lightBackground: boolean
  onReady: () => void
}

const BUD_REST = { x: 0.25, y: CASE.baseHeight + 0.075 }

function Rig({ progress, pointer, side, onReady }: Omit<SceneInputs, 'lightBackground'>) {
  const materials = useAirpodsMaterials()
  const root = useRef<THREE.Group>(null)
  const caseGroup = useRef<THREE.Group>(null)
  const lid = useRef<THREE.Group>(null)
  const budRight = useRef<THREE.Group>(null)
  const budLeft = useRef<THREE.Group>(null)
  const { camera, size } = useThree()
  const start = useRef<number | null>(null)
  const ready = useRef(false)
  // Smoothed state: scroll jumps (wheel, scrollbar drags) are eased instead of snapping
  const state = useRef({ p: 0, px: 0, py: 0 })

  useFrame((frame, delta) => {
    const dt = Math.min(delta, 1 / 20)
    const s = state.current
    if (start.current === null) start.current = frame.clock.elapsedTime
    const t = frame.clock.elapsedTime
    const intro = easeOutExpo(Math.min((t - start.current) / 2.2, 1))

    s.p = damp(s.p, progress(), 7, dt)
    s.px = damp(s.px, pointer.current.x, 3, dt)
    s.py = damp(s.py, pointer.current.y, 3, dt)
    const p = s.p

    const portrait = size.width < size.height
    const recenter = easeInOutCubic(segment(p, ...TIMELINE.recenter))
    const lidOpen = easeInOutCubic(segment(p, ...TIMELINE.lidOpen))
    const rise = easeInOutCubic(segment(p, ...TIMELINE.budsRise))
    const spread = easeInOutCubic(segment(p, ...TIMELINE.budsSpread))
    const away = easeInOutCubic(segment(p, ...TIMELINE.caseAway))
    const closeUp = easeInOutCubic(segment(p, ...TIMELINE.closeUp))
    const finale = easeInOutCubic(segment(p, ...TIMELINE.finale))

    // --- Whole product -------------------------------------------------------
    if (root.current) {
      const idle = Math.sin(t * 0.45) * 0.07
      const offsetX = portrait ? 0 : side * 0.95 * (1 - recenter)
      root.current.position.set(
        offsetX,
        lerp(-0.9, portrait ? -0.25 : -0.32, intro) + Math.sin(t * 0.9) * 0.012 - finale * 0.08,
        0,
      )
      root.current.rotation.set(
        0.16 + s.py * 0.08 + away * 0.05,
        lerp(-1.6, -0.5, intro) + idle + s.px * 0.2 + recenter * 0.28 + finale * 0.55,
        0,
      )
      const scale = lerp(0.8, 1, intro) * (portrait ? 0.78 : 1)
      root.current.scale.setScalar(scale)
    }

    // --- Case: opens, then steps back so the buds take the stage -------------
    if (lid.current) lid.current.rotation.x = -1.92 * lidOpen
    if (caseGroup.current) {
      // Portrait screens need the case fully out of frame: the copy and CTAs sit at the bottom
      caseGroup.current.position.set(0, -0.75 * away - (portrait ? 3.2 : 1.7) * finale - (portrait ? 0.6 * closeUp : 0), -1.6 * away)
      caseGroup.current.rotation.x = 0.35 * away
    }

    // --- Buds: rise out of the case, then separate and turn to show profile --
    const spreadX = portrait ? 0.24 : 0.4
    const place = (group: THREE.Group | null, dir: 1 | -1) => {
      if (!group) return
      group.position.set(
        dir * lerp(BUD_REST.x, spreadX, spread),
        BUD_REST.y + 0.62 * rise - 0.3 * spread + dir * 0.06 * spread,
        0.32 * spread,
      )
      // In the case the tips face inward; on stage they turn toward the camera
      group.rotation.set(
        -0.12 * spread,
        dir === 1 ? lerp(Math.PI - 0.5, Math.PI * 0.72, spread) : lerp(-(Math.PI - 0.5), -Math.PI * 0.72, spread),
        dir * lerp(0, -0.42, spread) + dir * Math.sin(t * 0.7 + (dir === 1 ? 0 : 1.4)) * 0.03 * spread,
      )
    }
    place(budRight.current, 1)
    place(budLeft.current, -1)

    // --- Camera: dolly in on the buds -----------------------------------------
    const distance = portrait ? lerp(6.6, 5.2, closeUp) : lerp(5.2, 3.5, closeUp)
    camera.position.set(0, lerp(0.35, 0.6, closeUp), distance)
    camera.lookAt(0, lerp(0.05, 0.3, closeUp) + (portrait ? -0.05 - 0.35 * closeUp : 0), 0)

    if (!ready.current) {
      ready.current = true
      onReady()
    }
  })

  return (
    <group ref={root}>
      <group ref={caseGroup}>
        <CaseBase materials={materials} />
        <CaseLid ref={lid} materials={materials} />
      </group>
      <Bud ref={budRight} materials={materials} />
      <Bud ref={budLeft} materials={materials} mirrored />
    </group>
  )
}

export default function AirpodsScene({ active, ...inputs }: SceneInputs & { active: boolean }) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.75]}
      camera={{ fov: 28, near: 0.1, far: 50, position: [0, 0.35, 5.2] }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.05 }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[-3, 4, 5]} intensity={1.4} />
      <directionalLight position={[4, 1, -3]} intensity={0.8} color="#dfe6ff" />
      {/* Studio lighting from light panels: no HDR download needed */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3.2} position={[0, 5, -1]} rotation-x={Math.PI / 2} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={2.4} position={[-5, 1.5, 1]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[5, 1, 1]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="ring" intensity={1.6} position={[0, 1, 6]} scale={4} />
        <Lightformer form="rect" intensity={0.6} position={[0, -4, 0]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} color="#8a8a8a" />
      </Environment>
      <Rig {...inputs} />
      {inputs.lightBackground && <ContactShadows position={[0, -0.34, 0]} opacity={0.35} scale={5} blur={2.6} far={1.6} resolution={512} />}
    </Canvas>
  )
}
