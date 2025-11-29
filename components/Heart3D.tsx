import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, PerspectiveCamera } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import gsap from "gsap";
import { WaveSegment } from "../lib/ecgUtils";

interface Heart3DProps {
  beatTimes: number[];
  isPlaying?: boolean;
  cameraPosition?: { x: number; y: number; z: number };
  cameraTarget?: { x: number; y: number; z: number };
  onCameraUpdate?: (position: { x: number; y: number; z: number }) => void;
  onPartClick?: (partInfo: HeartPartInfo | null) => void;
  onShowAllLabels?: (labels: HeartLabel[]) => void;
  currentSegment?: WaveSegment;
  tutorialMode?: boolean;
}

export interface HeartLabel {
  partInfo: HeartPartInfo;
  position2D: { x: number; y: number };
  position3D: { x: number; y: number; z: number };
}

export interface HeartPartInfo {
  name: string;
  category: string;
  description: string;
  function: string;
  bloodType?: string;
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

// Heart part information database
function getHeartPartInfo(meshName: string, filename: string): HeartPartInfo {
  const lowerName = meshName.toLowerCase();
  const lowerFilename = filename.toLowerCase();

  // Extract file ID
  const fileIdMatch = filename.match(/FJ(\d+)/);
  const fileId = fileIdMatch ? parseInt(fileIdMatch[1]) : 0;

  // Coronary arteries
  if (fileId >= 2631 && fileId <= 2677) {
    return {
      name: `Coronary Artery (${filename})`,
      category: "Blood Vessel - Artery",
      description: "Coronary arteries supply oxygen-rich blood to the heart muscle (myocardium).",
      function: "Delivers oxygenated blood from the aorta to cardiac tissue",
      bloodType: "Oxygenated (arterial)"
    };
  }

  // Coronary veins
  if (fileId >= 2678 && fileId <= 2737) {
    return {
      name: `Coronary Vein (${filename})`,
      category: "Blood Vessel - Vein",
      description: "Coronary veins collect deoxygenated blood from the heart muscle and return it to the right atrium.",
      function: "Returns deoxygenated blood from cardiac tissue to the heart",
      bloodType: "Deoxygenated (venous)"
    };
  }

  // Right Atrium
  if (lowerName.includes('right') && lowerName.includes('atrium')) {
    return {
      name: "Right Atrium",
      category: "Chamber - Atrium",
      description: "The right atrium receives deoxygenated blood from the body via the superior and inferior vena cava.",
      function: "Receives deoxygenated blood from systemic circulation",
      bloodType: "Deoxygenated"
    };
  }

  // Left Atrium
  if (lowerName.includes('left') && lowerName.includes('atrium')) {
    return {
      name: "Left Atrium",
      category: "Chamber - Atrium",
      description: "The left atrium receives oxygen-rich blood from the lungs via the pulmonary veins.",
      function: "Receives oxygenated blood from pulmonary circulation",
      bloodType: "Oxygenated"
    };
  }

  // Right Ventricle
  if (lowerName.includes('right') && lowerName.includes('ventricle')) {
    return {
      name: "Right Ventricle",
      category: "Chamber - Ventricle",
      description: "The right ventricle pumps deoxygenated blood to the lungs through the pulmonary artery.",
      function: "Pumps blood to lungs for oxygenation",
      bloodType: "Deoxygenated"
    };
  }

  // Left Ventricle
  if (lowerName.includes('left') && lowerName.includes('ventricle')) {
    return {
      name: "Left Ventricle",
      category: "Chamber - Ventricle",
      description: "The left ventricle is the heart's main pumping chamber, sending oxygen-rich blood throughout the body.",
      function: "Pumps oxygenated blood to entire body (systemic circulation)",
      bloodType: "Oxygenated"
    };
  }

  // Valves
  if (lowerName.includes('tricuspid')) {
    return {
      name: "Tricuspid Valve",
      category: "Valve",
      description: "The tricuspid valve controls blood flow from the right atrium to the right ventricle.",
      function: "Prevents backflow from right ventricle to right atrium"
    };
  }

  if (lowerName.includes('mitral')) {
    return {
      name: "Mitral Valve (Bicuspid)",
      category: "Valve",
      description: "The mitral valve controls blood flow from the left atrium to the left ventricle.",
      function: "Prevents backflow from left ventricle to left atrium"
    };
  }

  if (lowerName.includes('pulmonary') && lowerName.includes('valve')) {
    return {
      name: "Pulmonary Valve",
      category: "Valve",
      description: "The pulmonary valve controls blood flow from the right ventricle to the pulmonary artery.",
      function: "Prevents backflow from pulmonary artery to right ventricle"
    };
  }

  if (lowerName.includes('aortic') && lowerName.includes('valve')) {
    return {
      name: "Aortic Valve",
      category: "Valve",
      description: "The aortic valve controls blood flow from the left ventricle to the aorta.",
      function: "Prevents backflow from aorta to left ventricle"
    };
  }

  // Septum
  if (lowerName.includes('septum')) {
    return {
      name: "Interventricular Septum",
      category: "Wall/Septum",
      description: "The septum is a muscular wall that separates the left and right sides of the heart.",
      function: "Prevents mixing of oxygenated and deoxygenated blood"
    };
  }

  // Myocardium
  if (lowerName.includes('myocardium') || lowerName.includes('wall')) {
    return {
      name: "Myocardium (Heart Muscle)",
      category: "Muscle Tissue",
      description: "The myocardium is the thick, muscular middle layer of the heart wall responsible for contraction.",
      function: "Contracts to pump blood through the circulatory system"
    };
  }

  // Default for unidentified parts
  return {
    name: `Heart Structure (${filename})`,
    category: "Cardiac Tissue",
    description: "This is part of the heart's complex anatomical structure.",
    function: "Contributes to cardiac function"
  };
}

// Heart model component with animation
function HeartModel({ beatTimes, isPlaying, onPartClick, onShowAllLabels, currentSegment, tutorialMode }: Heart3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Group>(null);
  const lastBeatTimeRef = useRef<number>(0);
  const animationRef = useRef<gsap.core.Timeline | null>(null);
  const [heartModel, setHeartModel] = useState<THREE.Group | null>(null);
  const isAnimatingRef = useRef(false);
  const [hoveredMesh, setHoveredMesh] = useState<THREE.Mesh | null>(null);
  const heartMeshesRef = useRef<THREE.Mesh[]>([]);
  const { camera, size } = useThree();

  // Categorized meshes for segment-based animations
  const atriaMeshesRef = useRef<THREE.Mesh[]>([]);
  const ventriclesMeshesRef = useRef<THREE.Mesh[]>([]);

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

              // Store part information in userData for click detection
              child.userData.partInfo = getHeartPartInfo(meshName, filename);
              child.userData.originalColor = functionalColor;

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

              // Store mesh reference for labeling
              heartMeshesRef.current.push(child);

              // Categorize meshes for segment-based animation
              const partInfo = child.userData.partInfo as HeartPartInfo;
              if (partInfo.category.includes("Atrium")) {
                atriaMeshesRef.current.push(child);
              } else if (partInfo.category.includes("Ventricle")) {
                ventriclesMeshesRef.current.push(child);
              }
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

  // Segment-based highlighting for tutorial mode
  useEffect(() => {
    if (!tutorialMode || !heartModel) return;

    // Reset all meshes to normal emissive intensity
    heartMeshesRef.current.forEach((mesh) => {
      const material = mesh.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.1;
    });

    // Highlight based on current segment
    let meshesToHighlight: THREE.Mesh[] = [];

    if (currentSegment === 'p') {
      // P-wave: Atria are contracting
      meshesToHighlight = atriaMeshesRef.current;
    } else if (currentSegment === 'qrs') {
      // QRS: Ventricles are contracting
      meshesToHighlight = ventriclesMeshesRef.current;
    } else if (currentSegment === 't') {
      // T-wave: Ventricles are relaxing (dim highlight)
      meshesToHighlight = ventriclesMeshesRef.current;
    }

    // Apply highlight
    meshesToHighlight.forEach((mesh) => {
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (currentSegment === 't') {
        // T-wave: gentler glow (relaxation)
        material.emissiveIntensity = 0.25;
      } else {
        // P-wave and QRS: stronger glow (contraction)
        material.emissiveIntensity = 0.5;
      }
    });
  }, [currentSegment, tutorialMode, heartModel]);

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

  // Handle hover effect
  useEffect(() => {
    if (!hoveredMesh) return;

    const material = hoveredMesh.material as THREE.MeshStandardMaterial;
    const originalEmissiveIntensity = 0.1;

    // Brighten on hover
    material.emissiveIntensity = 0.3;
    document.body.style.cursor = 'pointer';

    return () => {
      material.emissiveIntensity = originalEmissiveIntensity;
      document.body.style.cursor = 'default';
    };
  }, [hoveredMesh]);

  // Handle click - Show all labels
  const handleClick = (event: any) => {
    event.stopPropagation();

    // If onShowAllLabels is provided, show all labels
    if (onShowAllLabels) {
      const labels: HeartLabel[] = [];

      // Priority categories for labeling (show main structures only)
      const priorityCategories = new Map<string, THREE.Mesh>();

      heartMeshesRef.current.forEach((mesh) => {
        if (mesh.userData.partInfo) {
          const partInfo = mesh.userData.partInfo as HeartPartInfo;

          // Define key structures to label
          let categoryKey: string | null = null;

          if (partInfo.category.includes("Chamber")) {
            // For chambers, use specific chamber names
            if (partInfo.name.includes("Right Atrium")) categoryKey = "Right Atrium";
            else if (partInfo.name.includes("Left Atrium")) categoryKey = "Left Atrium";
            else if (partInfo.name.includes("Right Ventricle")) categoryKey = "Right Ventricle";
            else if (partInfo.name.includes("Left Ventricle")) categoryKey = "Left Ventricle";
          } else if (partInfo.category.includes("Blood Vessel")) {
            // Group blood vessels by type
            if (partInfo.name.includes("Coronary Artery")) categoryKey = "Coronary Arteries";
            else if (partInfo.name.includes("Coronary Vein")) categoryKey = "Coronary Veins";
          }

          // Only add if it's a priority category and not already added
          if (categoryKey && !priorityCategories.has(categoryKey)) {
            priorityCategories.set(categoryKey, mesh);
          }
        }
      });

      // Calculate 2D positions for each labeled structure
      priorityCategories.forEach((mesh, categoryKey) => {
        const partInfo = mesh.userData.partInfo as HeartPartInfo;

        // Get the mesh's world position (use center of geometry)
        mesh.geometry.computeBoundingBox();
        const boundingBox = mesh.geometry.boundingBox;

        if (boundingBox) {
          const center = new THREE.Vector3();
          boundingBox.getCenter(center);

          // Transform to world coordinates
          mesh.localToWorld(center);

          // Project to screen space
          const vector = center.clone();
          vector.project(camera);

          // Check if point is in front of camera (not behind)
          if (vector.z < 1) {
            // Convert to pixel coordinates
            const x = (vector.x * 0.5 + 0.5) * size.width;
            const y = (vector.y * -0.5 + 0.5) * size.height;

            // Only add if within reasonable screen bounds
            if (x >= 0 && x <= size.width && y >= 0 && y <= size.height) {
              labels.push({
                partInfo: {
                  ...partInfo,
                  name: categoryKey // Use simplified category name
                },
                position2D: { x, y },
                position3D: { x: center.x, y: center.y, z: center.z }
              });
            }
          }
        }
      });

      onShowAllLabels(labels);
    } else if (onPartClick) {
      // Fallback to old behavior
      const intersect = event.intersections[0];
      if (intersect && intersect.object.userData.partInfo) {
        onPartClick(intersect.object.userData.partInfo);
      }
    }
  };

  // Handle pointer move for hover effect
  const handlePointerMove = (event: any) => {
    const intersect = event.intersections[0];

    if (intersect && intersect.object.isMesh) {
      setHoveredMesh(intersect.object);
    } else {
      setHoveredMesh(null);
    }
  };

  // Handle pointer leave
  const handlePointerLeave = () => {
    setHoveredMesh(null);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, []);

  if (!heartModel) {
    return null; // No loading sphere, just wait for the model
  }

  return (
    <group ref={groupRef}>
      <group
        ref={meshRef}
        onClick={handleClick}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <primitive object={heartModel} />
      </group>
    </group>
  );
}

// Loading placeholder - Simple and minimal
function LoadingPlaceholder() {
  return null; // No visual placeholder, just let it load
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
function Scene({ beatTimes, isPlaying, cameraPosition, cameraTarget, onCameraUpdate, onPartClick, onShowAllLabels, currentSegment, tutorialMode }: Heart3DProps) {
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
        <HeartModel
          beatTimes={beatTimes}
          isPlaying={isPlaying}
          onPartClick={onPartClick}
          onShowAllLabels={onShowAllLabels}
          currentSegment={currentSegment}
          tutorialMode={tutorialMode}
        />
      </Suspense>
    </>
  );
}

// Main component export
export default function Heart3D({ beatTimes, isPlaying = false, cameraPosition, cameraTarget, onCameraUpdate, onPartClick, onShowAllLabels, currentSegment, tutorialMode }: Heart3DProps) {
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
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 200, 600]} />
        <Scene
          beatTimes={beatTimes}
          isPlaying={isPlaying}
          cameraPosition={cameraPosition}
          cameraTarget={cameraTarget}
          onCameraUpdate={onCameraUpdate}
          onPartClick={onPartClick}
          onShowAllLabels={onShowAllLabels}
          currentSegment={currentSegment}
          tutorialMode={tutorialMode}
        />
      </Canvas>
    </div>
  );
}
