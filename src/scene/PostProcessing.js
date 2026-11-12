import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CRTShader } from './CRTShader.js';

export class PostProcessingManager {
  constructor(renderer, scene, camera, width, height) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.width = width;
    this.height = height;

    // Create render target with float format for HDR bloom
    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      colorSpace: THREE.SRGBColorSpace,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      samples: Math.min(renderer.capabilities.maxSamples || 4, 4)
    });

    this.composer = new EffectComposer(renderer, renderTarget);

    // 1. Base scene render pass
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    // 2. Cyber bloom pass for glowing particles & lights
    // Moderate threshold & strength keeps the image sharp while making lights pop
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.65,  // strength
      0.4,   // radius
      0.82   // threshold
    );
    this.composer.addPass(this.bloomPass);

    // 3. Custom CRT Camcorder & Chromatic Aberration pass
    this.crtPass = new ShaderPass(CRTShader);
    this.crtPass.uniforms.uResolution.value.set(width, height);
    this.composer.addPass(this.crtPass);

    // 4. Final Output tone mapping pass
    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;
    this.composer.setSize(width, height);
    if (this.bloomPass.resolution) {
      this.bloomPass.resolution.set(width, height);
    }
    if (this.crtPass && this.crtPass.uniforms.uResolution) {
      this.crtPass.uniforms.uResolution.value.set(width, height);
    }
  }

  setGlitch(amount) {
    if (this.crtPass) {
      this.crtPass.uniforms.uGlitch.value = amount;
    }
  }

  render(time) {
    if (this.crtPass) {
      this.crtPass.uniforms.uTime.value = time;
    }
    this.composer.render();
  }
}

