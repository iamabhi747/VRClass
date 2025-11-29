import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, MeshTransmissionMaterial, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';

// --- 1. THE 3D GLASS SHARD COMPONENT ---
const Shard = ({ position, rotation, title, color }) => {
  const mesh = useRef();
  const [hovered, setHover] = useState(false);

  useFrame((state, delta) => {
    if (mesh.current) {
      // Idle Rotation
      mesh.current.rotation.x += delta * 0.2;
      mesh.current.rotation.y += delta * 0.15;
      
      // Hover Effect: Scale up slightly
      const targetScale = hovered ? 1.2 : 1;
      mesh.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2} floatingRange={[-0.2, 0.2]}>
      <group position={position} rotation={rotation}>
        {/* The Glass Geometry */}
        <mesh 
          ref={mesh}
          onPointerOver={() => setHover(true)}
          onPointerOut={() => setHover(false)}
        >
          {/* A Dodecahedron looks techy/crystal-like */}
          <dodecahedronGeometry args={[0.8, 0]} />
          
          {/* High-End Glass Material */}
          <MeshTransmissionMaterial 
            backside
            samples={4}
            thickness={0.5}
            chromaticAberration={0.5}
            anisotropy={0.3}
            distortion={0.3}
            distortionScale={0.5}
            temporalDistortion={0.1}
            iridescence={1}
            iridescenceIOR={1}
            iridescenceThicknessRange={[0, 1400]}
            roughness={0.1}
            clearcoat={1}
            color={hovered ? color : "#ffffff"}
          />
        </mesh>
        
        {/* Floating Text Label */}
        <Text
          position={[0, -1.2, 0]}
          fontSize={0.15}
          color="white"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.ttf"
        >
          {title.toUpperCase()}
        </Text>
      </group>
    </Float>
  );
};

// --- 2. THE 3D SCENE CONTAINER ---
const Scene = () => {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color="violet" />
      <pointLight position={[-10, -10, -10]} intensity={1} color="cyan" />

      {/* Environment Reflection for Glass */}
      <Environment preset="city" />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* --- FEATURE SHARDS --- */}
      {/* Positioned in a semi-circle or random cluster */}
      
      {/* Core Features */}
      <Shard position={[-2.5, 1, 0]} title="Avatar Engine" color="#8b5cf6" />
      <Shard position={[-1, 2, -1]} title="Spatial Campus" color="#3b82f6" />
      <Shard position={[1, 2, -1]} title="Interactive Assets" color="#10b981" />
      <Shard position={[2.5, 1, 0]} title="Live Protocol" color="#ef4444" />

      {/* Secondary Features */}
      <Shard position={[-2, -1.5, 0.5]} title="Study Sync" color="#ec4899" />
      <Shard position={[0, -2, 1]} title="Cross Platform" color="#6366f1" />
      <Shard position={[2, -1.5, 0.5]} title="Admin Command" color="#f97316" />

    </>
  );
};

// --- 3. MAIN COMPONENT TO EXPORT ---
const ThreeDFeatureSection = () => {
  return (
    <section className="relative h-[100vh] w-full bg-black">
      
      {/* Title Overlay */}
      <div className="absolute top-10 left-0 w-full text-center z-10 pointer-events-none">
        <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tighter">
          SYSTEM <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-cyan-500">ARCHETYPES</span>
        </h2>
        <p className="text-zinc-500 mt-2">Explore the core modules in 3D space.</p>
      </div>

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <Scene />
      </Canvas>

    </section>
  );
};

export default ThreeDFeatureSection;