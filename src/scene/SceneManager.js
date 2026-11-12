import * as THREE from 'three';
import { CameraPath } from './CameraPath.js';
import { PostProcessingManager } from './PostProcessing.js';
import { VolumetricBust } from './VolumetricBust.js';
import { EnvironmentManager } from './EnvironmentManager.js';

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // 1. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    this.renderer.setClearColor(0x050608, 1.0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // 2. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050608, 0.038);

    this.camera = new THREE.PerspectiveCamera(46, this.width / this.height, 0.1, 120);
    this.cameraPath = new CameraPath();

    // 3. Post-Processing Pipeline
    this.postProcessing = new PostProcessingManager(
      this.renderer,
      this.scene,
      this.camera,
      this.width,
      this.height
    );

    // 4. Lighting
    this.setupLights();

    // 5. Volumetric 3D AI Bust (Hero Centerpiece)
    this.volumetricBust = new VolumetricBust();
    this.scene.add(this.volumetricBust.mesh);

    // 6. 3D Cyber City Canyon & Environment Models
    this.environment = new EnvironmentManager(this.scene);

    // 7. Ambient Data Stream Particles
    this.setupDataStream();

    // 8. Bind resize
    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);

    this.clock = new THREE.Clock();
  }

  setupLights() {
    const ambient = new THREE.AmbientLight(0x0a141e, 2.2);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0x4ee3c2, 4.0);
    keyLight.position.set(6, 8, 8);
    this.scene.add(keyLight);

    const cyanRim = new THREE.DirectionalLight(0x38bdf8, 3.2);
    cyanRim.position.set(-6, 2, -6);
    this.scene.add(cyanRim);
  }

  setupDataStream() {
    const streamCount = 5000;
    const streamGeo = new THREE.BufferGeometry();
    const streamPositions = new Float32Array(streamCount * 3);

    for (let i = 0; i < streamCount; i++) {
      const i3 = i * 3;
      streamPositions[i3] = (Math.random() - 0.5) * 22;
      streamPositions[i3 + 1] = (Math.random() - 0.5) * 16;
      streamPositions[i3 + 2] = -Math.random() * 42 + 8;
    }

    streamGeo.setAttribute('position', new THREE.BufferAttribute(streamPositions, 3));
    const streamMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 1.4,
      transparent: true,
      opacity: 0.3,
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

    // 1. Update Camera along Catmull-Rom Spline
    this.cameraPath.updateCamera(this.camera, scrollProgress, tilt);

    // 2. Update Volumetric AI Bust (scan wave, glitch, fly-through disintegration)
    this.volumetricBust.update(time, scrollProgress, tilt, glitchAmount);

    // 3. Update 3D Environment (City canyon, waypoints, robot arm)
    this.environment.update(time, scrollProgress);

    // 4. Update Post-Processing & Render
    this.postProcessing.setGlitch(glitchAmount);
    this.postProcessing.render(time);
  }
}
