// BASILICA // CORE — Interaction Router
// 4 modes d'interaction avec conséquences structurelles et visuelles réelles.
// Mémoire de cicatrices persistantes via simulation.scarMap.

import * as THREE from 'three';
import { WORLD, SIMULATION } from './config.js';
import { WorldArchetype, MutationLogic } from './traits.js';

// Interaction modes
const MODE = {
  ENERGY:   'ENERGY',    // dépose de l'énergie, transforme en ENERGY state
  FRACTURE: 'FRACTURE',  // brise la matière en RUIN/EMPTY avec rayons
  RITUAL:   'RITUAL',    // active une zone en état RITUAL
  SEED:     'SEED',      // sème des cellules SEED
};
const MODE_ORDER = [MODE.ENERGY, MODE.FRACTURE, MODE.RITUAL, MODE.SEED];

export class InteractionRouter {
  constructor(camera, renderer, simulation, coreObj, blockchainAdapter, metadataGenerator, onRebuild) {
    this.camera     = camera;
    this.renderer   = renderer;
    this.simulation = simulation;
    this.coreObj    = coreObj;
    this.blockchain = blockchainAdapter;
    this.metadata   = metadataGenerator;
    this.onRebuild  = onRebuild;

    this.raycaster = new THREE.Raycaster();
    this.mouse     = new THREE.Vector2();

    this._disturbance = 0;
    this._modeIndex   = 0;
    this.currentMode  = MODE_ORDER[0];

    // Instancing ref for spawning interaction lights
    this._instancing  = null;
    this._sceneRef    = null;
    this._rendererRef = null;

    // Cooldown between clicks
    this._lastClickTime = 0;
    this._clickCooldown = 180; // ms

    this._bindEvents();
  }

  // ─── Event binding ─────────────────────────────────────────────────────────

  _bindEvents() {
    window.addEventListener('keydown', (e) => this._onKeyDown(e));
    // Use renderer.domElement bound after setRendererRef
  }

  _bindClickEvent() {
    if (this._clickBound) return;
    this._clickBound = true;
    this.renderer.domElement.addEventListener('click', (e) => this._onMouseClick(e));
  }

  _onKeyDown(e) {
    switch (e.key.toLowerCase()) {
      case 'e': this._disturbCore(); break;
      case 'p': this._nextPhase(); break;
      case 'c': this._toggleCamera(); break;
      case 'm': this._exportMetadata(); break;
      case 'r': this._resetWorld(); break;
      case 'f': this._cycleMode(); break;
      case '1': this._setArchetype('CATHEDRAL'); break;
      case '2': this._setArchetype('RIFT'); break;
      case '3': this._setArchetype('OSSUARY'); break;
      case '4': this._setArchetype('DEEP_FORGE'); break;
      case '5': this._setArchetype('TIDAL_VAULT'); break;
      case 'q': this._setMutation('CRYSTALLIZATION'); break;
      case 'w': this._setMutation('BLOOM'); break;
      case 'a': this._setMutation('COLLAPSE'); break;
    }
  }

  _onMouseClick(event) {
    const now = performance.now();
    if (now - this._lastClickTime < this._clickCooldown) return;
    this._lastClickTime = now;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width)  * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top)  / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const meshes = [];
    if (this._sceneRef) {
      this._sceneRef.traverse(obj => { if (obj.isInstancedMesh) meshes.push(obj); });
    }

    const intersects = this.raycaster.intersectObjects(meshes, false);
    if (intersects.length === 0) return;

    const hit     = intersects[0].point;
    const voxel   = this._worldToVoxel(hit);
    if (!voxel) return;

    this._executeInteraction(voxel, hit);
  }

  // ─── Interaction dispatch ──────────────────────────────────────────────────

  _executeInteraction({ vx, vy, vz }, worldHit) {
    const archetype = this.simulation.archetype;

    switch (this.currentMode) {
      case MODE.ENERGY: {
        this.simulation.depositEnergy(vx, vy, vz, SIMULATION.SCAR_ENERGY);
        this.blockchain.depositEnergy(SIMULATION.SCAR_ENERGY, { vx, vy, vz });
        // Spawn warm interaction light
        if (this._instancing) {
          const color = new THREE.Color(archetype.energyColor || 0xffdd88);
          this._instancing.spawnInteractionLight(worldHit, color, 4.0);
        }
        this._showEvent('ENERGY DEPOSITED');
        break;
      }

      case MODE.FRACTURE: {
        this.simulation.fracture(vx, vy, vz);
        this.blockchain.depositEnergy(0, { vx, vy, vz }); // record disturbance
        // Spawn cold sharp light for fracture
        if (this._instancing) {
          const color = new THREE.Color(0xaaccff);
          this._instancing.spawnInteractionLight(worldHit, color, 5.0);
        }
        this._showEvent('FRACTURE');
        break;
      }

      case MODE.RITUAL: {
        this.simulation.activateRitualZone(vx, vy, vz);
        this.blockchain.invokeRitual();
        if (this._instancing) {
          const color = new THREE.Color(archetype.ritualColor || 0xff4400);
          this._instancing.spawnInteractionLight(worldHit, color, 6.0);
        }
        this._showEvent('RITUAL ZONE ACTIVATED');
        break;
      }

      case MODE.SEED: {
        const placed = this.simulation.scatterSeeds(vx, vy, vz);
        if (this._instancing) {
          const color = new THREE.Color(archetype.seedColor || 0x224400);
          this._instancing.spawnInteractionLight(worldHit, color, 2.5);
        }
        this._showEvent(`${placed} SEEDS SCATTERED`);
        break;
      }
    }
  }

  // ─── Core disturbance ─────────────────────────────────────────────────────

  _disturbCore() {
    this.simulation.disturbCore();
    this._disturbance = 1.0;
    this.blockchain.invokeRitual();
    this._showEvent('CORE DISTURBED');
  }

  // ─── Phase / mode / archetype ──────────────────────────────────────────────

  _nextPhase() {
    this.simulation.advancePhase();
    this.blockchain.stabilizePhase(this.simulation.phaseKey);
    this._showEvent(`PHASE → ${this.simulation.phaseKey}`);
  }

  _cycleMode() {
    this._modeIndex   = (this._modeIndex + 1) % MODE_ORDER.length;
    this.currentMode  = MODE_ORDER[this._modeIndex];
    this._showEvent(`MODE → ${this.currentMode}`);
    this._updateModeUI();
  }

  _toggleCamera() {
    if (this._rendererRef) {
      const mode = this._rendererRef.toggleCameraMode();
      this._showEvent(`CAMERA: ${mode.toUpperCase()}`);
    }
  }

  async _exportMetadata() {
    await this.metadata.exportToConsole();
    await this.metadata.exportToDownload();
    this._showEvent('METADATA EXPORTED');
  }

  _resetWorld() {
    if (this.onRebuild) {
      this.onRebuild('reset');
      this._showEvent('WORLD RESET');
    }
  }

  _setArchetype(key) {
    if (this.onRebuild) {
      this.onRebuild('archetype', key);
      this._showEvent(`ARCHETYPE → ${key}`);
    }
  }

  _setMutation(key) {
    const ml = MutationLogic[key];
    if (ml) {
      this.simulation.setMutationLogic(ml);
      this._showEvent(`MUTATION → ${key}`);
    }
  }

  // ─── Refs ──────────────────────────────────────────────────────────────────

  setScene(scene)             { this._sceneRef    = scene;    }
  setRendererRef(renderer)    { this._rendererRef = renderer; }
  setInstancing(instancing)   {
    this._instancing = instancing;
    this._bindClickEvent();
  }

  // ─── Disturbance decay ────────────────────────────────────────────────────

  consumeDisturbance(deltaMs) {
    const val         = this._disturbance;
    this._disturbance = Math.max(0, this._disturbance - deltaMs * 0.0018);
    return val;
  }

  // ─── Voxel conversion ─────────────────────────────────────────────────────

  _worldToVoxel(worldPos) {
    const { SIZE_X, SIZE_Y, SIZE_Z } = WORLD;
    const ox = -SIZE_X * WORLD.VOXEL_SIZE * 0.5;
    const oy = -SIZE_Y * WORLD.VOXEL_SIZE * 0.3;
    const oz = -SIZE_Z * WORLD.VOXEL_SIZE * 0.5;

    const vx = Math.round((worldPos.x - ox) / WORLD.VOXEL_SIZE);
    const vy = Math.round((worldPos.y - oy) / WORLD.VOXEL_SIZE);
    const vz = Math.round((worldPos.z - oz) / WORLD.VOXEL_SIZE);

    if (vx < 0 || vy < 0 || vz < 0 || vx >= SIZE_X || vy >= SIZE_Y || vz >= SIZE_Z) return null;
    return { vx, vy, vz };
  }

  // ─── UI ───────────────────────────────────────────────────────────────────

  _showEvent(text) {
    const el = document.getElementById('ui-event');
    if (!el) return;
    el.textContent = text;
    el.classList.add('visible');
    clearTimeout(this._eventTimer);
    this._eventTimer = setTimeout(() => el.classList.remove('visible'), 1800);
  }

  _updateModeUI() {
    const el = document.getElementById('ui-mode');
    if (el) el.textContent = this.currentMode;
  }
}