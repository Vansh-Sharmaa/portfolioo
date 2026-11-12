import * as THREE from 'three';
import { CameraPath } from './CameraPath.js';
import { PostProcessingManager } from './PostProcessing.js';

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // 1. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false, // Handled or softened by post-processing passes
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    this.renderer.setClearColor(0x050608, 1.0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // 2. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050608, 0.035);

    this.camera = new THREE.PerspectiveCamera(46, this.width / this.height, 0.1, 100);
    this.cameraPath = new CameraPath();

    // 3. Post-Processing
    this.postProcessing = new PostProcessingManager(
      this.renderer,
      this.scene,
      this.camera,
      this.width,
      this.height
    );

    // 4. Lighting
    this.setupLights();

    // 5. 3D World Elements (Holographic AI Centerpiece + Cyber Waypoints + Starfield)
    this.setupWorld();

    // 6. Bind events
    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);

    this.clock = new THREE.Clock();
  }

  setupLights() {
    const ambient = new THREE.AmbientLight(0x0f1d24, 2.0);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0x4ee3c2, 3.5);
    keyLight.position.set(5, 8, 10);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.8);
    rimLight.position.set(-6, -4, -5);
    this.scene.add(rimLight);
  }

  setupWorld() {
    // A. 3D Holographic AI Core (Particle Hologram at Hero)
    const particleCount = 28000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const originalPos = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0x38bdf8); // Cyan
    const color2 = new THREE.Color(0x4ee3c2); // Neon Mint
    const color3 = new THREE.Color(0xffffff); // Pure highlight

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Generate a cybernetic humanoid / torus core bust volume
      const u = Math.random();
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 1.6 * Math.cbrt(u) * (0.8 + 0.3 * Math.sin(theta * 3.0) * Math.cos(phi * 2.0));

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi) * 1.35; // Slight vertical elongation
      const z = r * Math.sin(phi) * Math.sin(theta) * 0.9;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      originalPos[i3] = x;
      originalPos[i3 + 1] = y;
      originalPos[i3 + 2] = z;

      // Color gradation
      const mixed = Math.random() > 0.4 ? color1.clone().lerp(color2, Math.random()) : color3;
      colors[i3] = mixed.r;
      colors[i3 + 1] = mixed.g;
      colors[i3 + 2] = mixed.b;

      sizes[i] = Math.random() * 2.5 + 1.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.heroOriginalPos = originalPos;

    // Custom shader material for particle hologram with depth-scan & glitch
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uGlitch: { value: 0.0 }
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uGlitch;
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;
          vec3 pos = position;

          // Hologram scan pulse wave
          float wave = sin(pos.y * 5.0 - uTime * 3.0);
          pos.x += wave * 0.02;
          pos.z += cos(pos.y * 4.0 - uTime * 2.5) * 0.02;

          // Glitch displacement
          if (uGlitch > 0.1) {
            float g = step(0.92, fract(sin(pos.y * 30.0 + uTime * 15.0) * 43758.5453));
            pos.x += g * (sin(uTime * 30.0) * 0.25 * uGlitch);
          }

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (120.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;

          // Alpha fade by distance & pulse
          vAlpha = 0.65 + 0.35 * wave;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          // Circular particle shape with soft glowing edge
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          float strength = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(vColor, vAlpha * strength);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.heroCore = new THREE.Points(geometry, particleMaterial);
    this.scene.add(this.heroCore);

    // B. Spatial Project Waypoints (Floating 3D Cyber Rings and Pods)
    this.projectWaypoints = [];
    const waypoints = [
      { pos: new THREE.Vector3(1.2, 0.4, -4.5), color: 0x4ee3c2 }, // Project 1
      { pos: new THREE.Vector3(-1.0, -0.4, -12.5), color: 0x38bdf8 }, // Project 2
      { pos: new THREE.Vector3(1.0, 0.3, -20.5), color: 0x818cf8 }  // Project 3
    ];

    waypoints.forEach((wp, idx) => {
      const group = new THREE.Group();
      group.position.copy(wp.pos);

      // Outer tech ring
      const ringGeo = new THREE.RingGeometry(1.4, 1.43, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: wp.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI * 0.5;
      group.add(ringMesh);

      // Inner reticle octahedron
      const octGeo = new THREE.OctahedronGeometry(0.5, 0);
      const octMat = new THREE.MeshBasicMaterial({
        color: wp.color,
        wireframe: true,
        transparent: true,
        opacity: 0.65
      });
      const octMesh = new THREE.Mesh(octGeo, octMat);
      group.add(octMesh);

      this.scene.add(group);
      this.projectWaypoints.push({ group, octMesh, ringMesh });
    });

    // C. 3D Tunnel Grid & Depth Stream
    const streamCount = 4000;
    const streamGeo = new THREE.BufferGeometry();
    const streamPositions = new Float32Array(streamCount * 3);
    for (let i = 0; i < streamCount; i++) {
      const i3 = i * 3;
      streamPositions[i3] = (Math.random() - 0.5) * 20;
      streamPositions[i3 + 1] = (Math.random() - 0.5) * 16;
      streamPositions[i3 + 2] = -Math.random() * 40 + 8;
    }
    streamGeo.setAttribute('position', new THREE.BufferAttribute(streamPositions, 3));
    const streamMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 1.5,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending
    });
    this.streamParticles = new THREE.Points(streamGeo, streamMat);
    this.scene.add(this.streamParticles);
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    this.postProcessing.setSize(this.width, this.height);
  }

  update(scrollProgress, tilt, glitchAmount = 0.0) {
    const time = this.clock.getElapsedTime();

    // 1. Update Camera along Catmull-Rom 3D Spline
    this.cameraPath.updateCamera(this.camera, scrollProgress, tilt);

    // 2. Animate Hero Core
    if (this.heroCore && this.heroCore.material.uniforms) {
      this.heroCore.material.uniforms.uTime.value = time;
      this.heroCore.material.uniforms.uGlitch.value = glitchAmount;
      this.heroCore.rotation.y = time * 0.15 + tilt.x * 0.35;
      this.heroCore.rotation.x = tilt.y * 0.25;
    }

    // 3. Animate Project Waypoints
    this.projectWaypoints.forEach((wp, i) => {
      wp.octMesh.rotation.y = time * (0.8 + i * 0.2);
      wp.octMesh.rotation.z = time * 0.5;
      wp.ringMesh.rotation.z = -time * 0.4;
    });

    // 4. Update Post Processing & Render
    this.postProcessing.setGlitch(glitchAmount);
    this.postProcessing.render(time);
  }
}

