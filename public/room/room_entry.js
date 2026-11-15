import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class RoomIntro {
  constructor() {
    this.container = document.getElementById('henry-room-container');
    this.canvas = document.getElementById('henry-room-canvas');
    if (!this.container || !this.canvas) return;

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    // States: 
    // 1. 'idle' (Initial wide view with "Click anywhere to begin", matching original site)
    // 2. 'desk' (Close-up 3D PC desk view)
    // 3. 'monitor' (Fullscreen interactive 3D WebGPU CRT portfolio)
    this.state = 'idle';
    this.isTransitioning = false;
    this.hovered = false;
    this.hasEntered = false; // Tracks if user has entered the portfolio at least once

    // Real-Time Active Session State (Maintains continuous flow of what user opens)
    this.activeSession = {
      section: 'HERO',
      num: null,
      title: 'VANSH SHARMA',
      subtitle: '// PORTFOLIO ©2026',
      tags: ['WEBGPU ENGINE: ONLINE', '05 PROJECTS READY'],
      desc: 'INDEPENDENT DESIGN ENGINEER BUILDING STUNNING WEBSITES FOR AMBITIOUS STARTUPS AND WORLDWIDE BRANDS',
      telemetry: '> WEBGPU ENGINE: ONLINE | SELECTED WORK: 05 PROJECTS READY',
      progress: 0
    };

    // Theme: 'light' (default matching Henry's original room) or 'dark'
    this.theme = localStorage.getItem('room_theme') || 'light';

    // 1. Scene, Camera, Renderer
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(35, this.width / this.height, 100, 100000);
    
    // Camera Keyframes (Coordinates matching Henry Heffernan's isometric room)
    this.keyframes = {
      // Wide room view: desk sitting in center with "Click anywhere to begin"
      idle: {
        pos: new THREE.Vector3(-20000, 12000, 20000),
        focal: new THREE.Vector3(0, -1000, 0)
      },
      // Desk view: perfectly framed 3D PC table with chair, mug, books, plant
      desk: {
        pos: new THREE.Vector3(0, 1800, 5500),
        focal: new THREE.Vector3(0, 500, 0)
      },
      // Monitor view: zoomed right into the CRT screen glass
      monitor: {
        pos: new THREE.Vector3(0, 958, 1720),
        focal: new THREE.Vector3(0, 958, 418)
      }
    };

    this.currentPos = new THREE.Vector3().copy(this.keyframes.idle.pos);
    this.currentFocal = new THREE.Vector3().copy(this.keyframes.idle.focal);
    this.startPos = new THREE.Vector3().copy(this.currentPos);
    this.startFocal = new THREE.Vector3().copy(this.currentFocal);
    this.destPos = new THREE.Vector3().copy(this.currentPos);
    this.destFocal = new THREE.Vector3().copy(this.currentFocal);

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
    this.modelMaterials = [];

    // Apply initial theme
    this.applyTheme(this.theme, false);

    // 3. Dynamic Screen Texture: REAL-TIME SYNCHRONIZED
    this.setupScreenCanvas();

    // 4. Load Models & Precision Screen
    this.loadModels();

    // 5. Setup Events & Live Session Tracker
    this.setupEvents();
    this.setupLiveSessionTracker();

    // 6. Setup Top HUD & Theme Switcher
    this.setupHUD();

    // 7. Render Loop
    this.timer = new THREE.Timer();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    // Global navigation API
    window.__roomIntro = this;
    window.returnToDesk = () => this.transitionTo('desk', 1500);
    window.returnToRoom = () => this.transitionTo('idle', 1600);
    window.toggleRoomTheme = () => this.toggleTheme();
  }

  setupLiveSessionTracker() {
    const updateSession = () => {
      let progress = 0;
      if (window.lenis && typeof window.lenis.progress === 'number') {
        progress = window.lenis.progress;
      } else {
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
      }

      // Check if Menu is open
      const menu = document.querySelector('[data-menu]');
      if (menu && menu.hasAttribute('data-open')) {
        this.activeSession = {
          section: 'MENU',
          num: 'NAV',
          title: 'NAVIGATION MENU',
          subtitle: '// DIRECTORY',
          role: 'EXPLORE PORTFOLIO',
          tags: ['PROJECTS', 'ABOUT', 'CONTACT', 'SOCIALS'],
          desc: 'Selected Work, About Me, Contact Form, GitHub, LinkedIn, and Twitter.',
          telemetry: '> MENU OPEN // CLICK TO RESUME DIRECTORY',
          progress
        };
        return;
      }

      // Progress-based project & section resolution matching the 18.1 viewports
      if (progress < 0.10) {
        this.activeSession = {
          section: 'HERO',
          num: null,
          title: 'VANSH SHARMA',
          subtitle: '// PORTFOLIO ©2026',
          tags: ['WEBGPU ENGINE: ONLINE', '05 PROJECTS READY'],
          desc: 'INDEPENDENT DESIGN ENGINEER BUILDING STUNNING WEBSITES FOR AMBITIOUS STARTUPS AND WORLDWIDE BRANDS',
          telemetry: '> WEBGPU ENGINE: ONLINE | SELECTED WORK: 05 PROJECTS READY',
          progress
        };
      } else if (progress < 0.26) {
        this.activeSession = {
          section: 'NETSENTINEL',
          num: '01 / 05',
          title: 'NETSENTINEL',
          subtitle: 'AUTONOMOUS NOC ENGINE',
          role: 'BACKEND / PYTHON / DEVOPS',
          tags: ['FASTAPI', 'PYTHON', 'DOCKER', 'ITIL P1/P2'],
          desc: 'Production-ready Network Operations Center platform with real-time telemetry polling, topology-aware alarm correlation, and automated ITIL incident ticketing.',
          telemetry: '> NOC TELEMETRY: ACTIVE // TOPOLOGY MAP RESOLVED 100%',
          progress
        };
      } else if (progress < 0.42) {
        this.activeSession = {
          section: 'FILEGENIE',
          num: '02 / 05',
          title: 'FILEGENIE',
          subtitle: 'INTELLIGENT ML FILE ORGANIZER',
          role: 'FULL-STACK / ML / PYTHON',
          tags: ['RANDOMFOREST', '300 TREES', 'FASTAPI', 'REACT 18'],
          desc: 'Intelligent ML-powered file organizer — 300-tree RandomForest ML classifier, FastAPI backend, React 18 frontend, and JWT authentication for teams.',
          telemetry: '> ML MODEL: RANDOMFOREST // ACCURACY 98.4%',
          progress
        };
      } else if (progress < 0.58) {
        this.activeSession = {
          section: 'QUERYGENIE',
          num: '03 / 05',
          title: 'QUERYGENIE',
          subtitle: 'MULTILINGUAL TEXT-TO-SQL AGENT',
          role: 'AI/ML / NLP / PYTHON',
          tags: ['GROQ LLM', 'LANGGRAPH', 'WHISPER', 'MULTI-LANG'],
          desc: 'Multilingual Autonomous Text-to-SQL Agent supporting Hindi, Telugu, Hinglish and English — Groq LLMs, LangGraph self-healing loops, and Whisper voice transcription.',
          telemetry: '> AGENT STATUS: SELF-HEALING LOOP ACTIVE (0.12s)',
          progress
        };
      } else if (progress < 0.74) {
        this.activeSession = {
          section: 'LEXAI',
          num: '04 / 05',
          title: 'LEXAI',
          subtitle: 'LEGAL DOCUMENT INTELLIGENCE',
          role: 'AI/ML / BACKEND / PYTHON',
          tags: ['LEGAL NLP', 'CLAUSE AUDIT', 'CODEQL', 'CI/CD'],
          desc: 'AI-Driven Legal Document Intelligence platform with automated contract analysis, clause extraction, risk flagging, CI/CD, and CodeQL security scanning.',
          telemetry: '> AUDIT: 42 CLAUSES EXTRACTED // CODEQL PASSED',
          progress
        };
      } else if (progress < 0.86) {
        this.activeSession = {
          section: 'INTELLECTA',
          num: '05 / 05',
          title: 'INTELLECTA',
          subtitle: 'MULTI-AGENT RESEARCH ENGINE',
          role: 'AI / MULTI-AGENT / PYTHON',
          tags: ['MULTI-AGENT', 'DEEP RESEARCH', 'SYNTHESIS'],
          desc: 'Autonomous Multi-Agent Research Engine orchestrating specialized AI agents to gather, synthesize, cross-check, and present deep research on any topic.',
          telemetry: '> AGENT ORCHESTRATION: 4 AGENTS SYNTHESIZING',
          progress
        };
      } else if (progress < 0.94) {
        this.activeSession = {
          section: 'ABOUT',
          num: 'INFO',
          title: 'ABOUT ME',
          subtitle: '// VANSH SHARMA — DESIGN ENGINEER',
          tags: ['CREATIVE DEV', '3D / WEBGPU', 'FULL-STACK'],
          desc: 'I design and build websites that make brands memorable. Most websites either look stunning or run well. I build ones that do both, packed with motion and 3D.',
          telemetry: '> SECTION: ABOUT ME // READY FOR COLLABORATION',
          progress
        };
      } else {
        this.activeSession = {
          section: 'CONTACT',
          num: 'CONNECT',
          title: "LET'S TALK ABOUT YOUR PROJECT",
          subtitle: '// GET IN TOUCH',
          tags: ['24HR RESPONSE', 'GLOBAL AVAILABILITY'],
          desc: 'Fill a quick form and I reach out to you in 24 hours. Email: contact.vanshsharma@gmail.com.',
          telemetry: '> CONTACT FORM READY // INBOX CONNECTED',
          progress
        };
      }
    };

    // Listen to Lenis scroll
    const checkLenis = () => {
      if (window.lenis) {
        window.lenis.on('scroll', updateSession);
      } else {
        setTimeout(checkLenis, 300);
      }
    };
    checkLenis();

    window.addEventListener('scroll', updateSession, { passive: true });

    // Listen to project label clicks
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-project-labels] button, [data-project-slide]');
      if (btn) {
        setTimeout(updateSession, 100);
      }
    });
  }

  applyTheme(theme) {
    this.theme = theme;
    localStorage.setItem('room_theme', theme);

    const isDark = theme === 'dark';
    const targetBg = isDark ? new THREE.Color(0x0a0c10) : new THREE.Color(0xdadada);
    const targetModelTint = isDark ? new THREE.Color(0x484d5a) : new THREE.Color(0xffffff);

    this.scene.background = targetBg;
    if (this.container) {
      this.container.style.backgroundColor = isDark ? '#0a0c10' : '#dadada';
    }

    for (const mat of this.modelMaterials) {
      mat.color.copy(targetModelTint);
    }

    // Update HUD toggle button label and styles
    const btn = document.getElementById('room-theme-btn');
    if (btn) {
      btn.innerHTML = isDark ? '☀ LIGHT MODE' : '☾ DARK MODE';
      btn.style.color = '#ffffff';
      btn.style.borderColor = isDark ? 'rgba(255,255,255,0.6)' : '#333333';
    }
  }

  toggleTheme() {
    const nextTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
  }

  setupScreenCanvas() {
    this.screenCanvas = document.createElement('canvas');
    this.screenCanvas.width = 1024;
    this.screenCanvas.height = 768;
    this.screenCtx = this.screenCanvas.getContext('2d');
    this.screenTexture = new THREE.CanvasTexture(this.screenCanvas);
    this.screenTexture.colorSpace = THREE.SRGBColorSpace;

    // Preload authentic high-fidelity captures of every portfolio view
    this.screens = {};
    const screenMap = {
      hero: '/room/screens/hero.jpg',
      netsentinel: '/room/screens/netsentinel.jpg',
      filegenie: '/room/screens/filegenie.jpg',
      querygenie: '/room/screens/querygenie.jpg',
      lexai: '/room/screens/lexai.jpg',
      intellecta: '/room/screens/lexai.jpg',
      about: '/room/screens/about.jpg',
      contact: '/room/screens/contact.jpg'
    };

    for (const [key, src] of Object.entries(screenMap)) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        this.screens[key] = img;
        this.screenTexture.needsUpdate = true;
      };
      this.screens[key] = img;
    }
  }

  updateScreenTexture(time) {
    if (!this.screenCtx) return;
    const ctx = this.screenCtx;
    const w = this.screenCanvas.width;
    const h = this.screenCanvas.height;

    // Seamless session continuity:
    // When returning to desk, show the EXACT section the user was actively browsing!
    let secKey = (this.activeSession && this.activeSession.section)
      ? this.activeSession.section.toLowerCase()
      : 'hero';

    if (!this.screens[secKey]) {
      secKey = 'hero';
    }

    const img = this.screens[secKey];
    if (img && img.complete && img.naturalWidth > 0) {
      // Draw actual live portfolio view directly onto 3D PC monitor
      ctx.drawImage(img, 0, 0, w, h);
    } else if (this.screens.hero && this.screens.hero.complete && this.screens.hero.naturalWidth > 0) {
      ctx.drawImage(this.screens.hero, 0, 0, w, h);
    } else {
      ctx.fillStyle = this.theme === 'dark' ? '#0a0c10' : '#f0f0f0';
      ctx.fillRect(0, 0, w, h);
    }

    // Subtle physical CRT glass curvature vignette
    const vigGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.35, w / 2, h / 2, w * 0.72);
    vigGrad.addColorStop(0, 'rgba(255,255,255,0)');
    vigGrad.addColorStop(1, 'rgba(0,0,0,0.14)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, w, h);

    // Elegant, non-intrusive hover badge (clean monochrome in portfolio typography)
    if (this.hovered && this.state === 'desk') {
      const pillW = 460;
      const pillH = 50;
      const pillX = (w - pillW) / 2;
      const pillY = h - 100;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 25);
        ctx.fill();
      } else {
        ctx.fillRect(pillX, pillY, pillW, pillH);
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.5;
      if (typeof ctx.roundRect === 'function') {
        ctx.stroke();
      } else {
        ctx.strokeRect(pillX, pillY, pillW, pillH);
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.textAlign = 'center';
      const label = this.hasEntered ? `▶ CLICK TO RESUME ${this.activeSession.section}` : '▶ CLICK TO ENTER PORTFOLIO';
      ctx.fillText(label, w / 2, pillY + 31);
    }

    this.screenTexture.needsUpdate = true;
  }

  loadModels() {
    const gltfLoader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    const loadBaked = (glbPath, texturePath, scale = 900) => {
      const texture = textureLoader.load(texturePath);
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        color: this.theme === 'dark' ? new THREE.Color(0x484d5a) : new THREE.Color(0xffffff)
      });
      this.modelMaterials.push(material);

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
    // Fits monitor opening (width: 1130, height: 890, center at y: 958, z: 418, tilt: -3.9 deg)
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

    // Screen Hitbox covering monitor for responsive hover detection
    const hitboxGeo = new THREE.BoxGeometry(1300, 1100, 600);
    const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
    this.hitboxMesh = new THREE.Mesh(hitboxGeo, hitboxMat);
    this.hitboxMesh.position.set(0, 958, 350);
    this.scene.add(this.hitboxMesh);
    this.screenMeshes.push(this.hitboxMesh);
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

      if (!this.isTransitioning && this.state === 'desk') {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const hits = this.raycaster.intersectObjects(this.screenMeshes);

        const prompt = document.getElementById('room-prompt');
        if (hits.length > 0) {
          this.hovered = true;
          document.body.style.cursor = 'pointer';
          if (prompt) {
            prompt.innerText = this.hasEntered 
              ? `[ CLICK DISPLAY TO RESUME ${this.activeSession.section} ]`
              : '[ CLICK COMPUTER TO ENTER FULLSCREEN PORTFOLIO ]';
            prompt.style.borderColor = 'rgba(255, 255, 255, 0.8)';
            prompt.style.color = '#ffffff';
          }
        } else {
          this.hovered = false;
          document.body.style.cursor = 'default';
          if (prompt) {
            prompt.innerText = this.hasEntered
              ? `[ SESSION ACTIVE: ${this.activeSession.section} | CLICK TO RESUME ]`
              : '[ HOVER DISPLAY FOR DIRECT PREVIEW | CLICK TO ENTER ]';
            prompt.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            prompt.style.color = '#ffffff';
          }
        }
      }
    });

    // Click handler:
    // When in 'idle' (wide view): Click anywhere to zoom into 'desk' view!
    // When in 'desk': Click anywhere on computer/screen to zoom into 'monitor' view!
    this.container.addEventListener('click', (e) => {
      if (this.isTransitioning) return;

      if (this.state === 'idle') {
        this.transitionTo('desk', 1700);
      } else if (this.state === 'desk') {
        this.transitionTo('monitor', 1700);
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

    const startPill = document.getElementById('room-start-pill');
    const hud = document.getElementById('room-hud');
    const prompt = document.getElementById('room-prompt');

    if (targetState === 'desk') {
      // NOTE: NEVER call window.scrollTo(0) here!
      // This preserves user's active scroll, modal, and reading spot!
      this.container.style.display = 'block';
      this.container.style.opacity = '1';
      this.container.style.pointerEvents = 'auto';
      this.hovered = false;

      // Hide "Click anywhere to begin" pill, show HUD and desk helper pill
      if (startPill) startPill.style.opacity = '0';
      setTimeout(() => { if (startPill && this.state !== 'idle') startPill.style.display = 'none'; }, 400);
      if (hud) {
        hud.style.opacity = '1';
        hud.style.pointerEvents = 'auto';
      }
      if (prompt) {
        prompt.style.opacity = '1';
        prompt.innerText = this.hasEntered
          ? `[ SESSION ACTIVE: ${this.activeSession.section} | CLICK TO RESUME ]`
          : '[ HOVER DISPLAY FOR DIRECT PREVIEW | CLICK TO ENTER ]';
      }
    } else if (targetState === 'idle') {
      this.container.style.display = 'block';
      this.container.style.opacity = '1';
      this.container.style.pointerEvents = 'auto';
      this.hovered = false;

      if (startPill) {
        startPill.style.display = 'block';
        setTimeout(() => { if (startPill) startPill.style.opacity = '1'; }, 50);
      }
      if (hud) {
        hud.style.opacity = '0';
        hud.style.pointerEvents = 'none';
      }
      if (prompt) prompt.style.opacity = '0';
    } else if (targetState === 'monitor') {
      this.hasEntered = true;
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

    // 1. Update Monitor Screen Texture (Real-time synchronized)
    this.updateScreenTexture(elapsedTime);

    // 2. Camera Motion
    if (!this.isTransitioning) {
      if (this.state === 'idle') {
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
      const elapsed = performance.now() - this.transitionStartTime;
      let t = Math.min(elapsed / this.transitionDuration, 1.0);

      // Smooth Quintic Easing
      const ease = t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;

      this.camera.position.lerpVectors(this.startPos, this.destPos, ease);
      this.currentFocal.lerpVectors(this.startFocal, this.destFocal, ease);
      this.camera.lookAt(this.currentFocal);

      if (this.targetState === 'monitor') {
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
