import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * EnvironmentManager
 * Loads and orchestrates 3D GLTF models, architectural city blocks,
 * robotic installations, and interactive project waypoint beacons.
 */
export class EnvironmentManager {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.cityBlocks = [];
    this.robotArm = null;
    this.beacons = [];

    this.loadModels();
    this.setupWaypoints();
  }

  loadModels() {
    // 1. Load City Block Model
    this.loader.load(
      '/assets/models/city-block.glb',
      (gltf) => {
        const baseMesh = gltf.scene.getObjectByProperty('isMesh', true);
        if (!baseMesh) return;

        // Custom Cyberpunk Metallic Material with Neon Edges
        const cityMaterial = new THREE.MeshStandardMaterial({
          color: 0x080c14,
          metalness: 0.85,
          roughness: 0.25,
          emissive: 0x0a1c24,
          emissiveIntensity: 0.6
        });

        const wireMaterial = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          wireframe: true,
          transparent: true,
          opacity: 0.15
        });

        // Instantiate along left and right sides of the 3D spline canyon
        const zPositions = [-4.0, -11.0, -18.0, -25.0, -32.0];

        zPositions.forEach((z, idx) => {
          // Left block
          const left = new THREE.Group();
          const leftMesh = new THREE.Mesh(baseMesh.geometry, cityMaterial);
          const leftWire = new THREE.Mesh(baseMesh.geometry, wireMaterial);
          left.add(leftMesh);
          left.add(leftWire);
          left.position.set(-5.2, -1.8, z);
          left.scale.set(0.65, 0.65, 0.65);
          left.rotation.y = Math.PI * 0.5;
          this.scene.add(left);
          this.cityBlocks.push(left);

          // Right block
          const right = new THREE.Group();
          const rightMesh = new THREE.Mesh(baseMesh.geometry, cityMaterial);
          const rightWire = new THREE.Mesh(baseMesh.geometry, wireMaterial);
          right.add(rightMesh);
          right.add(rightWire);
          right.position.set(5.2, -1.8, z);
          right.scale.set(0.65, 0.65, 0.65);
          right.rotation.y = -Math.PI * 0.5;
          this.scene.add(right);
          this.cityBlocks.push(right);
        });
      },
      undefined,
      (err) => console.warn('Could not load city-block.glb:', err.message)
    );

    // 2. Load Robot Arm Tile Model
    this.loader.load(
      '/assets/models/robot-arm-tile.glb',
      (gltf) => {
        this.robotArm = gltf.scene;
        this.robotArm.position.set(2.8, -0.6, -5.0);
        this.robotArm.scale.set(0.45, 0.45, 0.45);
        this.robotArm.rotation.y = -Math.PI * 0.25;

        // Apply cyber styling to robot arm materials
        this.robotArm.traverse((child) => {
          if (child.isMesh) {
            child.material.metalness = 0.9;
            child.material.roughness = 0.2;
            if (child.material.emissive) {
              child.material.emissive.set(0x4ee3c2);
              child.material.emissiveIntensity = 0.8;
            }
          }
        });

        this.scene.add(this.robotArm);
      },
      undefined,
      (err) => console.warn('Could not load robot-arm-tile.glb:', err.message)
    );
  }

  setupWaypoints() {
    // 3D Waypoint Pods positioned directly at project coordinate stops
    const projectWaypoints = [
      { pos: new THREE.Vector3(1.2, 0.4, -4.5), color: 0x4ee3c2, label: '01' },
      { pos: new THREE.Vector3(-1.0, -0.4, -12.5), color: 0x38bdf8, label: '02' },
      { pos: new THREE.Vector3(1.0, 0.3, -20.5), color: 0x818cf8, label: '03' }
    ];

    projectWaypoints.forEach((wp) => {
      const group = new THREE.Group();
      group.position.copy(wp.pos);

      // A. Rotating Outer Reticle Rings
      const ringGeo = new THREE.RingGeometry(1.6, 1.64, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: wp.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI * 0.5;
      group.add(ring);

      const subRingGeo = new THREE.RingGeometry(1.2, 1.22, 32);
      const subRing = new THREE.Mesh(subRingGeo, ringMat);
      subRing.rotation.x = Math.PI * 0.5;
      group.add(subRing);

      // B. Floating Wireframe Core
      const coreGeo = new THREE.IcosahedronGeometry(0.55, 1);
      const coreMat = new THREE.MeshBasicMaterial({
        color: wp.color,
        wireframe: true,
        transparent: true,
        opacity: 0.75
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      group.add(core);

      // C. Vertical Beacon Data Stream Line
      const beamGeo = new THREE.CylinderGeometry(0.015, 0.015, 6.0, 8);
      const beamMat = new THREE.MeshBasicMaterial({
        color: wp.color,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = 1.5;
      group.add(beam);

      this.scene.add(group);
      this.beacons.push({ group, ring, subRing, core, beam, baseColor: wp.color });
    });
  }

  update(time, scrollProgress) {
    // 1. Animate Waypoint Beacons
    this.beacons.forEach((b, idx) => {
      b.core.rotation.y = time * (0.6 + idx * 0.2);
      b.core.rotation.x = time * 0.4;
      b.ring.rotation.z = -time * 0.35;
      b.subRing.rotation.z = time * 0.55;

      // Pulse beacon height
      const pulse = 1.0 + 0.15 * Math.sin(time * 3.0 + idx);
      b.core.scale.set(pulse, pulse, pulse);
    });

    // 2. Animate Robot Arm Idle Motion
    if (this.robotArm) {
      this.robotArm.rotation.y = -Math.PI * 0.25 + 0.08 * Math.sin(time * 0.8);
      this.robotArm.position.y = -0.6 + 0.05 * Math.cos(time * 1.2);
    }
  }
}
