/**
 * Shader sky: a dusk gradient with slow drifting clouds. `tone` blends the
 * palette from warm (1, Cherry) to cool (0, Sky). One full-screen triangle,
 * no scene graph. Loaded with next/dynamic (ssr: false); rendering pauses
 * while the canvas is off-screen.
 */

"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uTone;
  uniform float uAspect;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 7.1; a *= 0.5; }
    return v;
  }

  void main() {
    float h = vUv.y;
    // Warm dusk (Cherry) and cool evening (Sky) palettes.
    vec3 warmTop = vec3(0.17, 0.10, 0.23), warmMid = vec3(0.64, 0.29, 0.39), warmLow = vec3(0.96, 0.66, 0.47);
    vec3 coolTop = vec3(0.05, 0.09, 0.20), coolMid = vec3(0.16, 0.36, 0.56), coolLow = vec3(0.62, 0.83, 0.90);
    vec3 top = mix(coolTop, warmTop, uTone), mid = mix(coolMid, warmMid, uTone), low = mix(coolLow, warmLow, uTone);
    vec3 col = mix(low, mid, smoothstep(0.0, 0.45, h));
    col = mix(col, top, smoothstep(0.4, 1.0, h));

    // Two cloud layers drifting at different speeds, denser near the horizon.
    vec2 p = vec2(vUv.x * uAspect, h);
    float c1 = fbm(p * vec2(1.6, 3.6) + vec2(uTime * 0.012, 0.0));
    float c2 = fbm(p * vec2(3.0, 6.5) + vec2(uTime * 0.022, 3.0));
    float band = smoothstep(0.95, 0.25, h) * smoothstep(0.02, 0.3, h);
    float clouds = smoothstep(0.5, 0.82, c1 * 0.7 + c2 * 0.45) * band;
    vec3 lit = mix(low, vec3(1.0, 0.9, 0.86), 0.45);
    col = mix(col, lit, clouds * 0.5);

    // Low sun glow.
    vec2 sun = vec2(0.72 * uAspect, 0.12);
    float glow = exp(-distance(p, sun) * 2.6);
    col += mix(vec3(0.25, 0.4, 0.5), vec3(0.9, 0.5, 0.3), uTone) * glow * 0.35;

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

function Sky({ tone }: { tone?: RefObject<number> }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uTone: { value: 1 },
          uAspect: { value: 1.6 },
        },
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const u = material.uniforms;
    if (u.uTime) u.uTime.value = state.clock.elapsedTime;
    if (u.uAspect)
      u.uAspect.value = state.size.width / Math.max(state.size.height, 1);
    if (u.uTone)
      u.uTone.value = THREE.MathUtils.lerp(
        u.uTone.value,
        tone?.current ?? 1,
        0.08,
      );
  });

  return (
    <mesh material={material} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

export default function SkyCanvas({
  tone,
  onReady,
}: {
  tone?: RefObject<number>;
  onReady?: () => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
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
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: false, powerPreference: "low-power" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NoToneMapping;
          onReady?.();
        }}
      >
        <Sky tone={tone} />
      </Canvas>
    </div>
  );
}
