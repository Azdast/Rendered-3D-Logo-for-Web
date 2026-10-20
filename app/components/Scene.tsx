"use client";

import { useMemo, useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  MeshTransmissionMaterial,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";

const DEPTH = 1.6; // baked into geometry, so normals stay correct
const START_X = 0.2;
const START_Y = -0.55;
const SPIN_SPEED = 0.25; // radians per second, lower = slower
const MOBILE_BREAKPOINT = 768;

function makeCanvasTexture(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// what the camera sees behind the logo: clean dark wall
function useWallTexture() {
  return useMemo(
    () =>
      makeCanvasTexture(512, 512, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, "#020202");
        g.addColorStop(0.55, "#000000");
        g.addColorStop(1, "#080808");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }),
    [],
  );
}

// what ONLY the glass sees (refraction buffer). the camera never sees this
function useStripesTexture() {
  return useMemo(
    () =>
      makeCanvasTexture(1024, 1024, (ctx, w, h) => {
        ctx.fillStyle = "#eef3ff";
        ctx.fillRect(0, 0, w, h);

        // offsets are fractions of width from the center
        const stripes = [
          { x: -0.46, w: 0.02, c: "#0b1020" },
          { x: -0.34, w: 0.06, c: "#3b5bff" },
          { x: -0.2, w: 0.012, c: "#ffffff" },
          { x: -0.1, w: 0.035, c: "#0b1020" },
          { x: 0.02, w: 0.015, c: "#ffffff" },
          { x: 0.12, w: 0.07, c: "#8fa8ff" },
          { x: 0.26, w: 0.012, c: "#0b1020" },
          { x: 0.36, w: 0.04, c: "#3b5bff" },
          { x: 0.46, w: 0.02, c: "#ffffff" },
        ];

        ctx.translate(w / 2, h / 2);
        ctx.rotate(0.35);
        for (const s of stripes) {
          ctx.fillStyle = s.c;
          ctx.fillRect(s.x * w, -h * 1.5, s.w * w, h * 3);
        }
      }),
    [],
  );
}

function SoftShadow() {
  const size = useThree((s) => s.size);
  const isMobile = size.width < MOBILE_BREAKPOINT;

  const tex = useMemo(
    () =>
      makeCanvasTexture(512, 512, (ctx, w, h) => {
        const g = ctx.createRadialGradient(
          w / 2,
          h / 2,
          0,
          w / 2,
          h / 2,
          w / 2,
        );
        g.addColorStop(0, "rgba(120,150,235,0.55)");
        g.addColorStop(0.5, "rgba(140,165,240,0.25)");
        g.addColorStop(1, "rgba(160,185,250,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }),
    [],
  );

  return (
    <mesh position={[isMobile ? 0.3 : 1.1, -1.0, -2.9]}>
      <planeGeometry args={[6.5, 5]} />
      <meshBasicMaterial
        map={tex}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function GlassLogo() {
  const { scene } = useGLTF("/MainLongo.glb");
  const group = useRef<THREE.Group>(null);
  const stripes = useStripesTexture();
  const spin = useRef(START_Y); // running spin angle

  const size = useThree((s) => s.size);
  const isMobile = size.width < MOBILE_BREAKPOINT;
  // shrink the logo on narrow screens so it fits
  const fit = THREE.MathUtils.clamp(size.width / size.height / 1.4, 0.45, 1);

  // bake world matrix + depth into cloned geometry (correct normals)
  const geos = useMemo(() => {
    const out: THREE.BufferGeometry[] = [];
    scene.updateMatrixWorld(true);
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        const g = m.geometry.clone();
        g.applyMatrix4(m.matrixWorld);
        g.scale(1, 1, DEPTH);
        out.push(g);
      }
    });
    return out;
  }, [scene]);

  useFrame(({ pointer }, delta) => {
    if (!group.current) return;
    const g = group.current;

    spin.current += delta * SPIN_SPEED;

    g.rotation.y = THREE.MathUtils.lerp(
      g.rotation.y,
      spin.current + pointer.x * 0.15,
      0.05,
    );
    g.rotation.x = THREE.MathUtils.lerp(
      g.rotation.x,
      START_X - pointer.y * 0.1,
      0.05,
    );
  });

  return (
    <group
      ref={group}
      rotation={[START_X, START_Y, 0]}
      position={[0, isMobile ? 0.35 : 0, 0]}
      scale={1.2 * fit}
    >
      {geos.map((geo, i) => (
        <mesh key={i} geometry={geo}>
          <MeshTransmissionMaterial
            background={stripes}
            backside={!isMobile}
            backsideThickness={0.6}
            samples={isMobile ? 3 : 6}
            resolution={isMobile ? 512 : undefined}
            thickness={1.5}
            roughness={0}
            ior={1.5}
            chromaticAberration={0.06}
            anisotropicBlur={0}
            distortion={0.25}
            distortionScale={0.3}
            temporalDistortion={0}
            color="#ffffff"
            attenuationColor="#b8caff"
            attenuationDistance={5}
            clearcoat={1}
            clearcoatRoughness={0}
            envMapIntensity={2.5}
          />
        </mesh>
      ))}
    </group>
  );
}

function SceneContents() {
  const wall = useWallTexture();
  return (
    <>
      {/* camera sees this; the glass overrides it with its own stripes */}
      <primitive object={wall} attach="background" />

      <Environment resolution={256}>
        <color attach="background" args={["#0b1020"]} />
        <Lightformer
          form="rect"
          intensity={8}
          position={[0, 5, 3]}
          scale={[12, 0.5, 1]}
        />
        <Lightformer
          form="rect"
          intensity={6}
          position={[-5, 1, 2]}
          scale={[0.6, 10, 1]}
        />
        <Lightformer
          form="rect"
          intensity={6}
          position={[5, 0, 2]}
          scale={[0.3, 10, 1]}
        />
        <Lightformer
          form="rect"
          intensity={3}
          position={[0, -4, 2]}
          scale={[10, 0.4, 1]}
          color="#9db8ff"
        />
      </Environment>

      <Suspense fallback={null}>
        <SoftShadow />
        <GlassLogo />
      </Suspense>
    </>
  );
}

export default function Scene() {
  return (
    <div className="scene-background">
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 40 }}
        dpr={[1, 1.25]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <SceneContents />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/MainLongo.glb");
useGLTF.preload("/Logo.glb");
