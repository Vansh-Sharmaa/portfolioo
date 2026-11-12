import * as THREE from 'three';

/**
 * CameraPath manages the 3D spline trajectory for continuous scroll flight.
 * Uses Catmull-Rom cubic splines for both camera eye position and look-at target.
 */
export class CameraPath {
  constructor() {
    // 3D control points along the portfolio flight path (Z goes negative into the distance)
    const eyePoints = [
      new THREE.Vector3(0.0, 0.0, 8.5),     // 0.00: Hero (close-up facing AI bust)
      new THREE.Vector3(0.0, 0.3, 5.0),     // 0.15: Transition into cyber matrix
      new THREE.Vector3(2.2, 0.8, -2.0),    // 0.35: Project 1 - Job Agent Pod
      new THREE.Vector3(-2.0, -0.2, -10.0), // 0.55: Project 2 - ResearchMind Pod
      new THREE.Vector3(1.8, 0.5, -18.0),   // 0.75: Project 3 - LexAI Pod
      new THREE.Vector3(0.0, -0.3, -26.0),  // 0.90: Contact Stage transition
      new THREE.Vector3(0.0, 0.0, -32.0)    // 1.00: Terminal / Final view
    ];

    const targetPoints = [
      new THREE.Vector3(0.0, 0.0, 0.0),     // Facing the bust center
      new THREE.Vector3(0.0, 0.0, -4.0),    // Facing down the cyber tunnel
      new THREE.Vector3(1.2, 0.4, -4.5),    // Focused on Project 1
      new THREE.Vector3(-1.0, -0.4, -12.5), // Focused on Project 2
      new THREE.Vector3(1.0, 0.3, -20.5),   // Focused on Project 3
      new THREE.Vector3(0.0, -0.2, -28.0),  // Focused on Terminal
      new THREE.Vector3(0.0, 0.0, -36.0)    // Focused into infinite horizon
    ];

    this.eyeSpline = new THREE.CatmullRomCurve3(eyePoints, false, 'catmullrom', 0.5);
    this.targetSpline = new THREE.CatmullRomCurve3(targetPoints, false, 'catmullrom', 0.5);

    this.currentEye = new THREE.Vector3();
    this.currentTarget = new THREE.Vector3();
    this.smoothedEye = new THREE.Vector3().copy(eyePoints[0]);
    this.smoothedTarget = new THREE.Vector3().copy(targetPoints[0]);
  }

  /**
   * Update camera position and orientation based on normalized scroll progress (0..1)
   * and mouse/gyro tilt offsets.
   */
  updateCamera(camera, progress, tilt = { x: 0, y: 0 }, damp = 0.08) {
    const t = THREE.MathUtils.clamp(progress, 0.0, 1.0);

    this.eyeSpline.getPointAt(t, this.currentEye);
    this.targetSpline.getPointAt(t, this.currentTarget);

    // Apply interactive parallax tilt
    const parallaxEyeX = this.currentEye.x + tilt.x * 0.45;
    const parallaxEyeY = this.currentEye.y + tilt.y * 0.35;
    const parallaxEyeZ = this.currentEye.z;

    const parallaxTargetX = this.currentTarget.x + tilt.x * 0.2;
    const parallaxTargetY = this.currentTarget.y + tilt.y * 0.15;
    const parallaxTargetZ = this.currentTarget.z;

    // Smooth lerp for silky cinematic glide
    this.smoothedEye.x += (parallaxEyeX - this.smoothedEye.x) * damp;
    this.smoothedEye.y += (parallaxEyeY - this.smoothedEye.y) * damp;
    this.smoothedEye.z += (parallaxEyeZ - this.smoothedEye.z) * damp;

    this.smoothedTarget.x += (parallaxTargetX - this.smoothedTarget.x) * damp;
    this.smoothedTarget.y += (parallaxTargetY - this.smoothedTarget.y) * damp;
    this.smoothedTarget.z += (parallaxTargetZ - this.smoothedTarget.z) * damp;

    camera.position.copy(this.smoothedEye);
    camera.lookAt(this.smoothedTarget);
  }
}

