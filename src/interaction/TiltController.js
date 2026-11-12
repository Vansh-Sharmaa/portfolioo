/**
 * TiltController
 * Tracks mouse position and device gyroscope orientation
 * to provide a 3D parallax holographic tilt effect.
 */
export class TiltController {
  constructor() {
    this.target = { x: 0, y: 0 };
    this.current = { x: 0, y: 0 };
    this.damp = 0.08;
    this.isMotionEnabled = false;

    this.onPointerMove = this.onPointerMove.bind(this);
    this.onDeviceOrientation = this.onDeviceOrientation.bind(this);

    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
  }

  onPointerMove(e) {
    // Map pointer to -1.0 to 1.0 (with 0.0 at screen center)
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = -(e.clientY / window.innerHeight) * 2 + 1;
    this.target.x = nx;
    this.target.y = ny;
  }

  enableMotion() {
    if (typeof DeviceOrientationEvent !== 'undefined') {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(state => {
            if (state === 'granted') {
              window.addEventListener('deviceorientation', this.onDeviceOrientation, { passive: true });
              this.isMotionEnabled = true;
            }
          })
          .catch(() => {});
      } else {
        window.addEventListener('deviceorientation', this.onDeviceOrientation, { passive: true });
        this.isMotionEnabled = true;
      }
    }
  }

  onDeviceOrientation(e) {
    if (e.gamma !== null && e.beta !== null) {
      // Gamma is left/right (-90 to 90), Beta is front/back (-180 to 180)
      this.target.x = Math.max(-1, Math.min(1, e.gamma / 30.0));
      this.target.y = Math.max(-1, Math.min(1, (e.beta - 45.0) / 30.0));
    }
  }

  update() {
    this.current.x += (this.target.x - this.current.x) * this.damp;
    this.current.y += (this.target.y - this.current.y) * this.damp;
    return this.current;
  }
}

