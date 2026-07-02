'use client'

import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Html, useGLTF } from '@react-three/drei'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

const MODEL_URL = '/models/macbook/mac-draco.glb'
const DRACO_PATH = '/draco/'
const FOV = 35

// Lid hinge angles (rotation.x of the hinge group).
// 1.575 = lid closed flat on the base, negative = leaned past vertical.
const HINGE_CLOSED = 1.575
const HINGE_OVERSHOOT = -0.7
const HINGE_OPEN = -0.25

// Initial "isometric-ish" viewing tilt, mirrors the old CSS
// rotateX(-24deg) rotateY(-32deg) starting scene transform.
const TILT_X = 0.4
const TILT_Y = -0.55

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
const lerp = THREE.MathUtils.lerp

// The old CSS animation used view-timeline "cover" progress over the 300vh
// sticky section: cover 0% sits one viewport before the section top, so at
// scrollY=0 progress is already 0.25. All keyframe ranges below assume that
// same 0..1 scale (spin/flip/open: 0.25-0.55, straighten: 0.35-0.65, zoom: 0.6-0.9).
function scrollProgress() {
  const vh = window.innerHeight
  return (window.scrollY + vh) / (vh * 4)
}

function ScreenContent() {
  return (
    <div className="l3d" onPointerDown={(e) => e.stopPropagation()}>
      <style>{`
        /* laid out at 2x (668x432) and scaled down by distanceFactor 0.5
           so the DOM rasterizes sharper during the deep scroll zoom */
        .l3d {
          width: 668px;
          height: 432px;
          background:
            radial-gradient(circle at 12% 10%, rgb(217 255 63 / 0.45), transparent 180px),
            radial-gradient(circle at 88% 16%, rgb(0 213 255 / 0.22), transparent 160px),
            #fbfbf4;
          color: hsl(0 0% 2%);
          font-family: system-ui, sans-serif;
          display: grid;
          grid-template-rows: auto 1fr auto;
          gap: 12px;
          padding: 16px;
          overflow: hidden;
          border-radius: 6px;
        }
        .l3d nav {
          align-items: center;
          border: 2px solid hsl(0 0% 2%);
          box-shadow: 4px 4px 0 hsl(0 0% 2%);
          display: flex;
          gap: 8px;
          font-size: 12px;
          font-weight: 800;
          justify-content: space-between;
          padding: 6px 10px;
          background: white;
        }
        .l3d nav strong {
          background: #d9ff3f;
          border: 2px solid hsl(0 0% 2%);
          padding: 2px 8px;
          font-size: 14px;
        }
        .l3d .chat-mock {
          align-self: center;
          display: grid;
          justify-items: center;
          gap: 16px;
          width: 100%;
          padding-bottom: 24px;
        }
        .l3d h2 {
          font-family: 'EB Garamond', serif;
          font-size: 54px;
          font-style: italic;
          font-weight: 800;
          line-height: 1;
          margin: 0;
          text-align: center;
        }
        .l3d .input-mock {
          align-items: center;
          background: white;
          border: 2px solid hsl(0 0% 2%);
          border-radius: 999px;
          box-shadow: 4px 4px 0 hsl(0 0% 2%);
          color: hsl(0 0% 45%);
          display: flex;
          font-size: 13px;
          font-weight: 600;
          justify-content: space-between;
          padding: 10px 8px 10px 18px;
          width: 72%;
        }
        .l3d .input-mock i {
          align-items: center;
          background: hsl(0 0% 2%);
          border-radius: 999px;
          color: white;
          display: flex;
          font-size: 14px;
          font-style: normal;
          height: 24px;
          justify-content: center;
          width: 24px;
        }
        .l3d .pills {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          justify-content: center;
          max-width: 84%;
        }
        .l3d .pills span {
          background: white;
          border: 2px solid hsl(0 0% 2%);
          border-radius: 999px;
          box-shadow: 3px 3px 0 hsl(0 0% 2%);
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.04em;
          padding: 7px 12px;
          text-transform: uppercase;
        }
      `}</style>
      <nav>
        <strong>Laptick</strong>
        <span>Chat with AI</span>
        <span>All Laptops</span>
        <span>Buying Guides</span>
        <span>Understanding</span>
        <span>About</span>
      </nav>
      <div className="chat-mock">
        <h2>Ready when you are.</h2>
        <div className="input-mock">
          <span>Ask about laptops (e.g. gaming under 80k)...</span>
          <i>→</i>
        </div>
        <div className="pills">
          <span>Best coding laptop under 60k</span>
          <span>High-end gaming laptop with RTX 4060</span>
          <span>MacBook Air for college students</span>
          <span>Premium laptop with OLED display</span>
        </div>
      </div>
    </div>
  )
}

// Procedural studio lighting (three's RoomEnvironment) — instant, no
// HDR download, which previously delayed the laptop's first paint by seconds.
function StudioEnvironment() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = env.texture
    return () => {
      scene.environment = null
      env.texture.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])
  return null
}

type MacModelProps = {
  hingeRef: React.RefObject<THREE.Group | null>
  markerRef: React.RefObject<THREE.Group | null>
  onReady?: () => void
}

function MacModel({ hingeRef, markerRef, onReady }: MacModelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { nodes, materials } = useGLTF(MODEL_URL, DRACO_PATH) as any
  useEffect(() => {
    onReady?.()
  }, [onReady])
  return (
    <group dispose={null}>
      <group ref={hingeRef} position={[0, -0.04, 0.41]} rotation={[HINGE_CLOSED, 0, 0]}>
        <group position={[0, 2.96, -0.13]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh geometry={nodes.Cube008.geometry} material={materials.aluminium} />
          <mesh geometry={nodes.Cube008_1.geometry} material={materials['matte.001']} />
          <mesh geometry={nodes.Cube008_2.geometry} material={materials['screen.001']} />
          {/* marker shares the Html transform so the camera can find the
              screen's world position + outward normal during the zoom */}
          <group ref={markerRef} rotation-x={-Math.PI / 2} position={[0, 0.05, -0.09]} />
          <Html rotation-x={-Math.PI / 2} position={[0, 0.05, -0.09]} transform occlude distanceFactor={5}>
            <ScreenContent />
          </Html>
        </group>
      </group>
      <mesh geometry={nodes.keyboard.geometry} material={materials.keys} position={[1.79, 0, 3.45]} />
      <group position={[0, -0.1, 3.39]}>
        <mesh geometry={nodes.Cube002.geometry} material={materials.aluminium} />
        <mesh geometry={nodes.Cube002_1.geometry} material={materials.trackpad} />
      </group>
      <mesh geometry={nodes.touchbar.geometry} material={materials.touchbar} position={[0, -0.03, 1.2]} />
    </group>
  )
}

useGLTF.preload(MODEL_URL, DRACO_PATH)

// Desktop reference framing: at aspect ~1.6 the laptop spans ~50% of the
// viewport width. On narrower (portrait) screens the camera pulls back so
// the laptop keeps that same relative width instead of overflowing.
const BASE_Z = 26
const FIT_FRACTION = 0.5
const ORIGIN = new THREE.Vector3(0, 0, 0)

function LaptopRig({ onReady }: { onReady?: () => void }) {
  const straighten = useRef<THREE.Group>(null)
  const spin = useRef<THREE.Group>(null)
  const jump = useRef<THREE.Group>(null)
  const flip = useRef<THREE.Group>(null)
  const modelRoot = useRef<THREE.Group>(null)
  const hinge = useRef<THREE.Group>(null)
  const marker = useRef<THREE.Group>(null)

  const [floor, setFloor] = useState<{ y: number; radius: number } | null>(null)
  const dims = useRef({ width: 13, jumpHeight: 10 })
  const tmp = useRef({
    look: new THREE.Vector3(),
    normal: new THREE.Vector3(),
    end: new THREE.Vector3(),
    lookAt: new THREE.Vector3(),
    dir0: new THREE.Vector3(),
    dir: new THREE.Vector3(),
    camBase: new THREE.Vector3(),
  })

  // Center the (closed) laptop on the rig origin so spin/flip tumble around
  // its middle, and measure it to scale the jump/zoom.
  useLayoutEffect(() => {
    const root = modelRoot.current
    if (!root) return
    root.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(root)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    root.position.sub(center)
    dims.current = { width: size.x, jumpHeight: size.x * 0.35 }
    setFloor({ y: -size.y / 2 - 0.02, radius: size.x * 1.2 })
  }, [])

  useFrame(({ camera, size }) => {
    if (!straighten.current || !spin.current || !jump.current || !flip.current) return
    const p = scrollProgress()

    // Lid opening — mirrors CSS book-open-top keyframes (0/5.5% closed,
    // 40% overshoot past vertical, 75%+ settled open).
    const tOpen = seg(p, 0.25, 0.55)
    let h = HINGE_CLOSED
    if (tOpen > 0.055 && tOpen <= 0.4) {
      h = lerp(HINGE_CLOSED, HINGE_OVERSHOOT, easeInOut((tOpen - 0.055) / 0.345))
    } else if (tOpen > 0.4 && tOpen <= 0.75) {
      h = lerp(HINGE_OVERSHOOT, HINGE_OPEN, easeInOut((tOpen - 0.4) / 0.35))
    } else if (tOpen > 0.75) {
      h = HINGE_OPEN
    }
    if (hinge.current) hinge.current.rotation.x = h

    // Spin: one full turn around the vertical axis (CSS book-spin).
    spin.current.rotation.y = -Math.PI * 2 * easeInOut(seg(p, 0.25, 0.55))

    // Flip: one full airborne tumble (CSS book-flip: hold, tumble, hold).
    const tFlip = seg(p, 0.25, 0.55)
    flip.current.rotation.x =
      tFlip <= 0.055 ? 0 : tFlip >= 0.8 ? Math.PI * 2 : Math.PI * 2 * easeInOut((tFlip - 0.055) / 0.745)

    // Jump: rise and land while tumbling (CSS book-jump 50% peak).
    const tJump = seg(p, 0.25, 0.55)
    jump.current.position.y =
      dims.current.jumpHeight * (tJump < 0.5 ? easeInOut(tJump * 2) : easeInOut(2 - tJump * 2))

    // Responsive framing: pull the camera back on narrow screens so the
    // laptop keeps FIT_FRACTION of the viewport width at any aspect ratio.
    const aspect = size.width / size.height
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    const fitZ = dims.current.width / (2 * FIT_FRACTION * tanHalf * aspect)
    const baseZ = Math.max(BASE_Z, fitZ)
    const k = baseZ / BASE_Z // scale screen-relative offsets with the pullback
    const { look, normal, end, lookAt, dir0, dir, camBase } = tmp.current
    camBase.set(0, 1.4 * k, baseZ)

    // Straighten: tilted showcase view -> head-on (CSS scale-to-view).
    // Starts offset low-right so the closed laptop sits under the headline.
    const tS = seg(p, 0.35, 0.65)
    straighten.current.rotation.x = lerp(TILT_X, 0, tS)
    straighten.current.rotation.y = lerp(TILT_Y, 0, tS)
    straighten.current.position.set(lerp(1.6 * k, 0, tS), lerp(-2.4 * k, 0, tS), lerp(-6, 0, tS))

    // Zoom: dolly the camera into the screen until it fills the viewport
    // (CSS scene-zoom scale(1 -> 25)).
    const tZoom = seg(p, 0.6, 0.9)
    if (tZoom <= 0 || !marker.current) {
      camera.position.copy(camBase)
      camera.lookAt(ORIGIN)
      return
    }
    marker.current.getWorldPosition(look)
    marker.current.getWorldDirection(normal)
    // final distance: the screen slightly overfills the viewport on its
    // tighter axis (width on landscape, height on portrait)
    const screenHeight = dims.current.width * (216 / 334) // display aspect
    const dByWidth = (dims.current.width / 1.55) / (2 * tanHalf * aspect)
    const dByHeight = (screenHeight / 1.25) / (2 * tanHalf)
    const dEnd = Math.max(1.5, Math.min(dByWidth, dByHeight))
    dir0.copy(camBase).sub(look)
    const d0 = dir0.length()
    dir0.normalize()
    dir.copy(dir0).lerp(normal, easeInOut(tZoom)).normalize()
    const dist = d0 * Math.pow(dEnd / d0, tZoom) // exponential = steady perceived zoom
    end.copy(look).addScaledVector(dir, dist)
    camera.position.copy(end)
    lookAt.copy(ORIGIN).lerp(look, clamp01(tZoom * 2))
    camera.lookAt(lookAt)
  })

  return (
    <group ref={straighten}>
      <group ref={spin}>
        <group ref={jump}>
          <group ref={flip}>
            <group ref={modelRoot}>
              <MacModel hingeRef={hinge} markerRef={marker} onReady={onReady} />
            </group>
          </group>
        </group>
        {floor && (
          <ContactShadows
            position={[0, floor.y, 0]}
            scale={floor.radius}
            far={dims.current.jumpHeight * 0.45}
            blur={2.4}
            opacity={0.4}
          />
        )}
      </group>
    </group>
  )
}

export default function Laptop3DScene() {
  const [ready, setReady] = useState(false)
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: FOV, position: [0, 1.4, 26], near: 0.1, far: 200 }}
      gl={{ antialias: true, alpha: true }}
      style={{
        position: 'absolute',
        inset: 0,
        opacity: ready ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      <StudioEnvironment />
      <Suspense fallback={null}>
        <ambientLight intensity={0.25} />
        <LaptopRig onReady={() => setReady(true)} />
      </Suspense>
    </Canvas>
  )
}
