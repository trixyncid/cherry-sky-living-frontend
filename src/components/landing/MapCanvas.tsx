/**
 * The location map: a modelled neighbourhood at blue hour with a pin on each
 * kost. The model, its baked light and the ground come from
 * `scripts/build-map` (Blender); nothing is lit at runtime, so the page only
 * draws textures. Streets are an illustration, not a survey — the two kost
 * buildings sit where the model puts them, and landmarks are placed relative
 * to them when the admin has coordinates for everything.
 */

"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import {
  Component,
  type ReactNode,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export interface MapProperty {
  key: string;
  name: string;
  color: string;
  geo?: { lat: number; lng: number };
}

export interface MapLandmark {
  name: string;
  lat: number;
  lng: number;
}

const BASE = "/media/map";
/** Light maps are stored at half strength to keep headroom (see build_map.py). */
const LIGHT_MAP_INTENSITY = Math.PI / 0.5;
/** Must match the poster camera in build_map.py. */
const CAMERA = { position: [0, 6.6, 8] as const, target: [0, 0, 0.3] as const };
const FADE = { from: 5.6, to: 7.4 };

/** Fades a material out toward the rim of the model so the map has no edge. */
function fadeAtRim(material: THREE.Material) {
  material.transparent = true;
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vRimXZ;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvRimXZ = (modelMatrix * vec4(position, 1.0)).xz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vRimXZ;")
      .replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>\ngl_FragColor.a *= 1.0 - smoothstep(${FADE.from.toFixed(1)}, ${FADE.to.toFixed(1)}, length(vRimXZ));`,
      );
  };
}

function partOf(object: THREE.Object3D): "ground" | "city" | "heroes" | null {
  for (let o: THREE.Object3D | null = object; o; o = o.parent) {
    if (o.name.startsWith("ground")) return "ground";
    if (o.name.startsWith("city")) return "city";
    if (o.name.startsWith("heroes")) return "heroes";
  }
  return null;
}

function labelTexture(text: string, color: string, small: boolean) {
  const scale = 2;
  const font = `${small ? 500 : 600} ${small ? 26 : 30}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.font = font;
  const padX = small ? 18 : 22;
  const dot = small ? 0 : 30;
  const w = Math.ceil(ctx.measureText(text).width) + padX * 2 + dot;
  const h = small ? 46 : 56;
  canvas.width = w * scale;
  canvas.height = h * scale;
  ctx.scale(scale, scale);
  ctx.font = font;
  ctx.fillStyle = "rgba(12, 12, 16, 0.78)";
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, h / 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(0.75, 0.75, w - 1.5, h - 1.5, h / 2);
  ctx.stroke();
  if (dot) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(padX + 8, h / 2, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = small ? "rgba(255, 255, 255, 0.86)" : "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(text, padX + dot, h / 2 + 1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { texture, aspect: w / h };
}

function Label({
  text,
  color,
  y,
  small = false,
}: {
  text: string;
  color: string;
  y: number;
  small?: boolean;
}) {
  const label = useMemo(
    () => labelTexture(text, color, small),
    [text, color, small],
  );
  useEffect(() => () => label?.texture.dispose(), [label]);
  if (!label) return null;
  const h = small ? 0.3 : 0.4;
  return (
    <sprite position-y={y} scale={[h * label.aspect, h, 1]} renderOrder={12}>
      <spriteMaterial
        map={label.texture}
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  );
}

/** A soft vertical shaft of light, brightest at its foot. */
function Beam({
  color,
  height,
  radius,
}: {
  color: string;
  height: number;
  radius: number;
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uColor: { value: new THREE.Color(color) } },
        vertexShader:
          "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader:
          "uniform vec3 uColor; varying vec2 vUv; void main(){ float a = pow(1.0 - vUv.y, 1.6) * 0.55; gl_FragColor = vec4(uColor * a, a); }",
      }),
    [color],
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh position-y={height / 2} material={material} renderOrder={10}>
      <cylinderGeometry args={[radius * 0.5, radius, height, 20, 1, true]} />
    </mesh>
  );
}

function PropertyPin({
  position,
  color,
  name,
  index,
}: {
  position: THREE.Vector3;
  color: string;
  name: string;
  index: number;
}) {
  const head = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime + index * 0.9;
    if (head.current) head.current.position.y = 0.62 + Math.sin(t * 1.6) * 0.04;
    if (ring.current) {
      const k = (t * 0.45) % 1;
      ring.current.scale.setScalar(0.5 + k * 1.6);
      (ring.current.material as THREE.MeshBasicMaterial).opacity =
        (1 - k) * 0.75;
    }
  });
  return (
    <group position={position}>
      <mesh
        ref={ring}
        rotation-x={-Math.PI / 2}
        position-y={0.03}
        renderOrder={9}
      >
        <ringGeometry args={[0.3, 0.36, 48]} />
        <meshBasicMaterial
          color={color}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <Beam color={color} height={1.5} radius={0.16} />
      <group ref={head} renderOrder={11}>
        <mesh position-y={0.16}>
          <sphereGeometry args={[0.17, 32, 24]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        <mesh position-y={0.16}>
          <sphereGeometry args={[0.07, 20, 16]} />
          <meshBasicMaterial
            color="#ffffff"
            toneMapped={false}
            depthTest={false}
          />
        </mesh>
        <mesh position-y={-0.13} rotation-x={Math.PI}>
          <coneGeometry args={[0.11, 0.36, 28]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      </group>
      <Label text={name} color={color} y={1.32} />
    </group>
  );
}

function LandmarkPin({ x, z, name }: { x: number; z: number; name: string }) {
  return (
    <group position={[x, 0, z]}>
      <Beam color="#f3e7d2" height={1.9} radius={0.07} />
      <mesh position-y={1.9} renderOrder={11}>
        <sphereGeometry args={[0.07, 16, 12]} />
        <meshBasicMaterial color="#f3e7d2" toneMapped={false} />
      </mesh>
      <Label text={name} color="#f3e7d2" y={2.2} small />
    </group>
  );
}

/**
 * Places landmarks around the two modelled buildings: the pair of real
 * coordinates is mapped onto the pair of model positions (scale + rotation),
 * and everything else follows. Far-away landmarks are pulled in to the rim.
 */
function placeLandmarks(
  properties: MapProperty[],
  anchors: (THREE.Vector3 | undefined)[],
  landmarks: MapLandmark[],
) {
  const [a, b] = properties;
  const [A, B] = anchors;
  if (!a?.geo || !b?.geo || !A || !B || landmarks.length === 0) return [];
  const k = Math.cos((a.geo.lat * Math.PI) / 180);
  const local = (g: { lat: number; lng: number }) => ({
    x: (g.lng - (a.geo?.lng ?? 0)) * k,
    z: -(g.lat - (a.geo?.lat ?? 0)),
  });
  const d = local(b.geo);
  const len2 = d.x * d.x + d.z * d.z;
  if (len2 < 1e-12) return [];
  const D = { x: B.x - A.x, z: B.z - A.z };
  // complex division D / d
  const sr = (D.x * d.x + D.z * d.z) / len2;
  const si = (D.z * d.x - D.x * d.z) / len2;
  return landmarks.map((lm) => {
    const p = local(lm);
    let x = A.x + sr * p.x - si * p.z;
    let z = A.z + si * p.x + sr * p.z;
    const r = Math.hypot(x, z);
    const max = FADE.from - 0.6;
    if (r > max) {
      x *= max / r;
      z *= max / r;
    }
    return { name: lm.name, x, z };
  });
}

function City({
  properties,
  landmarks,
  onReady,
}: {
  properties: MapProperty[];
  landmarks: MapLandmark[];
  onReady?: () => void;
}) {
  const gltf = useLoader(GLTFLoader, `${BASE}/city.glb`, (loader) => {
    loader.setMeshoptDecoder(MeshoptDecoder);
  });
  const [ground, cityLight, heroLight] = useLoader(THREE.TextureLoader, [
    `${BASE}/ground.webp`,
    `${BASE}/city-lm.webp`,
    `${BASE}/heroes-lm.webp`,
  ]);

  const anchors = useMemo(() => {
    for (const texture of [ground, cityLight, heroLight]) {
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
    }
    ground.anisotropy = 8;
    cityLight.channel = 1;
    heroLight.channel = 1;
    const owned = new Map<string, THREE.MeshStandardMaterial>();
    gltf.scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const part = partOf(mesh);
      if (part === "ground") {
        const material = new THREE.MeshBasicMaterial({ map: ground });
        fadeAtRim(material);
        mesh.material = material;
        mesh.renderOrder = 0;
        return;
      }
      // The two meshes share some materials but not a light map, so each
      // gets its own copy.
      const key = `${part}:${(mesh.material as THREE.Material).uuid}`;
      let material = owned.get(key);
      if (!material) {
        material = (mesh.material as THREE.MeshStandardMaterial).clone();
        material.lightMap = part === "heroes" ? heroLight : cityLight;
        material.lightMapIntensity = LIGHT_MAP_INTENSITY;
        material.envMapIntensity = 0;
        material.metalness = 0;
        fadeAtRim(material);
        owned.set(key, material);
      }
      mesh.material = material;
      mesh.renderOrder = part === "heroes" ? 2 : 1;
    });
    gltf.scene.updateMatrixWorld(true);
    return properties.map((p) => {
      const anchor = gltf.scene.getObjectByName(`pin_${p.key}`);
      return anchor ? anchor.getWorldPosition(new THREE.Vector3()) : undefined;
    });
  }, [gltf, ground, cityLight, heroLight, properties]);

  const placed = useMemo(
    () => placeLandmarks(properties, anchors, landmarks),
    [properties, anchors, landmarks],
  );

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <>
      <primitive object={gltf.scene} />
      {properties.map((p, i) => {
        const at = anchors[i];
        return at ? (
          <PropertyPin
            key={p.key}
            position={at}
            color={p.color}
            name={p.name}
            index={i}
          />
        ) : null;
      })}
      {placed.map((lm) => (
        <LandmarkPin key={lm.name} {...lm} />
      ))}
    </>
  );
}

function Rig() {
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.1;
    const [x, y, z] = CAMERA.position;
    state.camera.position.set(
      x + Math.sin(t) * 1.1 + state.pointer.x * 0.5,
      y + state.pointer.y * 0.25,
      z + Math.cos(t * 0.8) * 0.35,
    );
    state.camera.lookAt(...CAMERA.target);
  });
  return null;
}

/** If the model cannot load, the poster behind the canvas simply stays. */
class Quiet extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function MapCanvas({
  properties,
  landmarks,
  onReady,
}: {
  properties: MapProperty[];
  landmarks: MapLandmark[];
  onReady?: () => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) =>
      setVisible(Boolean(e?.isIntersecting)),
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={wrap} className="absolute inset-0">
      <Quiet>
        <Canvas
          frameloop={visible ? "always" : "never"}
          dpr={[1, 1.5]}
          camera={{
            fov: 38,
            near: 0.5,
            far: 60,
            position: [...CAMERA.position],
          }}
          gl={{ antialias: true, alpha: true }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.NoToneMapping;
          }}
        >
          <Rig />
          <Suspense fallback={null}>
            <City
              properties={properties}
              landmarks={landmarks}
              onReady={onReady}
            />
          </Suspense>
        </Canvas>
      </Quiet>
    </div>
  );
}
