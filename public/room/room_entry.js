import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class RoomIntro {
  constructor() {
    this.container = document.getElementById('henry-room-container');
    this.canvas = document.getElementById('henry-room-canvas');
    if (!this.container || !this.canvas) return;

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    // States: 'idle' (wide room) -> 'desk' (desk view) -> 'monitor' (fullscreen portfolio)
    this.state = 'idle';
    this.isTransitioning = false;
    this.transitionStartTime = 0;
    this.transitionDuration = 1600;
    
    // 1. Scene, Camera, Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdadada);

    this.camera = new THREE.PerspectiveCamera(35, this.width / this.height, 100, 100000);
    
    // Camera Keyframes (Exact coordinates from Henry Heffernan's CameraKeyframes.ts)
    this.keyframes = {
      idle: {
        pos: new THREE.Vector3(-20000, 12000, 20000),
        focal: new THREE.Vector3(0, -1000, 0)
      },
      desk: {
        // Close-up isometric desk view showing keyboard, mouse, mug, papers, and monitor
        pos: new THREE.Vector3(0, 1800, 5500),
        focal: new THREE.Vector3(0, 500, 0)
      },
      monitor: {
        // Zoomed straight into the CRT screen glass
        pos: new THREE.Vector3(0, 958, 1720),
        focal: new THREE.Vector3(0, 958, 418)
      }
    };

    this.currentPos = new THREE.Vector3().copy(this.keyframes.idle.pos);
    this.currentFocal = new THREE.Vector3().copy(this.keyframes.idle.focal);
    this.startPos = new THREE.Vector3().copy(this.currentPos);
    this.startFocal = new THREE.Vector3().copy(this.currentFocal);
    this.targetPos = new THREE.Vector3().copy(this.currentPos);
    this.targetFocal = new THREE.Vector3().copy(this.currentFocal);

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

    // 2. Mouse & Raycaster
    this.mouse = new THREE.Vector2(-10, -10);
    this.rawMouse = { x: 0, y: 0 };
    this.raycaster = new THREE.Raycaster();
    this.screenMeshes = [];
    this.deskMeshes = [];

    // 3. Dynamic Retro Windows 98 Browser Screen Texture
    this.setupScreenCanvas();

    // 4. Load Models & Screen
    this.loadModels();

    // 5. Setup Events
    this.setupEvents();

    // 6. Setup Top HUD Clock
    this.setupHUD();

    // 7. Render Loop
    this.timer = new THREE.Timer();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    // Global navigation API
    window.returnToDesk = () => this.transitionTo('desk', 1500);
    window.returnToRoom = () => this.transitionTo('idle', 1600);
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

    // 1. Windows 95/98 Window Outer Frame
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(0, 0, w, h);

    // Outer 3D Bevel (raised window edge)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, 3);
    ctx.fillRect(0, 0, 3, h);
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, h - 3, w, 3);
    ctx.fillRect(w - 3, 0, 3, h);

    // 2. Classic Windows Gradient Title Bar
    const titleGrad = ctx.createLinearGradient(4, 4, w - 8, 4);
    titleGrad.addColorStop(0, '#000080'); // Classic Navy
    titleGrad.addColorStop(1, '#1084d0'); // Windows Cyan
    ctx.fillStyle = titleGrad;
    ctx.fillRect(4, 4, w - 8, 36);

    // Title text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    ctx.fillText('🗔  Vansh Sharma — Netscape Portfolio [v2.0]', 14, 29);

    // 3. Window Buttons (_ □ ✕)
    const drawWinBtn = (x, sym) => {
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(x, 8, 28, 26);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, 8, 28, 2);
      ctx.fillRect(x, 8, 2, 26);
      ctx.fillStyle = '#404040';
      ctx.fillRect(x, 32, 28, 2);
      ctx.fillRect(x + 26, 8, 2, 26);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(sym, x + 14, 26);
      ctx.textAlign = 'left';
    };
    drawWinBtn(w - 96, '_');
    drawWinBtn(w - 64, '□');
    drawWinBtn(w - 32, '✕');

    // 4. Menu Bar
    ctx.fillStyle = '#000000';
    ctx.font = '16px "Segoe UI", Tahoma, sans-serif';
    ctx.fillText('File    Edit    View    Go    Bookmarks    Options    Directory    Help', 16, 62);
    ctx.fillStyle = '#808080';
    ctx.fillRect(4, 72, w - 8, 1);

    // 5. URL Address Bar
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.fillText('Location:', 14, 96);
    // Inset URL input box
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(90, 80, w - 104, 25);
    ctx.fillStyle = '#404040';
    ctx.fillRect(90, 80, w - 104, 2);
    ctx.fillRect(90, 80, 2, 25);
    ctx.fillStyle = '#000080';
    ctx.font = '15px monospace';
    ctx.fillText('https://vansh-sharmaa.github.io/portfolio3d/', 100, 97);

    // 6. Browser Content Area (White Canvas)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 110, w - 12, h - 142);
    // Inset border for content area
    ctx.fillStyle = '#404040';
    ctx.fillRect(6, 110, w - 12, 2);
    ctx.fillRect(6, 110, 2, h - 142);

    // === WEBPAGE CONTENT (Matching Henry Heffernan's Netscape layout from user image) ===
    // Left Sidebar Column
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(8, 112, 230, h - 146);
    ctx.fillStyle = '#808080';
    ctx.fillRect(238, 112, 1, h - 146);

    // Sidebar: Branding
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 28px "Times New Roman", Times, serif';
    ctx.fillText('Vansh', 26, 160);
    ctx.fillText('Sharma', 26, 192);

    ctx.font = 'italic 16px "Times New Roman", serif';
    ctx.fillStyle = '#555555';
    ctx.fillText('Software ' + new Date().getFullYear(), 26, 218);

    // Sidebar Links
    const links = [
      '• HOME',
      '• ABOUT',
      '• EXPERIENCE',
      '• PROJECTS',
      '   > NETSENTINEL',
      '   > FILEGENIE',
      '   > QUERYGENIE',
      '   > LEXAI',
      '• CONTACT'
    ];
    let linkY = 260;
    ctx.font = 'bold 15px "Segoe UI", Tahoma, sans-serif';
    for (const link of links) {
      ctx.fillStyle = link.startsWith(' ') ? '#0066cc' : '#0000ee';
      ctx.fillText(link, 26, linkY);
      linkY += 26;
    }

    // Right Main Article Pane
    const mainX = 260;
    // Top utility links
    ctx.fillStyle = '#0000ee';
    ctx.font = '15px "Times New Roman", serif';
    ctx.fillText('• [3D WebGPU Edition]   • [Full Screen Mode]   • [GitHub Portfolio]', mainX, 145);
    ctx.fillStyle = '#808080';
    ctx.fillRect(mainX, 155, w - mainX - 30, 1);

    // Article Title
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 30px "Times New Roman", serif';
    ctx.fillText('NetSentinel: Autonomous NOC Engine', mainX, 198);

    // Article Body Text
    ctx.font = '16px "Times New Roman", serif';
    ctx.fillStyle = '#222222';
    ctx.fillText('Production-ready Network Operations Center platform with real-time telemetry,', mainX, 230);
    ctx.fillText('topology-aware alarm correlation, and automated ITIL incident dispatch.', mainX, 252);
    ctx.fillText('Architected using FastAPI, Python, Docker containers, and high-throughput pipelines.', mainX, 274);

    // Interactive Demo / Showcase Graphic Box (Like the game map in Henry's screenshot)
    const boxW = w - mainX - 50;
    const boxH = 220;
    ctx.fillStyle = '#08140e';
    ctx.fillRect(mainX, 295, boxW, boxH);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.strokeRect(mainX, 295, boxW, boxH);

    // Retro animated telemetry grid inside the demo box
    ctx.fillStyle = 'rgba(0, 255, 136, 0.08)';
    for (let gy = 295; gy < 295 + boxH; gy += 16) {
      ctx.fillRect(mainX, gy, boxW, 1);
    }
    for (let gx = mainX; gx < mainX + boxW; gx += 24) {
      ctx.fillRect(gx, 295, 1, boxH);
    }

    // Center pulsating call to action inside the screen!
    const blink = Math.floor(time * 3.0) % 2 === 0;
    ctx.fillStyle = blink ? 'rgba(0, 255, 170, 0.95)' : 'rgba(0, 180, 120, 0.9)';
    ctx.fillRect(mainX + 40, 365, boxW - 80, 60);

    ctx.fillStyle = '#03140a';
    ctx.font = 'bold 22px "Segoe UI", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('▶ CLICK SCREEN TO ENTER 3D CRT PORTFOLIO', mainX + boxW / 2, 402);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#66ffbb';
    ctx.font = '14px monospace';
    ctx.fillText('> NOC TELEMETRY: ACTIVE // TOPOLOGY MAP RESOLVED 100%', mainX + 16, 495);

    // 7. Windows 95 Status Bar at Bottom
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(4, h - 28, w - 8, 24);
    ctx.fillStyle = '#808080';
    ctx.fillRect(4, h - 28, w - 8, 2);
    ctx.fillStyle = '#333333';
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillText('✓ Document: Done (100% loaded)  |  Press Computer to Zoom In', 14, h - 11);

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

    // Load Henry's 3D Models
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
    this.screenMeshes.push(this.screenMesh);

    // Broad Desk Hitbox (triggers zoom from idle -> desk view)
    const deskHitboxGeo = new THREE.BoxGeometry(2200, 1600, 1400);
    const deskHitboxMat = new THREE.MeshBasicMaterial({ visible: false });
    this.deskHitboxMesh = new THREE.Mesh(deskHitboxGeo, deskHitboxMat);
    this.deskHitboxMesh.position.set(0, 800, 400);
    this.scene.add(this.deskHitboxMesh);
    this.deskMeshes.push(this.deskHitboxMesh);
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
      if (this.state === 'monitor' && !this.isTransitioning) return;

      this.rawMouse.x = (e.clientX / this.width) * 2 - 1;
      this.rawMouse.y = -(e.clientY / this.height) * 2 + 1;
      this.mouse.x = this.rawMouse.x;
      this.mouse.y = this.rawMouse.y;

      if (!this.isTransitioning) {
        this.raycaster.setFromCamera(this.mouse, this.camera);

        if (this.state === 'idle') {
          // In idle: hovering over the desk smoothly zooms into DESK VIEW (Stage 2)
          const hits = this.raycaster.intersectObjects(this.deskMeshes);
          if (hits.length > 0) {
            document.body.style.cursor = 'pointer';
            this.transitionTo('desk', 1500);
          } else {
            document.body.style.cursor = 'default';
          }
        } else if (this.state === 'desk') {
          // In desk view: hovering/clicking over screen zooms into FULL MONITOR (Stage 3)
          const hits = this.raycaster.intersectObjects(this.screenMeshes);
          if (hits.length > 0) {
            document.body.style.cursor = 'pointer';
            const prompt = document.getElementById('room-prompt');
            if (prompt) prompt.innerText = '[ CLICK COMPUTER SCREEN TO ENTER FULL 3D PORTFOLIO ]';
          } else {
            document.body.style.cursor = 'default';
          }
        }
      }
    });

    this.container.addEventListener('click', (e) => {
      if (this.isTransitioning) return;

      if (this.state === 'idle') {
        this.transitionTo('desk', 1500);
      } else if (this.state === 'desk') {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const hits = this.raycaster.intersectObjects(this.screenMeshes);
        // If clicked screen or anywhere on computer in desk view -> zoom into monitor
        this.transitionTo('monitor', 1800);
      }
    });
  }

  transitionTo(targetState, duration = 1600) {
    if (this.state === targetState && !this.isTransitioning) return;

    console.log(`[ROOM] Transitioning: ${this.state} -> ${targetState}`);
    this.targetState = targetState;
    this.isTransitioning = true;
    this.transitionDuration = duration;
    this.transitionStartTime = performance.now();

    this.startPos.copy(this.camera.position);
    this.startFocal.copy(this.currentFocal);

    this.destPos = this.keyframes[targetState].pos;
    this.destFocal = this.keyframes[targetState].focal;

    if (targetState === 'desk' || targetState === 'idle') {
      // Re-enable container
      this.container.style.display = 'block';
      this.container.style.opacity = '1';
      this.container.style.pointerEvents = 'auto';
      const prompt = document.getElementById('room-prompt');
      if (prompt) {
        prompt.innerText = targetState === 'desk' 
          ? '[ CLICK SCREEN TO ENTER FULL PORTFOLIO  |  CLICK AWAY TO ZOOM OUT ]' 
          : '[ HOVER OR CLICK DESK TO EXPLORE ]';
      }
    }
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

  animate() {
    requestAnimationFrame(this.animate);
    this.timer.update();
    const elapsedTime = this.timer.getElapsed();

    // 1. Update Monitor Screen Texture
    this.updateScreenTexture(elapsedTime);

    // 2. Camera Motion
    if (!this.isTransitioning) {
      if (this.state === 'idle') {
        // Idle camera sway & mouse parallax
        const swayX = Math.sin((elapsedTime + 19) * 0.25) * 600;
        const swayY = Math.cos((elapsedTime + 1) * 0.15) * 300;
        const mouseX = this.rawMouse.x * 1200;
        const mouseY = this.rawMouse.y * 600;

        this.currentPos.x = this.keyframes.idle.pos.x + swayX + mouseX;
        this.currentPos.y = this.keyframes.idle.pos.y + swayY + mouseY;
        this.currentPos.z = this.keyframes.idle.pos.z;

        this.currentFocal.copy(this.keyframes.idle.focal);
        this.camera.position.copy(this.currentPos);
        this.camera.lookAt(this.currentFocal);
      } else if (this.state === 'desk') {
        // Desk camera subtle mouse tilt (smooth interactive feeling on desk)
        const mouseX = this.rawMouse.x * 250;
        const mouseY = this.rawMouse.y * 150;

        this.currentPos.x = this.keyframes.desk.pos.x + mouseX;
        this.currentPos.y = this.keyframes.desk.pos.y + mouseY;
        this.currentPos.z = this.keyframes.desk.pos.z;

        this.currentFocal.set(
          this.keyframes.desk.focal.x + mouseX * 0.5,
          this.keyframes.desk.focal.y + mouseY * 0.5,
          this.keyframes.desk.focal.z
        );
        this.camera.position.copy(this.currentPos);
        this.camera.lookAt(this.currentFocal);
      }
    } else {
      // Interpolating between keyframes
      const elapsed = performance.now() - this.transitionStartTime;
      let t = Math.min(elapsed / this.transitionDuration, 1.0);

      // Smooth Quintic Easing: 1 - (1 - t)^5
      const ease = t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;

      this.camera.position.lerpVectors(this.startPos, this.destPos, ease);
      this.currentFocal.lerpVectors(this.startFocal, this.destFocal, ease);
      this.camera.lookAt(this.currentFocal);

      if (this.targetState === 'monitor') {
        // When nearing screen, fade out container
        if (t > 0.70) {
          const fadeProgress = (t - 0.70) / 0.30;
          this.container.style.opacity = String(Math.max(0, 1.0 - fadeProgress));
        }

        if (t >= 1.0) {
          this.state = 'monitor';
          this.isTransitioning = false;
          this.container.style.opacity = '0';
          this.container.style.pointerEvents = 'none';
          setTimeout(() => {
            if (this.state === 'monitor') this.container.style.display = 'none';
          }, 350);
        }
      } else {
        // Transitioning to desk or idle: keep visible
        this.container.style.opacity = '1';

        if (t >= 1.0) {
          this.state = this.targetState;
          this.isTransitioning = false;
        }
      }
    }

    if (this.state !== 'monitor' || this.isTransitioning) {
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
