// BASILICA // CORE — Renderer (BALANCED MID-VOLUMETRIC)

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { CAMERA, RENDER } from './config.js';
import { Doctrine } from './traits.js';

export class Renderer {
  constructor(container) {
    this.container = container;
    this.width = container.clientWidth;
    this.height = container.clientHeight;

    this._initRenderer();
    this._initScene();
    this._initCamera();
    this._initControls();
    this._initPostProcessing();

    this._lights = {};

    this.cameraMode = 'orbit';
    this._cinematicAngle = 0;

    window.addEventListener('resize', () => this._onResize());
  }

  // -------------------------
  // INIT
  // -------------------------

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92; // ↓ équilibré

    this.container.appendChild(this.renderer.domElement);
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07090d);
  }

  _initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      CAMERA.FOV,
      this.width / this.height,
      CAMERA.NEAR,
      CAMERA.FAR
    );

    this.camera.position.set(32, 19, 32);
    this.camera.lookAt(0, 3, 0);
  }

  _initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.04;
    this.controls.minDistance = CAMERA.ORBIT_RADIUS_MIN;
    this.controls.maxDistance = CAMERA.ORBIT_RADIUS_MAX;
    this.controls.maxPolarAngle = Math.PI * 0.72;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.11;
    this.controls.target.set(0, 2.8, 0);
  }

  _initPostProcessing() {
    this.composer = new EffectComposer(this.renderer);

    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    // ✅ Bloom contrôlé (plus sélectif)
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.width, this.height),
      0.45,  // strength ↓
      0.6,   // radius ↓
      0.72   // threshold ↑
    );

    this.composer.addPass(this.bloomPass);
  }

  // -------------------------
  // SEEDED VARIATION
  // -------------------------

  _seededRandom(seed) {
    let x = Math.sin(seed * 9999.91) * 43758.5453;
    return x - Math.floor(x);
  }

  _seededRange(seed, min, max) {
    return min + (max - min) * this._seededRandom(seed);
  }

  _getArchetypeProfile(id) {
    return {
      CATHEDRAL: { exposure: 0.95, lightMult: 0.95, fogMult: .95 },
      OSSUARY: { exposure: 1.0, lightMult: 0.95, fogMult: 0.95 },
      RIFT: { exposure: 1.1, lightMult: 1.05, fogMult: 0.9 },
      DEEP_FORGE: { exposure: 1.08, lightMult: 1.05, fogMult: 0.92 },
      TIDAL_VAULT: { exposure: 1.12, lightMult: 1.06, fogMult: 0.9 },
    }[id] || { exposure: 1.0, lightMult: 1.0, fogMult: 1.0 };
  }

  // -------------------------
  // LIGHTING
  // -------------------------

  setupLights(coreEntityDef, archetype) {
    const toRemove = [];
    this.scene.traverse(obj => {
      if (obj.isLight) toRemove.push(obj);
    });
    toRemove.forEach(l => this.scene.remove(l));

    this._lights = {};

    const ambient = new THREE.AmbientLight(
      archetype?.ambientColor ?? 0x10141c,
      archetype?.ambientIntensity ?? 0.8
    );
    this.scene.add(ambient);
    this._lights.ambient = ambient;

    const dir = new THREE.DirectionalLight(
      archetype?.dirLightColor ?? 0xffeed8,
      archetype?.dirLightIntensity ?? 1.0
    );
    dir.position.set(24, 42, -18);
    dir.castShadow = true;
    dir.shadow.mapSize.set(RENDER.SHADOW_MAP_SIZE, RENDER.SHADOW_MAP_SIZE);
    this.scene.add(dir);
    this._lights.dir = dir;

    const fill = new THREE.DirectionalLight(
      archetype?.fillColor ?? 0x1f2d3a,
      archetype?.fillIntensity ?? 0.6
    );
    fill.position.set(-20, 16, 24);
    this.scene.add(fill);
    this._lights.fill = fill;

    const hemi = new THREE.HemisphereLight(
      archetype?.hemiSkyColor ?? 0x6a8fbf,
      archetype?.hemiGroundColor ?? 0x1a1a1a,
      archetype?.hemiIntensity ?? 0.9
    );
    this.scene.add(hemi);
    this._lights.hemi = hemi;

    const key = new THREE.DirectionalLight(0xffffff, 0.3);
    key.position.set(0, 25, 10);
    this.scene.add(key);
    this._lights.key = key;

    if (coreEntityDef.lightIntensity > 0) {
      const core = new THREE.PointLight(
        coreEntityDef.lightColor,
        coreEntityDef.lightIntensity,
        55,
        1.5
      );
      core.position.set(0, 6, 0);
      this.scene.add(core);
      this._lights.core = core;

      const spread = new THREE.PointLight(
        coreEntityDef.glowColor,
        coreEntityDef.lightIntensity * 0.42,
        90,
        2.0
      );
      spread.position.set(0, 4, 0);
      this.scene.add(spread);
      this._lights.coreSpread = spread;
    }

    const under = new THREE.PointLight(0x223040, 0.35, 70, 2.0);
    under.position.set(0, -8, 0);
    this.scene.add(under);
    this._lights.under = under;
  }

  // -------------------------
  // DOCTRINE + BALANCE
  // -------------------------

  // ── Fog + background — appelé après setupLights()
  applyDoctrine(doctrine, archetype) {
    const doc = Doctrine[doctrine] || Doctrine.BONE;
    this.scene.background = new THREE.Color(doc.sky);

    // BONE → fog linéaire (colonnes de lumière lisibles)
    // SACRED_NIGHT → fog exponentiel (profondeur abyssale)
    if (archetype.doctrine === 'BONE') {
      const near = archetype.fogNear ?? 55;
      const far  = archetype.fogFar  ?? 160;
      this.scene.fog = new THREE.Fog(archetype.fogColor, near, far);
    } else {
      const density = 0.0052 * (archetype.fogDensity ?? 1.0);
      this.scene.fog = new THREE.FogExp2(archetype.fogColor, density);
    }

    // Sync ambient sur valeurs archétype
    if (this._lights.ambient) {
      this._lights.ambient.color.set(archetype.ambientColor);
      this._lights.ambient.intensity = archetype.ambientIntensity;
    }
  }

  // -------------------------
  // GROUND
  // -------------------------

  // ── Sol
  addGround(archetype) {
    const geo = new THREE.PlaneGeometry(400, 400);
    const mat = new THREE.MeshStandardMaterial({
      color:       archetype.ruinColor,
      roughness:   1.0,
      metalness:   0.0,
      transparent: true,
      opacity:     0.40,
    });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x     = -Math.PI / 2;
    ground.position.y     = -5.0;
    ground.receiveShadow  = true;
    ground.userData.isGround = true;
    this.scene.add(ground);
  }

  // -------------------------
  // UPDATE / RENDER
  // -------------------------

  
    toggleCameraMode() {
    if (this.cameraMode === 'orbit') {
      this.cameraMode = 'cinematic';
      this.controls.autoRotate = false;
      this.controls.enabled    = false;
    } else {
      this.cameraMode = 'orbit';
      this.controls.autoRotate = true;
      this.controls.enabled    = true;
    }
    return this.cameraMode;
  }

  
  
  update(time, deltaMs) {
    if (this.cameraMode === 'cinematic') {
      this._cinematicAngle += CAMERA.ORBIT_SPEED * deltaMs;

      const r = 52 + Math.sin(time * 0.05) * 7;
      const h = CAMERA.CINEMATIC_HEIGHT + Math.sin(time * 0.03) * 3.5;

      this.camera.position.set(
        Math.cos(this._cinematicAngle) * r,
        h,
        Math.sin(this._cinematicAngle) * r
      );

      this.camera.lookAt(0, 4, 0);
    }

    this.controls.update();
  }

  render() {
    this.composer.render();
  }

  _onResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
  }
}