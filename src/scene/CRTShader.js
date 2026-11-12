import * as THREE from 'three';

/**
 * Custom CRT / Camcorder Shader
 * Emulates the vintage CRT monitor, lens curvature, chromatic aberration,
 * phosphor scanlines, and subtle electromagnetic noise seen on fojcikdominik.com.
 */
export const CRTShader = {
  name: 'CRTShader',
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0.0 },
    uResolution: { value: new THREE.Vector2(1920, 1080) },
    uCurvature: { value: 0.04 },            // Subtle barrel distortion
    uScanlineIntensity: { value: 0.18 },    // Horizontal scanline opacity
    uScanlineCount: { value: 650.0 },       // Density of scanlines
    uChromaOffset: { value: 0.0022 },       // RGB channel split
    uVignetteStrength: { value: 1.1 },      // Corner darkening
    uNoiseIntensity: { value: 0.045 },      // Grain / film noise
    uGlitch: { value: 0.0 }                 // Occasional line tear
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uCurvature;
    uniform float uScanlineIntensity;
    uniform float uScanlineCount;
    uniform float uChromaOffset;
    uniform float uVignetteStrength;
    uniform float uNoiseIntensity;
    uniform float uGlitch;

    varying vec2 vUv;

    // Pseudo-random generator
    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    // Lens barrel curvature
    vec2 curveUV(vec2 uv) {
      vec2 centered = uv * 2.0 - 1.0;
      vec2 offset = centered.yx / vec2(uCurvature > 0.0 ? 1.0 / uCurvature : 999.0);
      centered += centered * offset * offset;
      return centered * 0.5 + 0.5;
    }

    void main() {
      // 1. Lens Distortion
      vec2 uv = curveUV(vUv);

      // Black out outside the barrel border
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.01, 0.01, 0.015, 1.0);
        return;
      }

      // Glitch displacement line
      float glitchOffset = 0.0;
      if (uGlitch > 0.01) {
        float line = sin(uv.y * 30.0 + uTime * 20.0);
        if (line > 0.96) {
          glitchOffset = (rand(vec2(uTime, uv.y)) - 0.5) * 0.03 * uGlitch;
        }
      }

      // 2. Chromatic Aberration (RGB shift)
      vec2 rUv = uv + vec2(uChromaOffset + glitchOffset, 0.0);
      vec2 gUv = uv + vec2(glitchOffset * 0.5, 0.0);
      vec2 bUv = uv - vec2(uChromaOffset - glitchOffset, 0.0);

      float r = texture2D(tDiffuse, rUv).r;
      float g = texture2D(tDiffuse, gUv).g;
      float b = texture2D(tDiffuse, bUv).b;

      vec3 color = vec3(r, g, b);

      // 3. Scanlines (phosphor CRT raster)
      float scanline = sin(uv.y * uScanlineCount + uTime * 2.0) * 0.5 + 0.5;
      color -= color * scanline * uScanlineIntensity;

      // 4. Subtle film noise / grain
      float noise = (rand(uv + fract(uTime * 17.13)) - 0.5) * uNoiseIntensity;
      color += vec3(noise);

      // 5. Vignette (soft radial fade at viewport edges)
      vec2 centerCoord = uv - 0.5;
      float vignette = clamp(1.0 - dot(centerCoord, centerCoord) * uVignetteStrength, 0.0, 1.0);
      color *= vignette;

      gl_FragColor = vec4(color, 1.0);
    }
  `
};

