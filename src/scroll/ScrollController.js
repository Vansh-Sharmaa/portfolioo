/**
 * Smooth Virtual Scroll Controller
 * Bridges page scroll to a normalized 0.0 - 1.0 progress value
 * with exponential damping and velocity tracking.
 */
export class ScrollController {
  constructor(options = {}) {
    this.container = options.container || window;
    this.lerpFactor = options.lerpFactor || 0.065;
    this.targetProgress = 0.0;
    this.currentProgress = 0.0;
    this.velocity = 0.0;
    this.previousProgress = 0.0;

    this.onProgressCallbacks = new Set();
    this.onSectionCallbacks = new Set();

    this.sections = [
      { id: 'hero', range: [0.0, 0.2] },
      { id: 'project-1', range: [0.2, 0.45] },
      { id: 'project-2', range: [0.45, 0.68] },
      { id: 'project-3', range: [0.68, 0.88] },
      { id: 'contact', range: [0.88, 1.0] }
    ];
    this.currentSection = 'hero';

    this.onScroll = this.onScroll.bind(this);
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.updateMaxScroll();
    window.addEventListener('resize', () => this.updateMaxScroll());
  }

  updateMaxScroll() {
    this.maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
  }

  onScroll() {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    this.targetProgress = Math.min(1.0, Math.max(0.0, scrollY / this.maxScroll));
  }

  onProgress(fn) {
    this.onProgressCallbacks.add(fn);
  }

  onSection(fn) {
    this.onSectionCallbacks.add(fn);
  }

  update() {
    // Smooth exponential damping
    const delta = this.targetProgress - this.currentProgress;
    this.currentProgress += delta * this.lerpFactor;

    // Velocity computation for dynamic effects (e.g. glitch on fast scroll)
    this.velocity = Math.abs(this.currentProgress - this.previousProgress);
    this.previousProgress = this.currentProgress;

    // Detect section transition
    const active = this.sections.find(
      s => this.currentProgress >= s.range[0] && this.currentProgress <= s.range[1]
    );
    if (active && active.id !== this.currentSection) {
      this.currentSection = active.id;
      this.onSectionCallbacks.forEach(cb => cb(this.currentSection));
    }

    this.onProgressCallbacks.forEach(cb => cb(this.currentProgress, this.velocity));
    return this.currentProgress;
  }
}

