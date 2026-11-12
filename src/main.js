import { SceneManager } from './scene/SceneManager.js';
import { ScrollController } from './scroll/ScrollController.js';
import { TiltController } from './interaction/TiltController.js';
import { ScrambleText } from './ui/ScrambleText.js';

class App {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.sceneManager = new SceneManager(this.canvas);
    this.scrollController = new ScrollController({ lerpFactor: 0.075 });
    this.tiltController = new TiltController();
    this.scramblers = ScrambleText.initAll('[data-scramble-text]');

    this.hudSections = document.querySelectorAll('[data-hud-section]');
    this.progressPct = document.getElementById('hudScrollPct');
    this.slideNumber = document.getElementById('hudSlideNumber');

    this.glitchIntensity = 0.0;
    this.initPreloader();
    this.bindEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initPreloader() {
    const preloader = document.getElementById('preloader');
    const loadBar = document.getElementById('loadBar');
    const loadPct = document.getElementById('loadPct');
    const gate = document.getElementById('gate');
    const allowBtn = document.getElementById('btnMotionAllow');
    const declineBtn = document.getElementById('btnMotionDecline');

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 14) + 6;
      if (progress > 100) progress = 100;

      if (loadBar) loadBar.style.width = `${progress}%`;
      if (loadPct) loadPct.innerText = `${String(progress).padStart(3, '0')}%`;

      if (progress >= 100) {
        clearInterval(interval);
        // Show motion consent gate
        setTimeout(() => {
          if (gate) gate.setAttribute('aria-hidden', 'false');
        }, 200);
      }
    }, 45);

    const dismissPreloader = (allowMotion) => {
      if (allowMotion) {
        this.tiltController.enableMotion();
      }
      document.body.classList.remove('is-loading');
      if (preloader) {
        preloader.classList.add('is-hidden');
      }

      // Trigger hero text scramble decrypt
      document.querySelectorAll('#heroContent [data-scramble-text]').forEach(el => {
        const scrambler = this.scramblers.get(el);
        if (scrambler) scrambler.scramble(el, el.getAttribute('data-original-text'));
      });
    };

    if (allowBtn) allowBtn.addEventListener('click', () => dismissPreloader(true));
    if (declineBtn) declineBtn.addEventListener('click', () => dismissPreloader(false));
  }

  bindEvents() {
    // Listen to section changes to update HUD panels and scramble header text
    this.scrollController.onSection((sectionId) => {
      this.hudSections.forEach(section => {
        const matches = section.getAttribute('data-hud-section') === sectionId;
        section.classList.toggle('is-active', matches);

        if (matches) {
          section.querySelectorAll('[data-scramble-text]').forEach(el => {
            const scrambler = this.scramblers.get(el);
            if (scrambler) scrambler.scramble(el, el.getAttribute('data-original-text'));
          });
        }
      });

      // Brief CRT glitch bump on section transition
      this.glitchIntensity = 0.55;
    });

    // Listen to progress to update percentage indicator
    this.scrollController.onProgress((progress, velocity) => {
      if (this.progressPct) {
        this.progressPct.innerText = `${Math.round(progress * 100)}%`;
      }
      // Speed-based glitch spike
      if (velocity > 0.008) {
        this.glitchIntensity = Math.min(1.0, this.glitchIntensity + velocity * 12.0);
      }
    });
  }

  animate() {
    requestAnimationFrame(this.animate);

    // 1. Update Scroll & Tilt
    const scrollProgress = this.scrollController.update();
    const tilt = this.tiltController.update();

    // 2. Decay glitch intensity smoothly
    this.glitchIntensity = Math.max(0.0, this.glitchIntensity - 0.03);

    // 3. Render 3D Scene with Post-Processing
    this.sceneManager.update(scrollProgress, tilt, this.glitchIntensity);
  }
}

// Boot application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
});

