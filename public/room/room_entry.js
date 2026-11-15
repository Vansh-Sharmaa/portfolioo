import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class RoomIntro {
  constructor() {
    this.container = document.getElementById('henry-room-container');
    this.canvas = document.getElementById('henry-room-canvas');
    if (!this.container || !this.canvas) return;

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.isEntered = false;
    this.isTransitioning = false;
    this.transitionProgress = 0;

    // 1. Scene, Camera, Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdadada);

    this.camera = new THREE.PerspectiveCamera(35, this.width / this.height, 100, 100000);
    this.currentPos = new THREE.Vector3(-20000, 12000, 20000);
    this.currentFocal = new THREE.Vector3(0, -1000, 0);
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentFocal);

    this.idlePos = new THREE.Vector3(-20000, 12000, 20000);
    this.idleFocal = new THREE.Vector3(0, -1000, 0);
    
    // Target position right in front of the CRT monitor screen
    this.monitorPos = new THREE.Vector3(0, 950, 780);
    this.monitorFocal = new THREE.Vector3(0, 950, 255);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // 2. Mouse and Raycaster
    this.mouse = new THREE.Vector2(-10, -10);
    this.rawMouse = { x: 0, y: 0 };
    this.raycaster = new THREE.Raycaster();
    this.interactiveMeshes = [];

    // 3. Dynamic Screen Texture
    this.setupScreenCanvas();

    // 4. Load Models
    this.loadModels();

    // 5. Setup Events
    this.setupEvents();

    // 6. Setup Top HUD Clock
    this.setupHUD();

    // 7. Start Render Loop
    this.timer = new THREE.Timer();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    // Expose returnToDesk globally for the UI
    window.returnToDesk = () => this.zoomOutToDesk();
  }

  setupScreenCanvas() {
    this.screenCanvas = document.createElement('canvas');
    this.screenCanvas.width = 512;
    this.screenCanvas.height = 384;
    this.screenCtx = this.screenCanvas.getContext('2d');
    this.screenTexture = new THREE.CanvasTexture(this.screenCanvas);
    this.screenTexture.colorSpace = THREE.SRGBColorSpace;
  }

  updateScreenTexture(time) {
    if (!this.screenCtx) return;
    const ctx = this.screenCtx;
    const w = this.screenCanvas.width;
    const h = this.screenCanvas.height;

    // Background: CRT deep phosphor dark green/black
    ctx.fillStyle = '#06100c';
    ctx.fillRect(0, 0, w, h);

    // Scanlines
    ctx.fillStyle = 'rgba(0, 255, 128, 0.04)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 2);
    }

    // Border glowing frame
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    // Glowing CRT Terminal Text
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#88ffcc';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('> VANSH_OS v2.0', 36, 68);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#44ddaa';
    ctx.fillText('> ARCHITECTURE: WEBGPU / CRT', 36, 108);
    ctx.fillText('> STATUS: ONLINE & READY', 36, 136);

    // Blinking prompt box
    const blink = Math.floor(time * 2.5) % 2 === 0;
    ctx.fillStyle = blink ? '#00ffaa' : '#007755';
    ctx.fillRect(36, 175, w - 72, 70);

    ctx.fillStyle = '#05120a';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[ HOVER / CLICK TO ENTER ]', w / 2, 218);
    ctx.textAlign = 'left';

    ctx.font = '14px monospace';
    ctx.fillStyle = '#66ffbb';
    ctx.fillText('> PRESS SCREEN TO LAUNCH PORTFOLIO', 36, 290);
    ctx.fillText('> READY FOR CONNECTION _' + (blink ? '█' : ' '), 36, 320);

    this.screenTexture.needsUpdate = true;
  }

  loadModels() {
    console.log('[ROOM] Starting to load models...');
    const gltfLoader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    const loadBaked = (glbPath, texturePath, scale = 900) => {
      console.log('[ROOM] Loading:', glbPath, texturePath);
      const texture = textureLoader.load(
        texturePath,
        () => console.log('[ROOM] Texture loaded:', texturePath),
        undefined,
        (err) => console.error('[ROOM] Texture error:', texturePath, err)
      );
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;

      const material = new THREE.MeshBasicMaterial({ map: texture });

      gltfLoader.load(
        glbPath,
        (gltf) => {
          console.log('[ROOM] GLB loaded:', glbPath);
          gltf.scene.scale.set(scale, scale, scale);
          gltf.scene.traverse((child) => {
            if (child.isMesh) {
              child.material = material;
            }
          });
          this.scene.add(gltf.scene);
        },
        undefined,
        (err) => console.error('[ROOM] GLB load error:', glbPath, err)
      );
    };

    // Load Computer Setup
    loadBaked('/room/computer_setup.glb', '/room/baked_computer.jpg');

    // Load Decor (plant, books, mug, chair)
    loadBaked('/room/decor.glb', '/room/baked_decor.jpg');

    // Load Environment (desk, floor, walls)
    loadBaked('/room/environment.glb', '/room/baked_environment.jpg');

    // Create 3D Screen Surface on the Computer Monitor
    const screenGeo = new THREE.PlaneGeometry(280, 220);
    const screenMat = new THREE.MeshBasicMaterial({
      map: this.screenTexture,
      toneMapped: false
    });
    this.screenMesh = new THREE.Mesh(screenGeo, screenMat);
    // Position in front of the CRT monitor glass
    this.screenMesh.position.set(0, 950, 255);
    this.screenMesh.rotation.x = -3 * (Math.PI / 180);
    this.scene.add(this.screenMesh);
    this.interactiveMeshes.push(this.screenMesh);

    // Hitbox covering the entire computer area for easy hover/clicking
    const hitboxGeo = new THREE.BoxGeometry(450, 450, 400);
    const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
    this.hitboxMesh = new THREE.Mesh(hitboxGeo, hitboxMat);
    this.hitboxMesh.position.set(0, 950, 200);
    this.scene.add(this.hitboxMesh);
    this.interactiveMeshes.push(this.hitboxMesh);
  }

  setupEvents() {
    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isEntered) return;
      this.rawMouse.x = (e.clientX / this.width) * 2 - 1;
      this.rawMouse.y = -(e.clientY / this.height) * 2 + 1;
      this.mouse.x = this.rawMouse.x;
      this.mouse.y = this.rawMouse.y;

      if (!this.isTransitioning) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactiveMeshes);
        if (intersects.length > 0) {
          document.body.style.cursor = 'pointer';
          const prompt = document.getElementById('room-prompt');
          if (prompt) prompt.innerText = '[ CLICK OR HOVER TO ENTER ]';
          this.zoomIntoMonitor();
        } else {
          document.body.style.cursor = 'default';
        }
      }
    });

    window.addEventListener('click', (e) => {
      if (this.isEntered) return;
      this.zoomIntoMonitor();
    });
  }

  setupHUD() {
    const timeEl = document.getElementById('room-clock');
    if (timeEl) {
      const updateClock = () => {
        const d = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        timeEl.innerText = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      };
      updateClock();
      setInterval(updateClock, 1000);
    }
  }

  zoomIntoMonitor() {
    if (this.isTransitioning || this.isEntered) return;
    this.isTransitioning = true;
    this.transitionStartTime = performance.now();
    this.transitionDuration = 1800; // 1.8s smooth camera glide

    const prompt = document.getElementById('room-prompt');
    if (prompt) prompt.innerText = '[ CONNECTING TO PORTFOLIO... ]';
  }

  zoomOutToDesk() {
    this.isEntered = false;
    this.isTransitioning = true;
    this.container.style.display = 'block';
    this.container.classList.remove('opacity-0', 'pointer-events-none');
    this.container.classList.add('opacity-100', 'pointer-events-auto');

    this.transitionStartTime = performance.now();
    this.transitionDuration = 1400;
    this.reverseTransition = true;
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.timer.update();
    const elapsedTime = this.timer.getElapsed();

    // 1. Update Monitor Screen Texture
    this.updateScreenTexture(elapsedTime);

    // 2. Camera Motion
    if (!this.isTransitioning && !this.isEntered) {
      const swayX = Math.sin((elapsedTime + 19) * 0.25) * 600;
      const swayY = Math.cos((elapsedTime + 1) * 0.15) * 300;
      const mouseParallaxX = this.rawMouse.x * 1200;
      const mouseParallaxY = this.rawMouse.y * 600;

      this.currentPos.x = this.idlePos.x + swayX + mouseParallaxX;
      this.currentPos.y = this.idlePos.y + swayY + mouseParallaxY;
      this.currentPos.z = this.idlePos.z;

      this.currentFocal.copy(this.idleFocal);
      this.camera.position.copy(this.currentPos);
      this.camera.lookAt(this.currentFocal);
    } else if (this.isTransitioning) {
      const elapsed = performance.now() - this.transitionStartTime;
      let t = Math.min(elapsed / this.transitionDuration, 1.0);

      // Smooth Quintic Easing
      const ease = t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;

      if (!this.reverseTransition) {
        this.camera.position.lerpVectors(this.idlePos, this.monitorPos, ease);
        this.camera.lookAt(
          new THREE.Vector3().lerpVectors(this.idleFocal, this.monitorFocal, ease)
        );

        if (t > 0.65) {
          const fadeProgress = (t - 0.65) / 0.35;
          this.container.style.opacity = String(1.0 - fadeProgress);
        }

        if (t >= 1.0) {
          this.isTransitioning = false;
          this.isEntered = true;
          this.container.classList.add('opacity-0', 'pointer-events-none');
          this.container.classList.remove('opacity-100', 'pointer-events-auto');
          setTimeout(() => {
            if (this.isEntered) this.container.style.display = 'none';
          }, 300);
        }
      } else {
        this.camera.position.lerpVectors(this.monitorPos, this.idlePos, ease);
        this.camera.lookAt(
          new THREE.Vector3().lerpVectors(this.monitorFocal, this.idleFocal, ease)
        );

        if (t >= 1.0) {
          this.isTransitioning = false;
          this.reverseTransition = false;
        }
      }
    }

    if (!this.isEntered || this.isTransitioning) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new RoomIntro());
} else {
  new RoomIntro();
}
