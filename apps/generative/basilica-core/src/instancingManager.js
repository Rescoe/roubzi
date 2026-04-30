// BASILICA // CORE — Instancing Manager
// 7 états visibles. ENERGY + CRYSTAL = ShaderMaterial custom.
// Interaction lights pool. animateEnergy() conservé pour compatibilité main.js.

import * as THREE from 'three';
import { CellState } from './traits.js';
import { WORLD } from './config.js';

const { SIZE_X, SIZE_Y, SIZE_Z, VOXEL_SIZE } = WORLD;
const TOTAL = SIZE_X * SIZE_Y * SIZE_Z;

const VISIBLE_STATES = [
  CellState.RAW_VOXEL,
  CellState.MUTATED,
  CellState.ENERGY,
  CellState.RUIN,
  CellState.CRYSTAL,
  CellState.RITUAL,
  CellState.SEED,
];

// ─── ENERGY Shader ────────────────────────────────────────────────────────────
const ENERGY_VERT = /* glsl */`
  uniform float uTime;
  uniform float uPulse;
  varying vec3  vWorldPos;
  varying vec3  vNormal;
  varying float vDistort;

  float hash(float n) { return fract(sin(n) * 43758.5453); }

  void main() {
    vNormal = normalMatrix * normal;
    vec3 iPos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
    float seed  = hash(iPos.x * 7.3 + iPos.y * 13.1 + iPos.z * 5.7);
    float freq  = 2.6 + seed * 1.6;
    float phase = seed * 6.28;
    float amp   = 0.055 + uPulse * 0.045;
    vec3 disp   = position;
    disp += normal * sin(uTime * freq + phase + position.y * 3.8) * amp;
    disp += normal * cos(uTime * freq * 0.65 + phase) * amp * 0.45;
    vDistort    = sin(uTime * freq + phase) * 0.5 + 0.5;
    vec4 wp     = instanceMatrix * vec4(disp, 1.0);
    vWorldPos   = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const ENERGY_FRAG = /* glsl */`
  uniform float uTime;
  uniform float uPulse;
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform vec3  uEmissive;
  varying vec3  vWorldPos;
  varying vec3  vNormal;
  varying float vDistort;

  void main() {
    vec3  norm    = normalize(vNormal);
    vec3  viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = pow(1.0 - max(0.0, dot(norm, viewDir)), 2.6);
    float t       = vDistort * 0.65 + uPulse * 0.35;
    vec3  base    = mix(uColorA, uColorB, t);
    vec3  emit    = uEmissive * (0.75 + uPulse * 0.65) + uColorB * fresnel * 1.6;
    float scan    = sin(vWorldPos.y * 16.0 + uTime * 4.2) * 0.035 + 0.965;
    vec3  color   = (base + emit) * scan;
    gl_FragColor  = vec4(color, 0.80 + fresnel * 0.20);
  }
`;

// ─── CRYSTAL Shader ───────────────────────────────────────────────────────────
const CRYSTAL_VERT = /* glsl */`
  varying vec3  vNormal;
  varying vec3  vWorldPos;
  varying float vFacet;

  void main() {
    vNormal = normalMatrix * normal;
    vec3 qn  = floor(normal * 2.0) / 2.0;
    vFacet   = dot(qn, vec3(1.0, 2.3, 0.7));
    vec4 wp  = instanceMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const CRYSTAL_FRAG = /* glsl */`
  uniform float uTime;
  uniform vec3  uColor;
  uniform vec3  uEmissive;
  varying vec3  vNormal;
  varying vec3  vWorldPos;
  varying float vFacet;

  void main() {
    vec3  norm    = normalize(vNormal);
    vec3  viewDir = normalize(cameraPosition - vWorldPos);
    float rim     = pow(1.0 - max(0.0, dot(norm, viewDir)), 3.2);
    float shimmer = pow(sin(vFacet * 7.1 + uTime * 0.75) * 0.5 + 0.5, 3.0);
    float scatter = pow(max(0.0, dot(norm, normalize(vec3(1.0, 2.0, 0.5)))), 3.5);
    vec3  base    = uColor * (0.35 + scatter * 0.65);
    vec3  glow    = uEmissive * (rim * 1.1 + shimmer * 0.75);
    gl_FragColor  = vec4(base + glow, 0.86);
  }
`;

export class InstancingManager {
  constructor(scene, archetype, coreEntity) {
    this.scene      = scene;
    this.archetype  = archetype;
    this.coreEntity = coreEntity;

    this.meshes         = {};
    this.cellToInstance = {};
    this.instanceToCell = {};
    this.instanceCount  = {};

    this._geo   = new THREE.BoxGeometry(VOXEL_SIZE * 0.92, VOXEL_SIZE * 0.92, VOXEL_SIZE * 0.92);
    this._dummy = new THREE.Object3D();
    this._offset = new THREE.Vector3(
      -SIZE_X * VOXEL_SIZE * 0.5,
      -SIZE_Y * VOXEL_SIZE * 0.3,
      -SIZE_Z * VOXEL_SIZE * 0.5,
    );

    this._energyUniforms  = null;
    this._crystalUniforms = null;

    // Interaction light pool
    this._lightPool = [];
    this._initLightPool();

    this._initMeshes();
  }

  // ─── Light pool ───────────────────────────────────────────────────────────

  _initLightPool() {
    for (let i = 0; i < 8; i++) {
      const light = new THREE.PointLight(0xffffff, 0, 16, 2.0);
      light.visible = false;
      this.scene.add(light);
      this._lightPool.push({ light, life: 0, maxLife: 1 });
    }
  }

  spawnInteractionLight(worldPos, color, intensity = 4.0) {
    // Pick free slot or oldest
    let slot = this._lightPool.find(s => s.life <= 0);
    if (!slot) slot = this._lightPool.reduce((a, b) => a.life < b.life ? a : b);

    slot.light.position.copy(worldPos);
    slot.light.color.copy(color instanceof THREE.Color ? color : new THREE.Color(color));
    slot.light.intensity = intensity;
    slot.light.visible   = true;
    slot.life    = 1.0;
    slot.maxLife = 1.0;
  }

  _updateLightPool() {
    const decay = 0.015;
    for (const s of this._lightPool) {
      if (s.life <= 0) { s.light.visible = false; continue; }
      s.life -= decay;
      const t = Math.max(0, s.life / s.maxLife);
      s.light.intensity = t * t * 4.0;
      if (s.life <= 0) s.light.visible = false;
    }
  }

  // ─── Material init ────────────────────────────────────────────────────────

  _initMeshes() {
    const arch = this.archetype;

    const matDefs = {
      [CellState.RAW_VOXEL]: () => new THREE.MeshStandardMaterial({
        color:    arch.baseColor,
        roughness: 0.84,
        metalness: 0.03,
      }),
      [CellState.MUTATED]: () => new THREE.MeshStandardMaterial({
        color:             arch.mutatedColor,
        emissive:          arch.mutatedEmissive ?? arch.mutatedColor,
        emissiveIntensity: 0.10,
        roughness:         0.58,
        metalness:         0.16,
      }),
      [CellState.RUIN]: () => new THREE.MeshStandardMaterial({
        color:    arch.ruinColor,
        roughness: 0.97,
        metalness: 0.0,
      }),
      [CellState.SEED]: () => new THREE.MeshStandardMaterial({
        color:             arch.seedColor,
        emissive:          arch.seedEmissive ?? arch.seedColor,
        emissiveIntensity: 0.22,
        roughness:         0.90,
        metalness:         0.02,
        transparent:       true,
        opacity:           0.80,
      }),
      [CellState.RITUAL]: () => new THREE.MeshStandardMaterial({
        color:             arch.ritualColor,
        emissive:          arch.ritualEmissive ?? arch.ritualColor,
        emissiveIntensity: 1.2,
        roughness:         0.18,
        metalness:         0.65,
        transparent:       true,
        opacity:           0.90,
      }),
      [CellState.ENERGY]: () => {
        const cA = new THREE.Color(arch.energyColor);
        const cB = new THREE.Color(arch.energyEmissive ?? arch.energyColor).offsetHSL(0.06, 0.2, 0.12);
        this._energyUniforms = {
          uTime:    { value: 0 },
          uPulse:   { value: 0 },
          uColorA:  { value: cA },
          uColorB:  { value: cB },
          uEmissive:{ value: new THREE.Color(arch.energyEmissive ?? arch.energyColor) },
        };
        return new THREE.ShaderMaterial({
          uniforms:       this._energyUniforms,
          vertexShader:   ENERGY_VERT,
          fragmentShader: ENERGY_FRAG,
          transparent:    true,
          depthWrite:     false,
        });
      },
      [CellState.CRYSTAL]: () => {
        this._crystalUniforms = {
          uTime:    { value: 0 },
          uColor:   { value: new THREE.Color(arch.crystalColor) },
          uEmissive:{ value: new THREE.Color(arch.crystalEmissive ?? arch.crystalColor) },
        };
        return new THREE.ShaderMaterial({
          uniforms:       this._crystalUniforms,
          vertexShader:   CRYSTAL_VERT,
          fragmentShader: CRYSTAL_FRAG,
          transparent:    true,
          depthWrite:     false,
          side:           THREE.DoubleSide,
        });
      },
    };

    for (const state of VISIBLE_STATES) {
      const mat  = matDefs[state]();
      const mesh = new THREE.InstancedMesh(this._geo, mat, TOTAL);
      mesh.count = 0;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.castShadow    = state !== CellState.ENERGY && state !== CellState.CRYSTAL;
      mesh.receiveShadow = state === CellState.RAW_VOXEL || state === CellState.RUIN;
      this.scene.add(mesh);
      this.meshes[state]         = mesh;
      this.cellToInstance[state] = new Int32Array(TOTAL).fill(-1);
      this.instanceToCell[state] = new Int32Array(TOTAL).fill(-1);
      this.instanceCount[state]  = 0;
    }
  }

  // ─── Rebuild / dirty ──────────────────────────────────────────────────────

  rebuild(cells) {
    for (const state of VISIBLE_STATES) {
      this.instanceCount[state] = 0;
      this.cellToInstance[state].fill(-1);
      this.instanceToCell[state].fill(-1);
      this.meshes[state].count = 0;
    }
    for (let x = 0; x < SIZE_X; x++) {
      for (let y = 0; y < SIZE_Y; y++) {
        for (let z = 0; z < SIZE_Z; z++) {
          const idx = this._idx(x, y, z);
          const st  = cells[idx];
          if (VISIBLE_STATES.includes(st)) this._place(st, idx, x, y, z);
        }
      }
    }
    for (const state of VISIBLE_STATES) {
      this.meshes[state].instanceMatrix.needsUpdate = true;
      this.meshes[state].count = this.instanceCount[state];
    }
  }

  applyDirty(cells, dirtySet) {
    if (dirtySet.size === 0) return;

    for (const idx of dirtySet) {
      const x   = Math.floor(idx / (SIZE_Y * SIZE_Z));
      const rem = idx % (SIZE_Y * SIZE_Z);
      const y   = Math.floor(rem / SIZE_Z);
      const z   = rem % SIZE_Z;

      for (const state of VISIBLE_STATES) {
        const slot = this.cellToInstance[state][idx];
        if (slot >= 0) this._remove(state, idx, slot);
      }
      const ns = cells[idx];
      if (VISIBLE_STATES.includes(ns)) this._place(ns, idx, x, y, z);
    }
    for (const state of VISIBLE_STATES) {
      this.meshes[state].instanceMatrix.needsUpdate = true;
      this.meshes[state].count = this.instanceCount[state];
    }
  }

  // ─── Instance management ──────────────────────────────────────────────────

  _place(state, idx, x, y, z) {
    const slot = this.instanceCount[state];
    const mesh = this.meshes[state];

    this._dummy.position.set(
      x * VOXEL_SIZE + this._offset.x,
      y * VOXEL_SIZE + this._offset.y,
      z * VOXEL_SIZE + this._offset.z,
    );

    // Per-state shape variations
    if (state === CellState.CRYSTAL) {
      const h   = 0.80 + (((idx * 1234567) >>> 0) % 60) / 150;
      const rot = (((idx * 987654) >>> 0) % 8) * Math.PI / 4;
      this._dummy.scale.set(h * 0.72, h * 1.5, h * 0.72);
      this._dummy.rotation.set(0, rot, 0);
    } else if (state === CellState.SEED) {
      const s = 0.40 + (((idx * 7654321) >>> 0) % 30) / 100;
      this._dummy.scale.setScalar(s);
      this._dummy.rotation.set(0, 0, 0);
    } else if (state === CellState.RITUAL) {
      const s = 0.96 + (((idx * 2345678) >>> 0) % 6) / 100;
      this._dummy.scale.setScalar(s);
      this._dummy.rotation.set(0, 0, 0);
    } else {
      const s = 0.88 + (((idx * 2654435761) >>> 0) % 100) / 833;
      this._dummy.scale.setScalar(s);
      this._dummy.rotation.set(0, 0, 0);
    }

    this._dummy.updateMatrix();
    mesh.setMatrixAt(slot, this._dummy.matrix);
    this.cellToInstance[state][idx] = slot;
    this.instanceToCell[state][slot] = idx;
    this.instanceCount[state]++;
  }

  _remove(state, idx, slot) {
    const mesh  = this.meshes[state];
    const count = this.instanceCount[state];
    const last  = count - 1;

    if (slot !== last) {
      const lastIdx = this.instanceToCell[state][last];
      const m4 = new THREE.Matrix4();
      mesh.getMatrixAt(last, m4);
      mesh.setMatrixAt(slot, m4);
      this.cellToInstance[state][lastIdx] = slot;
      this.instanceToCell[state][slot]    = lastIdx;
    }

    this.cellToInstance[state][idx] = -1;
    this.instanceToCell[state][last] = -1;
    this.instanceCount[state]--;
  }

  // ─── Animation (every frame) ──────────────────────────────────────────────

  // animateEnergy() kept for backward-compat with main.js calls
  animateEnergy(time) {
    this.animate(time, null);
  }

  animate(time, phase) {
    if (this._energyUniforms) {
      this._energyUniforms.uTime.value  = time;
      this._energyUniforms.uPulse.value = Math.sin(time * 2.2) * 0.5 + 0.5;
    }
    if (this._crystalUniforms) {
      this._crystalUniforms.uTime.value = time;
    }

    // RITUAL pulse — stronger in RITUAL phase
    const ritualMesh = this.meshes[CellState.RITUAL];
    if (ritualMesh && ritualMesh.count > 0 && ritualMesh.material.emissiveIntensity !== undefined) {
      const p     = Math.sin(time * 3.5) * 0.5 + 0.5;
      const boost = phase === 'RITUAL' ? 1.0 : 0.40;
      ritualMesh.material.emissiveIntensity = 0.7 + p * 1.3 * boost;
    }

    // MUTATED breathe
    const mutMesh = this.meshes[CellState.MUTATED];
    if (mutMesh && mutMesh.count > 0 && mutMesh.material.emissiveIntensity !== undefined) {
      mutMesh.material.emissiveIntensity = 0.06 + Math.sin(time * 0.85) * 0.06;
    }

    // SEED flicker
    const seedMesh = this.meshes[CellState.SEED];
    if (seedMesh && seedMesh.count > 0 && seedMesh.material.emissiveIntensity !== undefined) {
      seedMesh.material.emissiveIntensity = 0.12 + Math.sin(time * 1.3 + 1.5) * 0.10;
    }

    this._updateLightPool();
  }

  // ─── Utility ──────────────────────────────────────────────────────────────

  voxelToWorld(x, y, z) {
    return new THREE.Vector3(
      x * VOXEL_SIZE + this._offset.x,
      y * VOXEL_SIZE + this._offset.y,
      z * VOXEL_SIZE + this._offset.z,
    );
  }

  dispose() {
    for (const state of VISIBLE_STATES) {
      if (this.meshes[state]) {
        this.meshes[state].geometry.dispose();
        this.meshes[state].material.dispose();
        this.scene.remove(this.meshes[state]);
      }
    }
    for (const s of this._lightPool) this.scene.remove(s.light);
    this._geo.dispose();
  }

  _idx(x, y, z) {
    return x * SIZE_Y * SIZE_Z + y * SIZE_Z + z;
  }
}