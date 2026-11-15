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
    this.reverseTransition = false;
    this.transitionProgress = 0;
    this.hovered = false;

    // 1. Scene, Camera, Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdadada);

    this.camera = new THREE.PerspectiveCamera(35, this.width / this.height, 100, 100000);
    
    // Idle camera: isometric studio angle
    this.idlePos = new THREE.Vector3(-20000, 12000, 20000);
    this.idleFocal = new THREE.Vector3(0, -1000, 0);

    // Monitor camera: positioned in front of the screen
    // The screen center is at (0, 958, 418). At distance ~1300, it fills the camera's 35deg FOV
    this.monitorPos = new THREE.Vector3(0, 958, 1720);
    this.monitorFocal = new THREE.Vector3(0, 958, 418);

    this.currentPos = new THREE.Vector3().copy(this.idlePos);
    this.currentFocal = new THREE.Vector3().copy(this.idleFocal);
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentFocal);

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

    // 4. Load Models & Screen Mesh
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
    this.screenCanvas.width = 1024;
    this.screenCanvas.height = 768;
    this.screenCtx = this.screenCanvas.getContext('2d');
    this.screenTexture = new THREE.CanvasTexture(this.screenCanvas);
    this.screenTexture.colorSpace = THREE.SRGBColorSpace;
  }

  updateScreenTexture(time) {
    if (!this.screenCtx) return;
    const ctx = this.screenCtx;
    const w = this.screenCanvas.width;
    const h = this.screenCanvas.height;

    // Background: CRT deep phosphor dark emerald green
    const grad = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, w / 1.5);
    grad.addColorStop(0, '#0c2219');
    grad.addColorStop(1, '#030a06');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Fine Scanlines
    ctx.fillStyle = 'rgba(0, 255, 140, 0.05)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 2);
    }

    // Outer CRT bezel frame
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 10;
    ctx.strokeRect(24, 24, w - 48, h - 48);

    // Header bar
    ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
    ctx.fillRect(24, 24, w - 48, 56);
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('■ VANSH_OS v2.0  //  TERMINAL ARCHITECTURE', 48, 62);

    // Glowing Terminal Text
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#a8ffd4';
    ctx.font = 'bold 30px monospace';
    ctx.fillText('> USER: VANSH SHARMA', 56, 140);

    ctx.font = '22px monospace';
    ctx.fillStyle = '#55eebb';
    ctx.fillText('> ROLE: SOFTWARE ENGINEER & CREATIVE DEVELOPER', 56, 185);
    ctx.fillText('> CORE: NETSENTINEL // FILEGENIE // QUERYGENIE // LEXAI', 56, 225);
    ctx.fillText('> STACK: PYTHON • FASTAPI • DOCKER • THREE.JS • WEBGPU', 56, 265);
    ctx.fillText('> TELEMETRY STATUS: 100% OPERATIONAL', 56, 305);

    // Center Action Box
    const blink = Math.floor(time * 2.8) % 2 === 0;
    const isHovered = this.hovered || this.isTransitioning;
    
    ctx.fillStyle = isHovered ? '#00ffaa' : (blink ? '#00bb77' : '#007744');
    ctx.fillRect(56, 370, w - 112, 120);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#021008';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    const actionText = isHovered ? '>> ENTERING PORTFOLIO SYSTEM <<' : '[ CLICK OR HOVER SCREEN TO ENTER ]';
    ctx.fillText(actionText, w / 2, 442);
    ctx.textAlign = 'left';

    // Footer info
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 8;
    ctx.font = '20px monospace';
    ctx.fillStyle = '#77ffc8';
    ctx.fillText('> SYSTEM INTERACTION: MOUSE HOVER OR CLICK ANYWHERE', 56, 560);
    ctx.fillText('> REVERSE CONTROL: [ ⇱ DESK ] BUTTON IN TOP BAR', 56, 600);
    ctx.fillText('> READY _' + (blink ? '█' : ' '), 56, 650);

    this.screenTexture.needsUpdate = true;
  }

  loadModels() {
    const gltfLoader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    const loadBaked = (glbPath, texturePath, scale = 900) => {
      const texture = textureLoader.load(texturePath);
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;

      const material = new THREE.MeshBasicMaterial({ map: texture });

      gltfLoader.load(glbPath, (gltf) => {
        gltf.scene.scale.set(scale, scale, scale);
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            child.material = material;
          }
        });
        this.scene.add(gltf.scene);
      });
    };

    // Load Computer Setup, Decor, and Environment
    loadBaked('/room/computer_setup.glb', '/room/baked_computer.jpg');
    loadBaked('/room/decor.glb', '/room/baked_decor.jpg');
    loadBaked('/room/environment.glb', '/room/baked_environment.jpg');

    // Precision Screen Geometry:
    // Fits the monitor opening (x: 1130, y: 890, center at y: 958, z: 418, tilt: -3.9 deg)
    const screenGeo = new THREE.PlaneGeometry(1130, 890);
    const screenMat = new THREE.MeshBasicMaterial({
      map: this.screenTexture,
      toneMapped: false
    });
    this.screenMesh = new THREE.Mesh(screenGeo, screenMat);
    this.screenMesh.position.set(0, 958, 418);
    this.screenMesh.rotation.x = -3.9 * (Math.PI / 180);
    this.scene.add(this.screenMesh);
    this.interactiveMeshes.push(this.screenMesh);

    // Hitbox covering the monitor for easy hovering
    const hitboxGeo = new THREE.BoxGeometry(1300, 1100, 500);
    const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
    this.hitboxMesh = new THREE.Mesh(hitboxGeo, hitboxMat);
    this.hitboxMesh.position.set(0, 958, 350);
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
          this.hovered = true;
          document.body.style.cursor = 'pointer';
          const prompt = document.getElementById('room-prompt');
          if (prompt) {
            prompt.innerText = '[ CONNECTING... CLICK OR HOVER TO ENTER ]';
            prompt.style.borderColor = '#00ffaa';
            prompt.style.color = '#00ffaa';
          }
          // Smooth glide on screen hover
          this.zoomIntoMonitor();
        } else {
          this.hovered = false;
          document.body.style.cursor = 'default';
        }
      }
    });

    this.container.addEventListener('click', () => {
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
    this.reverseTransition = false;
    this.transitionStartTime = performance.now();
    this.transitionDuration = 1800; // 1.8s smooth camera glide

    const prompt = document.getElementById('room-prompt');
    if (prompt) prompt.innerText = '[ LAUNCHING SYSTEM INTERFACE... ]';
  }

  zoomOutToDesk() {
    console.log('[ROOM] Zooming out to desk...');
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    this.isEntered = false;
    this.isTransitioning = true;
    this.reverseTransition = true;
    
    // Explicitly restore display and opacity
    this.container.style.display = 'block';
    this.container.style.opacity = '1';
    this.container.style.pointerEvents = 'auto';

    this.transitionStartTime = performance.now();
    this.transitionDuration = 1600;
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.timer.update();
    const elapsedTime = this.timer.getElapsed();

    // 1. Update Monitor Screen Texture
    this.updateScreenTexture(elapsedTime);

    // 2. Camera Motion
    if (!this.isTransitioning && !this.isEntered) {
      // Idle Sway & Subtle Mouse Tilt
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

      // Smooth Quintic Easing: 1 - (1 - t)^5
      const ease = t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;

      if (!this.reverseTransition) {
        // Zooming IN towards monitor
        this.camera.position.lerpVectors(this.idlePos, this.monitorPos, ease);
        this.camera.lookAt(
          new THREE.Vector3().lerpVectors(this.idleFocal, this.monitorFocal, ease)
        );

        // When zoom passes 70%, smoothly fade out the room overlay
        if (t > 0.70) {
          const fadeProgress = (t - 0.70) / 0.30;
          this.container.style.opacity = String(Math.max(0, 1.0 - fadeProgress));
        }

        if (t >= 1.0) {
          this.isTransitioning = false;
          this.isEntered = true;
          this.container.style.opacity = '0';
          this.container.style.pointerEvents = 'none';
          setTimeout(() => {
            if (this.isEntered) this.container.style.display = 'none';
          }, 350);
        }
      } else {
        // Zooming OUT back to desk
        this.camera.position.lerpVectors(this.monitorPos, this.idlePos, ease);
        this.camera.lookAt(
          new THREE.Vector3().lerpVectors(this.monitorFocal, this.idleFocal, ease)
        );

        // Fade container back in immediately
        this.container.style.opacity = '1';

        if (t >= 1.0) {
          this.isTransitioning = false;
          this.reverseTransition = false;
          this.isEntered = false;
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
