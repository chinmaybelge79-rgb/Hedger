import { useEffect, useRef } from "react";
import * as THREE from "three";

export function WebGLShader({
  className,
  style,
  isDark = true
}: {
  className?: string;
  style?: React.CSSProperties;
  isDark?: boolean;
} = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.OrthographicCamera | null;
    renderer: THREE.WebGLRenderer | null;
    mesh: THREE.Mesh | null;
    uniforms: any;
    animationId: number | null;
  }>({
    scene: null,
    camera: null,
    renderer: null,
    mesh: null,
    uniforms: null,
    animationId: null,
  });

  // Dynamically respond to isDark prop changes
  useEffect(() => {
    const { current: refs } = sceneRef;
    if (refs.uniforms && refs.uniforms.isDark) {
      refs.uniforms.isDark.value = isDark ? 1.0 : 0.0;
    }
    if (refs.renderer) {
      refs.renderer.setClearColor(new THREE.Color(isDark ? 0x000000 : 0xFFFFFF), 1.0);
    }
  }, [isDark]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const { current: refs } = sceneRef;

    const vertexShader = `
      attribute vec3 position;
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform float xScale;
      uniform float yScale;
      uniform float distortion;
      uniform float isDark;

      void main() {
        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
        
        // Offset wave vertically to position it elegantly across the lower third
        p.y += 0.42;

        float d = length(p) * distortion;
        
        float rx = p.x * (1.0 + d);
        float gx = p.x;
        float bx = p.x * (1.0 - d);

        float r = 0.05 / abs(p.y + sin((rx + time) * xScale) * yScale);
        float g = 0.05 / abs(p.y + sin((gx + time) * xScale) * yScale);
        float b = 0.05 / abs(p.y + sin((bx + time) * xScale) * yScale);
        
        if (isDark > 0.5) {
          // Pitch-black dark mode: Glowing chromatic ribbons on black
          gl_FragColor = vec4(r, g, b, 1.0);
        } else {
          // Light mode: Clean white background with radiant flowing chromatic ribbons
          vec3 bg = vec3(0.985, 0.988, 0.995);
          
          float diff_r = max(0.0, r - (g + b) * 0.5);
          float diff_g = max(0.0, g - (r + b) * 0.5);
          float diff_b = max(0.0, b - (r + g) * 0.5);
          
          float diff_rg = max(0.0, min(r, g) - b * 0.7);
          float diff_gb = max(0.0, min(g, b) - r * 0.7);
          
          float gain = 1.35;
          float drop_r = clamp((diff_g * 0.75 + diff_b * 0.7 + diff_gb * 0.7) * gain, 0.0, 0.82);
          float drop_g = clamp((diff_r * 0.65 + diff_b * 0.3) * gain, 0.0, 0.68);
          float drop_b = clamp((diff_r * 0.75 + diff_g * 0.4 + diff_rg * 0.7) * gain, 0.0, 0.82);
          
          float core = clamp(min(r, min(g, b)) * 1.8, 0.0, 1.0);
          
          vec3 base_tint = bg - vec3(drop_r, drop_g, drop_b);
          vec3 finalCol = mix(base_tint, vec3(1.0), core);
          gl_FragColor = vec4(clamp(finalCol, 0.0, 1.0), 1.0);
        }
      }
    `;

    const initScene = () => {
      try {
        refs.scene = new THREE.Scene();
        refs.renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
        refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        refs.renderer.setClearColor(new THREE.Color(isDark ? 0x000000 : 0xFFFFFF), 1.0);

        refs.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1);

        refs.uniforms = {
          resolution: { value: [canvas.parentElement?.clientWidth || window.innerWidth, canvas.parentElement?.clientHeight || window.innerHeight] },
          time: { value: 0.0 },
          xScale: { value: 1.0 },
          yScale: { value: 0.5 },
          distortion: { value: 0.05 },
          isDark: { value: isDark ? 1.0 : 0.0 },
        };

        const position = [
          -1.0, -1.0, 0.0,
           1.0, -1.0, 0.0,
          -1.0,  1.0, 0.0,
           1.0, -1.0, 0.0,
          -1.0,  1.0, 0.0,
           1.0,  1.0, 0.0,
        ];

        const positions = new THREE.BufferAttribute(new Float32Array(position), 3);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", positions);

        const material = new THREE.RawShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: refs.uniforms,
          side: THREE.DoubleSide,
        });

        refs.mesh = new THREE.Mesh(geometry, material);
        refs.scene.add(refs.mesh);

        handleResize();
      } catch (err) {
        // Fallback gracefully if WebGL is unavailable in test or low-end environments
        console.warn("WebGL not supported or unavailable:", err);
      }
    };

    const animate = () => {
      if (refs.uniforms) refs.uniforms.time.value += 0.01;
      if (refs.renderer && refs.scene && refs.camera) {
        refs.renderer.render(refs.scene, refs.camera);
      }
      refs.animationId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      if (!refs.renderer || !refs.uniforms || !canvasRef.current) return;
      const parent = canvasRef.current.parentElement;
      const width = parent && parent.clientWidth > 0 ? parent.clientWidth : window.innerWidth;
      const height = parent && parent.clientHeight > 0 ? parent.clientHeight : window.innerHeight;
      refs.renderer.setSize(width, height, false);
      refs.uniforms.resolution.value = [width, height];
    };

    initScene();
    animate();
    window.addEventListener("resize", handleResize);

    return () => {
      if (refs.animationId) cancelAnimationFrame(refs.animationId);
      window.removeEventListener("resize", handleResize);
      if (refs.mesh) {
        refs.scene?.remove(refs.mesh);
        refs.mesh.geometry.dispose();
        if (refs.mesh.material instanceof THREE.Material) {
          refs.mesh.material.dispose();
        }
      }
      refs.renderer?.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className || "absolute top-0 left-0 w-full h-full block pointer-events-none"}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
        zIndex: 0,
        ...style
      }}
    />
  );
}
