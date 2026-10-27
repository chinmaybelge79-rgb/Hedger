import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface HedgerOrbProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  speed?: number;
  interactive?: boolean;
}

export const HedgerOrb: React.FC<HedgerOrbProps> = ({
  size = 44,
  className = '',
  style = {},
  speed = 1.0,
  interactive = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
    } catch (e) {
      console.warn('WebGL not supported for HedgerOrb:', e);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(size, size, false);
    renderer.setClearColor(0x000000, 0.0);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      varying vec2 vUv;
      uniform float time;
      uniform vec2 mouse;
      uniform vec2 resolution;

      mat3 rotateX(float a) {
        float c = cos(a), s = sin(a);
        return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c);
      }
      mat3 rotateY(float a) {
        float c = cos(a), s = sin(a);
        return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
      }
      mat3 rotateZ(float a) {
        float c = cos(a), s = sin(a);
        return mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0);
      }

      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float dist = length(p);
        float R = 0.84;

        vec3 col = vec3(0.0);
        float alpha = 0.0;

        // Outer Ethereal Radial Aura / Ambient Bloom
        if (dist > R) {
          float d = (dist - R) / (1.0 - R);
          float aura = exp(-d * 5.2) * 0.45;
          float angle = atan(p.y, p.x);
          vec3 auraCol = mix(
            vec3(0.0, 0.92, 1.0), // Electric Cyan
            vec3(0.98, 0.10, 0.82), // Neon Magenta
            0.5 + 0.5 * sin(angle + time * 0.35)
          );
          col = auraCol * aura;
          alpha = clamp(aura * 1.9, 0.0, 1.0);
        } else {
          // Inside the Glass Sphere: Volumetric Plasma & Auroral Ribbons
          float z = sqrt(max(0.0, R * R - dist * dist));
          vec3 normal = vec3(p.x, p.y, z) / R;

          // High-Intensity Fresnel Rim Highlight
          float fresnel = pow(1.0 - abs(normal.z), 1.9);

          // Rim chromatic variation: top-right cyan, bottom-left magenta
          float angle = atan(p.y, p.x);
          vec3 rimCol = mix(
            vec3(0.0, 0.96, 1.0),
            vec3(1.0, 0.12, 0.85),
            0.5 + 0.5 * sin(angle - 0.75 + time * 0.2)
          );

          // Brilliant White Specular Glints on the Spherical Rim
          float glintA = pow(max(0.0, sin(angle * 2.0 - 0.4 + time * 0.1)), 6.0) * fresnel;
          float glintB = pow(fresnel, 4.5);
          rimCol += vec3(1.0, 1.0, 1.0) * (glintA * 0.75 + glintB * 0.85);

          // Volumetric Raymarch / Flowing Silk Filament Slices
          vec3 innerCol = vec3(0.0);
          mat3 rot = rotateY(time * 0.52 + mouse.x * 1.3) *
                     rotateX(time * 0.40 + mouse.y * 1.3) *
                     rotateZ(time * 0.22);

          const int SAMPLES = 18;
          float tStart = -z / R;
          float tEnd = z / R;
          float dt = (tEnd - tStart) / float(SAMPLES);

          for (int i = 0; i < SAMPLES; i++) {
            float curT = tStart + float(i) * dt;
            vec3 samplePos = vec3(p.x / R, p.y / R, curT);
            vec3 q = rot * samplePos;

            // Non-linear fluid coordinate warping
            vec3 warp = vec3(
              sin(q.y * 3.4 + time * 0.92) * 0.42,
              cos(q.z * 3.7 + time * 0.82) * 0.42,
              sin(q.x * 3.0 + time * 1.02) * 0.42
            );

            vec3 q2 = q + warp;

            // Multi-harmonic flowing wave sheets
            float w1 = sin(q2.x * 4.2 + q2.y * 3.4 + time * 1.15);
            float w2 = cos(q2.y * 3.6 + q2.z * 4.2 - time * 0.98);
            float w3 = sin(q2.z * 4.5 + q2.x * 2.9 + time * 1.35);

            // Silk ribbon cross-sections
            float rCyan = 0.011 / (abs(w1 * 0.75 + w2 * 0.65) + 0.032);
            float rBlue = 0.011 / (abs(w2 * 0.75 + w3 * 0.65) + 0.032);
            float rPurple = 0.010 / (abs(w3 * 0.75 + w1 * 0.65) + 0.032);
            float rMagenta = 0.012 / (abs(w1 * 0.8 + w3 * 0.8) + 0.030);

            // Delicate internal filaments (fine threads seen in the image)
            float filament = sin(q2.x * 22.0 + q2.y * 22.0 + time * 2.5) * 0.5 + 0.5;
            rCyan += (0.0035 / (abs(w1) + 0.016)) * filament;
            rMagenta += (0.0035 / (abs(w3) + 0.016)) * (1.0 - filament);

            // Signature colors from the energy sphere image
            vec3 cCyan = vec3(0.0, 0.96, 1.0);
            vec3 cBlue = vec3(0.12, 0.38, 1.0);
            vec3 cPurple = vec3(0.70, 0.12, 1.0);
            vec3 cMagenta = vec3(1.0, 0.06, 0.82);

            innerCol += cCyan * rCyan * 0.30;
            innerCol += cBlue * (rCyan * rBlue) * 1.35;
            innerCol += cPurple * rPurple * 0.25;
            innerCol += cMagenta * rMagenta * 0.32;
          }

          // Composite inside plasma ribbons + intense glowing outer glass rim
          col = innerCol * 0.62 + rimCol * fresnel * 1.75;

          // Alpha for crisp translucent glass sphere
          alpha = clamp(length(col) * 0.98 + fresnel * 0.9, 0.0, 1.0);
        }

        gl_FragColor = vec4(col, alpha);
      }
    `;

    const uniforms = {
      time: { value: 0 },
      mouse: { value: new THREE.Vector2(0, 0) },
      resolution: { value: new THREE.Vector2(size * dpr, size * dpr) }
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      blending: THREE.NormalBlending
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let startTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const elapsed = (now - startTime) / 1000;

      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      uniforms.time.value = elapsed * speed;
      uniforms.mouse.value.set(mouseRef.current.x, mouseRef.current.y);

      renderer?.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current.targetX = Math.max(-1, Math.min(1, nx));
      mouseRef.current.targetY = Math.max(-1, Math.min(1, ny));
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
    };

    if (interactive) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (interactive && canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
      mesh.geometry.dispose();
      material.dispose();
      renderer?.dispose();
    };
  }, [size, speed, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        pointerEvents: interactive ? 'auto' : 'none',
        ...style
      }}
    />
  );
};
