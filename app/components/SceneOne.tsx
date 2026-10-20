"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Stats } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

function FPSLimiter() {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    let frameId: number;
    let lastFrame = 0;
    const interval = 1000 / 24;

    function animate(time: number) {
      frameId = requestAnimationFrame(animate);

      if (time - lastFrame >= interval) {
        lastFrame = time - ((time - lastFrame) % interval);
        invalidate();
      }
    }

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [invalidate]);

  return null;
}

function Geo() {
  const { scene } = useGLTF("/MainLongo.glb");

  // runs once instead of on every render
  useMemo(() => {
    const material = new THREE.MeshPhysicalMaterial({
      color: "#0a0909",
      metalness: 0,
      roughness: 0.05,
      transmission: 1,
      thickness: 0.5,
      ior: 1.5,
      transparent: false,
      opacity: 1,
      side: THREE.DoubleSide,
    });

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });
  }, [scene]);

  return <primitive object={scene} />;
}

useGLTF.preload("/MainLongo.glb");

export default function Page() {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <Canvas frameloop="demand" camera={{ position: [0, 0, 2], fov: 75 }}>
        <FPSLimiter />
        <Stats /> {/* remove when done testing */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 5, 5]} intensity={2} />
        <pointLight position={[-3, 2, 2]} intensity={30} color="#4488ff" />
        <pointLight position={[3, 1, -2]} intensity={40} color="#ffffff" />
        <pointLight position={[0, 3, -4]} intensity={50} color="#88ccff" />
        <Geo />
        <OrbitControls />
      </Canvas>
    </div>
  );
}
