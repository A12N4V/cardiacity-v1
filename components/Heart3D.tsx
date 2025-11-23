import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, PerspectiveCamera } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import gsap from "gsap";

interface Heart3DProps {
  beatTimes: number[];
  isPlaying?: boolean;
  cameraPosition?: { x: number; y: number; z: number };
  cameraTarget?: { x: number; y: number; z: number };
  onCameraUpdate?: (position: { x: number; y: number; z: number }) => void;
}

// Functional color coding for heart parts
const HEART_COLORS = {
  // Atrial parts - Blue (deoxygenated blood reception)
  'right_atrium': 0x6699FF,
  'left_atrium': 0xFF6666,
  'atrium': 0x8888FF,

  // Ventricular parts - Red (pumping chambers)
  'right_ventricle': 0x9966FF,
  'left_ventricle': 0xFF3333,
  'ventricle': 0xFF5555,

  // Valves - Yellow (regulation)
  'valve': 0xFFDD44,
  'tricuspid': 0xFFDD44,
  'mitral': 0xFFDD44,
  'pulmonary': 0xFFDD44,
  'aortic': 0xFFDD44,

  // Walls and septa - Pink
  'wall': 0xFFAAAA,
  'septum': 0xFF8888,
  'myocardium': 0xFF6688,

  // Arteries - Bright Red (oxygenated blood)
  'artery': 0xFF0000,
  'coronary': 0xFF0000,
  'arterial': 0xFF0000,

  // Veins - Dark Blue (deoxygenated blood)
  'vein': 0x0000CD,
  'venous': 0x0000CD,
  'cardiac vein': 0x1E90FF,
  'coronary sinus': 0x4169E1,

  // Default heart tissue
  'default': 0xFF4466
};

function getHeartPartColor(meshName: string, filename: string): number {
  const lowerName = meshName.toLowerCase();
  const lowerFilename = filename.toLowerCase();

  // Extract file ID number for range-based color coding
  const fileIdMatch = filename.match(/FJ(\d+)/);
  const fileId = fileIdMatch ? parseInt(fileIdMatch[1]) : 0;

  // Color based on file ID ranges
  if (fileId >= 2631 && fileId <= 2677) {
    // Coronary arteries - Bright Red
    return 0xFF0000;
  } else if (fileId >= 2678 && fileId <= 2737) {
    // Coronary veins - Dark Blue
    return 0x0000CD;
  }

  // Check name-based keywords
  for (const [key, color] of Object.entries(HEART_COLORS)) {
    if (lowerName.includes(key) || lowerFilename.includes(key)) {
      return color;
    }
  }

  return HEART_COLORS.default;
}

// Electrical impulse field component
function ElectricalImpulse({ isPlaying, beatTimes }: { isPlaying: boolean; beatTimes: number[] }) {
  const impulseRef = useRef<THREE.Mesh>(null);
  const lastBeatTimeRef = useRef<number>(0);
  const animationRef = useRef<gsap.core.Timeline | null>(null);

  // Create impulse field geometry (from atria to ventricles)
  const impulseGeometry = new THREE.SphereGeometry(30, 32, 32);

  useEffect(() => {
    if (impulseRef.current) {
      // Start invisible
      impulseRef.current.scale.set(0.1, 0.1, 0.1);
      (impulseRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
    }
  }, []);

  const triggerImpulse = () => {
    if (!impulseRef.current) return;

    // Cancel any existing animation
    if (animationRef.current) {
      animationRef.current.kill();
    }

    const material = impulseRef.current.material as THREE.MeshBasicMaterial;
    const mesh = impulseRef.current;

    // Reset - Start RED at atria
    mesh.scale.set(0.3, 0.3, 0.3);
    mesh.position.set(0, 20, 0); // Start at atria (top)
    material.opacity = 0.8;
    material.color.setHex(0xFF0000); // Start RED

    // Create impulse wave animation
    const timeline = gsap.timeline();

    // Wave 1: Atrial depolarization (RED)
    timeline.to(mesh.scale, {
      x: 0.6,
      y: 0.6,
      z: 0.6,
      duration: 0.1,
      ease: "power2.out"
    });

    timeline.to(material, {
      opacity: 0.7,
      duration: 0.1
    }, "<");

    // Wave 2: Travel through AV node - Transition RED to DARK BLUE
    timeline.to(mesh.position, {
      y: 0,
      duration: 0.15,
      ease: "power1.inOut"
    });

    timeline.to(material.color, {
      r: 0.0,  // Red channel: 1.0 → 0.0
      g: 0.0,  // Green channel: 0.0 → 0.0
      b: 0.8,  // Blue channel: 0.0 → 0.8 (Dark Blue)
      duration: 0.15
    }, "<");

    // Wave 3: Ventricular depolarization (DARK BLUE)
    timeline.to(mesh.scale, {
      x: 1.2,
      y: 1.2,
      z: 1.2,
      duration: 0.2,
      ease: "power2.out"
    });

    timeline.to(mesh.position, {
      y: -15,
      duration: 0.2,
      ease: "power2.out"
    }, "<");

    // Continue darkening to deep blue
    timeline.to(material.color, {
      b: 0.5,  // Darken blue further
      duration: 0.2
    }, "<");

    // Wave 4: Fade out
    timeline.to(material, {
      opacity: 0,
      duration: 0.15,
      ease: "power1.in"
    });

    timeline.to(mesh.scale, {
      x: 0.1,
      y: 0.1,
      z: 0.1,
      duration: 0.15
    }, "<");

    animationRef.current = timeline;
  };

  // Monitor beat times and trigger impulse
  useFrame(() => {
    if (!isPlaying || beatTimes.length === 0) return;

    const currentTime = Date.now();
    const nextBeat = beatTimes.find(time => time > lastBeatTimeRef.current && time <= currentTime + 50);

    if (nextBeat && nextBeat !== lastBeatTimeRef.current) {
      lastBeatTimeRef.current = nextBeat;
      triggerImpulse();
    }
  });

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, []);

  return (
    <mesh ref={impulseRef} geometry={impulseGeometry}>
      <meshBasicMaterial
        color={0xFF0000}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Heart model component with animation
function HeartModel({ beatTimes, isPlaying }: Heart3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Group>(null);
  const lastBeatTimeRef = useRef<number>(0);
  const animationRef = useRef<gsap.core.Timeline | null>(null);
  const [heartModel, setHeartModel] = useState<THREE.Group | null>(null);
  const isAnimatingRef = useRef(false);

  // Load all heart OBJ models
  useEffect(() => {
    console.log("🚀 Starting heart model loading...");
    const loader = new OBJLoader();
    const heartGroup = new THREE.Group();

    // Generate all heart-related file IDs
    const heartFiles: string[] = [];

    // Heart chambers and valves (FJ2417-FJ2439)
    for (let i = 2417; i <= 2439; i++) {
      heartFiles.push(`FJ${i}.obj`);
    }

    // Coronary arteries (FJ2631-FJ2677, with gaps)
    for (let i = 2631; i <= 2677; i++) {
      if (i !== 2666 && i !== 2669) { // Skip missing files
        heartFiles.push(`FJ${i}.obj`);
      }
    }

    // Coronary veins (FJ2678-FJ2737, with gaps)
    for (let i = 2678; i <= 2737; i++) {
      if (i !== 2726) { // Skip missing file
        heartFiles.push(`FJ${i}.obj`);
      }
    }

    console.log(`📦 Will attempt to load ${heartFiles.length} heart OBJ files (chambers, valves, arteries, veins)`);

    let loadedCount = 0;

    heartFiles.forEach((filename, index) => {
      const path = `/cardiacity-models/${filename}`;
      console.log(`⏳ [${index + 1}/${heartFiles.length}] Loading ${path}...`);

      loader.load(
        path,
        (obj) => {
          console.log(`✅ [${index + 1}/${heartFiles.length}] Loaded: ${filename}`);

          // Apply functional color coding to meshes
          let meshCount = 0;
          obj.traverse((child: any) => {
            if (child.isMesh) {
              meshCount++;
              const meshName = child.name || filename;
              const functionalColor = getHeartPartColor(meshName, filename);

              console.log(`   - Mesh: ${meshName} → Color: #${functionalColor.toString(16)}`);

              // Functionally color-coded material
              child.material = new THREE.MeshStandardMaterial({
                color: functionalColor,
                roughness: 0.3,
                metalness: 0.2,
                side: THREE.DoubleSide,
                emissive: functionalColor,
                emissiveIntensity: 0.1,
              });

              // Enable shadows
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          console.log(`   - Total meshes in ${filename}: ${meshCount}`);

          heartGroup.add(obj);
          loadedCount++;
          console.log(`📊 Progress: ${loadedCount}/${heartFiles.length} files loaded`);

          // When all parts are loaded
          if (loadedCount === heartFiles.length) {
            console.log(`✅ All ${loadedCount} heart parts loaded successfully!`);

            // Get bounding box
            const box = new THREE.Box3().setFromObject(heartGroup);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);

            console.log(`📐 Heart model dimensions:`, {
              center: { x: center.x.toFixed(2), y: center.y.toFixed(2), z: center.z.toFixed(2) },
              size: { x: size.x.toFixed(2), y: size.y.toFixed(2), z: size.z.toFixed(2) },
              maxDim: maxDim.toFixed(2)
            });

            // Center at origin
            heartGroup.position.set(-center.x, -center.y, -center.z);
            console.log(`🎯 Heart centered at origin`);

            setHeartModel(heartGroup);
          }
        },
        (xhr) => {
          const percentComplete = (xhr.loaded / xhr.total) * 100;
          console.log(`   - ${filename}: ${percentComplete.toFixed(1)}% loaded`);
        },
        (error: any) => {
          console.error(`❌ Error loading ${filename}:`, error);
        }
      );
    });
  }, []);

  // Heartbeat animation function
  const triggerHeartbeat = () => {
    if (!meshRef.current || isAnimatingRef.current) return;

    isAnimatingRef.current = true;

    if (animationRef.current) {
      animationRef.current.kill();
    }

    const timeline = gsap.timeline({
      onComplete: () => {
        isAnimatingRef.current = false;
      }
    });

    // Systole (contraction)
    timeline.to(meshRef.current.scale, {
      x: 0.85,
      y: 0.85,
      z: 0.85,
      duration: 0.15,
      ease: "power2.in",
    });

    // Early diastole (expansion)
    timeline.to(meshRef.current.scale, {
      x: 1.05,
      y: 1.05,
      z: 1.05,
      duration: 0.2,
      ease: "power2.out",
    });

    // Late diastole (settling)
    timeline.to(meshRef.current.scale, {
      x: 1.0,
      y: 1.0,
      z: 1.0,
      duration: 0.15,
      ease: "power1.inOut",
    });

    animationRef.current = timeline;
  };

  // Monitor beat times
  useFrame(() => {
    if (!isPlaying || beatTimes.length === 0) return;

    const currentTime = Date.now();
    const nextBeat = beatTimes.find(time => time > lastBeatTimeRef.current && time <= currentTime + 50);

    if (nextBeat && nextBeat !== lastBeatTimeRef.current) {
      lastBeatTimeRef.current = nextBeat;
      triggerHeartbeat();
    }
  });

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, []);

  if (!heartModel) {
    return (
      <mesh>
        <sphereGeometry args={[20, 32, 32]} />
        <meshStandardMaterial color="#FF3333" wireframe />
      </mesh>
    );
  }

  return (
    <group ref={groupRef}>
      <group ref={meshRef}>
        <primitive object={heartModel} />
      </group>
      {/* Electrical impulse field */}
      <ElectricalImpulse isPlaying={isPlaying || false} beatTimes={beatTimes} />
    </group>
  );
}

// Loading placeholder
function LoadingPlaceholder() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[20, 32, 32]} />
      <meshStandardMaterial color="#FF3333" wireframe />
    </mesh>
  );
}

// Camera position tracker
function CameraTracker({ onCameraUpdate }: { onCameraUpdate?: (pos: { x: number; y: number; z: number }) => void }) {
  useFrame(({ camera }) => {
    if (onCameraUpdate) {
      onCameraUpdate({
        x: parseFloat(camera.position.x.toFixed(2)),
        y: parseFloat(camera.position.y.toFixed(2)),
        z: parseFloat(camera.position.z.toFixed(2))
      });
    }
  });

  return null;
}

// Main 3D scene
function Scene({ beatTimes, isPlaying, cameraPosition, cameraTarget, onCameraUpdate }: Heart3DProps) {
  const camPos = cameraPosition || { x: 0, y: 0, z: 300 };
  const camTarget = cameraTarget || { x: 0, y: 0, z: 0 };

  return (
    <>
      {/* Camera */}
      <PerspectiveCamera
        makeDefault
        position={[camPos.x, camPos.y, camPos.z]}
        fov={50}
      />

      {/* Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={1}
        panSpeed={0.8}
        minDistance={50}
        maxDistance={600}
        target={[camTarget.x, camTarget.y, camTarget.z]}
      />

      {/* Camera Position Tracker */}
      <CameraTracker onCameraUpdate={onCameraUpdate} />

      {/* Lighting - Brightened for better visibility */}
      <ambientLight intensity={1.2} />
      <directionalLight
        position={[100, 100, 100]}
        intensity={2.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-100, 50, -100]} intensity={1.5} />
      <directionalLight position={[0, -50, 100]} intensity={1.0} />
      <pointLight position={[0, 100, 0]} intensity={1.0} color="#ff0000" />
      <hemisphereLight intensity={0.8} color="#ffffff" groundColor="#444444" />

      {/* Environment */}
      <Environment preset="city" />

      {/* Heart Model */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <HeartModel beatTimes={beatTimes} isPlaying={isPlaying} />
      </Suspense>
    </>
  );
}

// Main component export
export default function Heart3D({ beatTimes, isPlaying = false, cameraPosition, cameraTarget, onCameraUpdate }: Heart3DProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#1a1a1a"]} />
        <fog attach="fog" args={["#1a1a1a", 200, 600]} />
        <Scene
          beatTimes={beatTimes}
          isPlaying={isPlaying}
          cameraPosition={cameraPosition}
          cameraTarget={cameraTarget}
          onCameraUpdate={onCameraUpdate}
        />
      </Canvas>
    </div>
  );
}
