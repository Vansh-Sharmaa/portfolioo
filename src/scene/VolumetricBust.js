import * as THREE from 'three';

/**
 * Volumetric Holographic 3D AI Bust
 * Renders a 50,000+ particle holographic volume with:
 * - Real 3D depth and parallax tracking
 * - Vertical hologram scanning wave
 * - Dynamic electromagnetic glitch displacement
 * - Fly-through particle disintegration when the camera accelerates forward
 */
export class VolumetricBust {
  constructor() {
    this.particleCount = 48000;
    this.geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);
    const randoms = new Float32Array(this.particleCount * 3);

    const cyan = new THREE.Color(0x38bdf8);
    const mint = new THREE.Color(0x4ee3c2);
    const slate = new THREE.Color(0x1e293b);
    const white = new THREE.Color(0xffffff);

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      // 1. Generate volumetric humanoid head / bust proportions
      const isHead = Math.random() < 0.72;
      let x, y, z;

      if (isHead) {
        // Cranium & facial shell (ellipsoidal with jaw taper)
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const u = 0.5 + 0.5 * Math.cbrt(Math.random());

        const baseR = 1.35 * u;
        x = baseR * Math.sin(phi) * Math.cos(theta) * 0.88;
        y = baseR * Math.cos(phi) * 1.25 + 0.35;
        z = baseR * Math.sin(phi) * Math.sin(theta) * 0.95;

        // Jaw and cheek taper
        if (y < 0.2) {
          x *= (0.7 + (y + 1.0) * 0.25);
          z *= (0.75 + (y + 1.0) * 0.2);
        }
      } else {
        // Neck & shoulders pedestal
        const angle = Math.random() * Math.PI * 2;
        const width = 2.4 * Math.random();
        x = Math.cos(angle) * width * 1.35;
        y = -0.9 - Math.random() * 0.95;
        z = Math.sin(angle) * (width * 0.65);
      }

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      // Random dispersion vector for fly-through disintegration
      randoms[i3] = (Math.random() - 0.5) * 6.0;
      randoms[i3 + 1] = (Math.random() - 0.5) * 6.0;
      randoms[i3 + 2] = (Math.random() - 0.5) * 12.0;

      // Color gradation (depth highlights)
      const depthFactor = (z + 1.5) / 3.0;
      let chosenColor;
      if (Math.random() < 0.08) {
        chosenColor = white;
      } else if (depthFactor > 0.6) {
        chosenColor = mint.clone().lerp(cyan, Math.random());
      } else {
        chosenColor = slate.clone().lerp(cyan, depthFactor * 0.8);
      }

      colors[i3] = chosenColor.r;
      colors[i3 + 1] = chosenColor.g;
      colors[i3 + 2] = chosenColor.b;

      sizes[i] = Math.random() * 3.2 + 1.2;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3));

    // Custom Shader Material with hologram scanline, glitch tear, and scroll disintegration
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uProgress: { value: 0.0 },
        uGlitch: { value: 0.0 }
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uProgress;
        uniform float uGlitch;

        attribute float size;
        attribute vec3 color;
        attribute vec3 aRandom;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;
          vec3 pos = position;

          // 1. Hologram Scanline wave traveling vertically
          float scan = sin(pos.y * 6.0 - uTime * 3.0);
          pos.x += scan * 0.02;
          pos.z += cos(pos.y * 5.0 - uTime * 2.5) * 0.02;

          // 2. Glitch slice displacement
          if (uGlitch > 0.05) {
            float g = step(0.92, fract(sin(pos.y * 35.0 + uTime * 20.0) * 43758.5453));
            pos.x += g * (sin(uTime * 30.0) * 0.35 * uGlitch);
            pos.z += g * (cos(uTime * 25.0) * 0.25 * uGlitch);
          }

          // 3. Scroll Disintegration (Fly-through scatter)
          // As progress goes from 0.08 to 0.28, bust disperses into cyberspace
          float scatter = smoothstep(0.08, 0.32, uProgress);
          pos += aRandom * scatter * 3.5;
          pos.z += scatter * 6.0;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (135.0 / -mvPosition.z) * (1.0 - scatter * 0.7);
          gl_Position = projectionMatrix * mvPosition;

          // Fade out as camera flies through
          vAlpha = (1.0 - smoothstep(0.18, 0.35, uProgress)) * (0.6 + 0.4 * scan);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;

          // Glowing circular dot
          float strength = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(vColor, vAlpha * strength);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.mesh = new THREE.Points(this.geometry, this.material);
    this.mesh.position.set(0, 0, 0);
  }

  update(time, scrollProgress, tilt, glitch) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uProgress.value = scrollProgress;
    this.material.uniforms.uGlitch.value = glitch;

    // Subtle 3D idle rotation + tilt
    this.mesh.rotation.y = time * 0.12 + tilt.x * 0.45;
    this.mesh.rotation.x = tilt.y * 0.3;
  }
}
