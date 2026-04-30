// BASILICA // CORE — Simulation Engine (improved)
// Tick-based mutation. Rééquilibré pour régime critique.
// Déterministe, plus organique, plus stable visuellement.

import { CellState } from './traits.js';
import { WORLD, SIMULATION, PHASES, PHASE_ORDER } from './config.js';
import { Noise3D } from './noise.js';

export class SimulationEngine {
  constructor(worldData, seed, archetype, coreEntity, mutationLogic) {
    this.cells     = worldData.cells;
    this.energy    = worldData.energy;
    this.seedAge   = worldData.seedAge || new Uint8Array(worldData.cells.length);
    this.corePos   = worldData.corePos;
    this.size      = worldData.size;

    this.seed             = seed;
    this.archetype        = archetype;
    this.coreEntity       = coreEntity;
    this.mutationLogicKey = mutationLogic.id;
    this.mutationLogic    = mutationLogic;

    this.noise = new Noise3D(seed + 9999);

    this.tick             = 0;
    this.phaseIndex       = 0;
    this.phaseKey         = PHASE_ORDER[0];
    this.mutatedCount     = 0;
    this.energyDeposited  = 0;
    this.scarsCount       = 0;

    this.scarMap = new Float32Array(this.cells.length);
    this.onGrowthEvent = null;

    this.dirty = new Set();
    this._phaseTimer = 0;

    this._rngState = (seed >>> 0) || 1;

    this.microCores = [];
    this._initMicroCores();

    for (let i = 0; i < this.cells.length; i++) {
      if (this.cells[i] === CellState.MUTATED) this.mutatedCount++;
    }
  }

  // ─── Deterministic RNG ─────────────────────────────────────────────

  _rand() {
    let t = this._rngState += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  _randRange(min, max) {
    return min + (max - min) * this._rand();
  }

  _randInt(max) {
    return Math.floor(this._rand() * max);
  }

  // ─── Frame update ──────────────────────────────────────────────────

  update(deltaMs) {
    this._phaseTimer += deltaMs;
    const phaseDef = PHASES[this.phaseKey];
    if (this._phaseTimer > phaseDef.duration) {
      this._phaseTimer = 0;
      this.advancePhase();
    }
  }

  tick_step() {
    this.tick++;
    this.dirty.clear();

    const phaseDef = PHASES[this.phaseKey];
    const mutationRate = phaseDef.mutationRate;
    const budget = Math.ceil(SIMULATION.MUTATIONS_PER_TICK * mutationRate);

    for (let i = 0; i < budget; i++) {
      this._mutateRandomCell();
    }

    this._propagateEnergy();
    this._applyDecay();
    this._tickSeedGermination();
    this._tickRitualFade();
    this._tickScarDecay();
    this._evolveStructure();
    this._tickMicroCores();
  }

  // ─── Micro cores ───────────────────────────────────────────────────

  _initMicroCores() {
    const count = 4 + (this.seed % 5);

    for (let i = 0; i < count; i++) {
      this.microCores.push({
        x: this._randInt(this.size.x),
        y: this._randInt(this.size.y),
        z: this._randInt(this.size.z),
        radius: this._randRange(2.5, 5.5),
        intensity: this._randRange(0.25, 0.65),
        phase: this._randRange(0, Math.PI * 2),
      });
    }
  }

  _tickMicroCores() {
    for (const mc of this.microCores) {
      mc.phase += 0.035;

      const pulse = (Math.sin(mc.phase) * 0.5 + 0.5) * mc.intensity;
      const r = Math.floor(mc.radius);

      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dz = -r; dz <= r; dz++) {
            const x = mc.x + dx;
            const y = mc.y + dy;
            const z = mc.z + dz;

            if (x < 0 || y < 0 || z < 0 || x >= this.size.x || y >= this.size.y || z >= this.size.z) continue;

            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
            if (dist > mc.radius) continue;

            const idx = this._idx(x, y, z);
            if (this.cells[idx] === CellState.EMPTY) continue;

            const falloff = 1.0 - dist / mc.radius;
            if (this.energy[idx] < 0.6) {
              this.energy[idx] = Math.min(1.0, this.energy[idx] + pulse * 0.015 * falloff);
            }
          }
        }
      }
    }
  }

  // ─── Mutation core ─────────────────────────────────────────────────

  _mutateRandomCell() {
    const { SIZE_X, SIZE_Y, SIZE_Z } = WORLD;
    const attempts = 7;
    let chosen = -1;
    let bestScore = -Infinity;

    for (let a = 0; a < attempts; a++) {
      const x = this._randInt(SIZE_X);
      const y = this._randInt(SIZE_Y);
      const z = this._randInt(SIZE_Z);
      const idx = this._idx(x, y, z);

      if (this.cells[idx] === CellState.EMPTY) continue;

      const dx = x - this.corePos.x;
      const dy = y - this.corePos.y;
      const dz = z - this.corePos.z;

      const distToCore = Math.sqrt(dx*dx + dy*dy*0.5 + dz*dz);
      const coreScore = Math.max(0, 1.0 - distToCore / this.coreEntity.influenceRadius);
      const noiseScore = (this.noise.sample(x * 0.1 + this.tick * 0.008, y * 0.1, z * 0.1) + 1) * 0.5;
      const energyScore = this.energy[idx];
      const scarScore = this.scarMap[idx] * 0.6;

      const score =
        coreScore * 0.40 +
        noiseScore * 0.20 +
        energyScore * 0.25 +
        scarScore +
        this._rand() * 0.20;

      if (score > bestScore) {
        bestScore = score;
        chosen = idx;
      }
    }

    if (chosen >= 0) this._applyMutation(chosen);
  }

  _applyMutation(idx) {
    const current = this.cells[idx];
    const phase = this.phaseKey;
    const mlKey = this.mutationLogicKey;
    const scarHeat = this.scarMap[idx];
    let next = current;

    if (mlKey === 'CRYSTALLIZATION') {
      if (current === CellState.RAW_VOXEL)      next = this._rand() < 0.58 ? CellState.MUTATED : current;
      else if (current === CellState.MUTATED)   next = this._rand() < 0.14 ? CellState.CRYSTAL : current;
      else if (current === CellState.CRYSTAL)   next = this._rand() < 0.03 ? CellState.ENERGY : current;
      else if (current === CellState.RUIN)      next = this._rand() < 0.10 ? CellState.RAW_VOXEL : current;
      else if (current === CellState.SEED)      next = this._rand() < 0.06 ? CellState.CRYSTAL : current;
    } else if (mlKey === 'BLOOM') {
      if (current === CellState.RAW_VOXEL)      next = this._rand() < 0.38 ? CellState.ENERGY : CellState.MUTATED;
      else if (current === CellState.MUTATED)   next = this._rand() < 0.24 ? CellState.ENERGY : current;
      else if (current === CellState.ENERGY)    next = this._rand() < 0.06 ? CellState.MUTATED : current;
      else if (current === CellState.SEED)      next = this._rand() < 0.16 ? CellState.ENERGY : CellState.MUTATED;
      else if (current === CellState.CRYSTAL)   next = this._rand() < 0.04 ? CellState.ENERGY : current;
    } else if (mlKey === 'COLLAPSE') {
      if (current === CellState.MUTATED)        next = this._rand() < 0.42 ? CellState.RUIN : current;
      else if (current === CellState.ENERGY)    next = this._rand() < 0.58 ? CellState.RUIN : CellState.MUTATED;
      else if (current === CellState.RAW_VOXEL) next = this._rand() < 0.16 ? CellState.RUIN : current;
      else if (current === CellState.CRYSTAL)   next = this._rand() < 0.14 ? CellState.RUIN : current;
      else if (current === CellState.RITUAL)    next = this._rand() < 0.36 ? CellState.RUIN : CellState.ENERGY;
    }

    if (phase === 'RITUAL') {
      if (current === CellState.MUTATED && this._rand() < 0.22) next = CellState.RITUAL;
      if (current === CellState.ENERGY  && this._rand() < 0.12) next = CellState.RITUAL;
      if (current === CellState.RAW_VOXEL && this._rand() < 0.14) next = CellState.ENERGY;
    }

    if (phase === 'GROWTH' && current === CellState.SEED) {
      next = this._rand() < 0.24 ? CellState.MUTATED : current;
    }

    if (phase === 'DORMANT' && this._rand() < 0.90) return;

    if (scarHeat > 0.2) {
      if (current === CellState.RAW_VOXEL && this._rand() < scarHeat * 0.28) next = CellState.ENERGY;
      if (current === CellState.ENERGY    && this._rand() < scarHeat * 0.12) next = CellState.RITUAL;
    }

    this._setCell(idx, next, current);
  }

  _evolveStructure() {
    const samples = 180;

    for (let i = 0; i < samples; i++) {
      const idx = this._randInt(this.cells.length);
      const state = this.cells[idx];
      const e = this.energy[idx];

      const x = Math.floor(idx / (WORLD.SIZE_Y * WORLD.SIZE_Z));
      const rem = idx % (WORLD.SIZE_Y * WORLD.SIZE_Z);
      const y = Math.floor(rem / WORLD.SIZE_Z);
      const z = rem % WORLD.SIZE_Z;

      const spatialNoise = this.noise.sample(
        x * 0.08 + 17.13,
        y * 0.08 + 9.71,
        z * 0.08 + 3.19
      );

      const neighbors = this._getNeighborIndices(x, y, z);
      let localDensity = 0;
      for (const ni of neighbors) {
        if (this.cells[ni] !== CellState.EMPTY) localDensity++;
      }

      // vide structurel par noise
      if (state !== CellState.EMPTY && spatialNoise < -0.2 && this._rand() < 0.10) {
        this._setCell(idx, CellState.EMPTY, state);
        continue;
      }

      // anti-compaction
      if (state !== CellState.EMPTY && localDensity >= 5 && this._rand() < 0.08) {
        this._setCell(idx, CellState.EMPTY, state);
        continue;
      }

      // croissance plus stricte
      if (state === CellState.EMPTY && e > 0.75 && localDensity >= 1 && localDensity <= 3 && this._rand() < 0.04) {
        this._setCell(idx, CellState.RAW_VOXEL, state);
        continue;
      }

      // destruction structurelle
      if (state !== CellState.EMPTY && e < 0.25 && this._rand() < 0.05) {
        this._setCell(idx, this._rand() < 0.65 ? CellState.EMPTY : CellState.RUIN, state);
        continue;
      }

      // activation lumineuse plus rare
      if (state === CellState.RAW_VOXEL && e > 0.78 && this._rand() < 0.05) {
        this._setCell(idx, CellState.ENERGY, state);
      }
    }
  }

  _setCell(idx, next, current) {
    if (next === current) return;

    if (current === CellState.MUTATED) this.mutatedCount--;
    if (next === CellState.MUTATED) this.mutatedCount++;

    this.cells[idx] = next;
    this.dirty.add(idx);

    if (next === CellState.SEED) {
      this.seedAge[idx] = 0;
    }

    if (next === CellState.SEED && this.onGrowthEvent) {
      const x = Math.floor(idx / (WORLD.SIZE_Y * WORLD.SIZE_Z));
      const r = idx % (WORLD.SIZE_Y * WORLD.SIZE_Z);
      this.onGrowthEvent(x, Math.floor(r / WORLD.SIZE_Z), r % WORLD.SIZE_Z, 'seed');
    }
  }

  // ─── Energy propagation ────────────────────────────────────────────

  _propagateEnergy() {
    const { SIZE_X, SIZE_Y, SIZE_Z } = WORLD;
    const nextEnergy = new Float32Array(this.energy.length);

    const diffusion = 0.06;
    const retention = 0.88;

    for (let x = 0; x < SIZE_X; x++) {
      for (let y = 0; y < SIZE_Y; y++) {
        for (let z = 0; z < SIZE_Z; z++) {
          const idx = this._idx(x, y, z);
          const e = this.energy[idx];
          if (e < 0.001) continue;

          const neighbors = this._getNeighborIndices(x, y, z);
          const kept = e * retention;
          const spreadTotal = e - kept;
          const spreadEach = neighbors.length > 0 ? spreadTotal / neighbors.length : 0;

          nextEnergy[idx] += kept;

          for (const ni of neighbors) {
            if (this.cells[ni] === CellState.EMPTY) {
              nextEnergy[ni] += spreadEach * 0.35;
            } else {
              nextEnergy[ni] += spreadEach;
            }
          }
        }
      }
    }

    for (let i = 0; i < nextEnergy.length; i++) {
      this.energy[i] = Math.min(1.0, nextEnergy[i]);
    }
  }

  _applyDecay() {
    const samples = 200;

    for (let i = 0; i < samples; i++) {
      const idx = this._randInt(this.cells.length);
      if (this.energy[idx] > 0.001) {
        this.energy[idx] *= 0.92;
        if (this.energy[idx] < 0.002) this.energy[idx] = 0;
      }
    }

    // faible amortissement global pour casser les plateaux énergétiques
    for (let i = 0; i < this.energy.length; i += 11) {
      if (this.energy[i] > 0.001) {
        this.energy[i] *= 0.985;
      }
    }
  }

  // ─── Special state ticks ───────────────────────────────────────────

  _tickSeedGermination() {
    if (this.phaseKey === 'DORMANT') return;

    const rate = this.phaseKey === 'GROWTH' ? 0.012 : 0.004;
    const samples = 12;

    for (let i = 0; i < samples; i++) {
      const idx = this._randInt(this.cells.length);
      if (this.cells[idx] !== CellState.SEED) continue;

      this.seedAge[idx] = Math.min(255, this.seedAge[idx] + 1);

      if (this.seedAge[idx] > SIMULATION.SEED_GERMINATION_TICKS && this._rand() < rate) {
        this._setCell(idx, CellState.MUTATED, CellState.SEED);
        this.seedAge[idx] = 0;
      }
    }
  }

  _tickRitualFade() {
    if (this.phaseKey === 'RITUAL') return;

    const samples = 8;
    for (let i = 0; i < samples; i++) {
      const idx = this._randInt(this.cells.length);
      if (this.cells[idx] !== CellState.RITUAL) continue;

      if (this._rand() < 0.08) {
        this._setCell(
          idx,
          this._rand() < 0.5 ? CellState.ENERGY : CellState.MUTATED,
          CellState.RITUAL
        );
      }
    }
  }

  _tickScarDecay() {
    const samples = 40;
    for (let i = 0; i < samples; i++) {
      const idx = this._randInt(this.cells.length);
      if (this.scarMap[idx] > 0) {
        this.scarMap[idx] = Math.max(0, this.scarMap[idx] - 0.002);
      }
    }
  }

  // ─── Interactions ──────────────────────────────────────────────────

  depositEnergy(x, y, z, amount) {
    const { SIZE_X, SIZE_Y, SIZE_Z } = WORLD;
    const r = SIMULATION.SCAR_RADIUS;

    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dz = -r; dz <= r; dz++) {
          const nx = Math.round(x + dx);
          const ny = Math.round(y + dy);
          const nz = Math.round(z + dz);

          if (nx < 0 || ny < 0 || nz < 0 || nx >= SIZE_X || ny >= SIZE_Y || nz >= SIZE_Z) continue;

          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
          if (dist > r) continue;

          const idx = this._idx(nx, ny, nz);
          const falloff = 1.0 - dist / r;

          this.energy[idx] = Math.min(1.0, this.energy[idx] + amount * falloff * 0.9);
          this.scarMap[idx] = Math.min(1.0, this.scarMap[idx] + amount * falloff * 0.65);

          if (this.cells[idx] !== CellState.EMPTY && this._rand() < 0.28 * falloff) {
            const prev = this.cells[idx];
            const next = falloff > 0.72 ? CellState.ENERGY : CellState.MUTATED;
            this._setCell(idx, next, prev);
          }
        }
      }
    }

    this.energyDeposited += amount;
    this.scarsCount++;
  }

  fracture(x, y, z) {
    const { SIZE_X, SIZE_Y, SIZE_Z } = WORLD;
    const r = SIMULATION.SCAR_RADIUS * 1.4;
    const rays = 5 + this._randInt(4);

    for (let ri = 0; ri < rays; ri++) {
      const angle = (ri / rays) * Math.PI * 2 + this._rand() * 0.5;
      const length = r * (0.6 + this._rand() * 0.7);

      for (let t = 0; t <= length; t += 0.8) {
        const fx = Math.round(x + Math.cos(angle) * t);
        const fy = Math.round(y + (this._rand() - 0.5) * t * 0.3);
        const fz = Math.round(z + Math.sin(angle) * t);

        if (fx < 0 || fy < 0 || fz < 0 || fx >= SIZE_X || fy >= SIZE_Y || fz >= SIZE_Z) break;

        const idx = this._idx(fx, fy, fz);
        const prev = this.cells[idx];
        const next = t < length * 0.35 ? CellState.EMPTY : CellState.RUIN;

        this._setCell(idx, next, prev);
        this.scarMap[idx] = Math.min(1.0, this.scarMap[idx] + (1.0 - t / length) * 0.9);
        this.energy[idx] *= 0.6;
      }
    }

    this.scarsCount++;
  }

  activateRitualZone(x, y, z) {
    const { SIZE_X, SIZE_Y, SIZE_Z } = WORLD;
    const r = SIMULATION.SCAR_RADIUS * 1.2;

    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r * 0.6; dy <= r * 0.6; dy++) {
        for (let dz = -r; dz <= r; dz++) {
          const nx = Math.round(x + dx);
          const ny = Math.round(y + dy);
          const nz = Math.round(z + dz);

          if (nx < 0 || ny < 0 || nz < 0 || nx >= SIZE_X || ny >= SIZE_Y || nz >= SIZE_Z) continue;

          const dist = Math.sqrt(dx*dx + dy*dy*2.8 + dz*dz);
          if (dist > r) continue;

          const idx = this._idx(nx, ny, nz);
          const prev = this.cells[idx];

          if (prev !== CellState.EMPTY) {
            this._setCell(idx, CellState.RITUAL, prev);
            this.energy[idx] = Math.min(1.0, this.energy[idx] + 0.35);
            this.scarMap[idx] = Math.min(1.0, this.scarMap[idx] + 0.7);
          }
        }
      }
    }

    this.scarsCount++;
  }

  scatterSeeds(x, y, z) {
    const { SIZE_X, SIZE_Y, SIZE_Z } = WORLD;
    const r = SIMULATION.SCAR_RADIUS * 1.6;
    let placed = 0;

    for (let i = 0; i < 30; i++) {
      const angle = this._rand() * Math.PI * 2;
      const phi = this._rand() * Math.PI;
      const dist = this._rand() * r;

      const nx = Math.round(x + dist * Math.sin(phi) * Math.cos(angle));
      const ny = Math.round(y + dist * Math.cos(phi) * 0.5);
      const nz = Math.round(z + dist * Math.sin(phi) * Math.sin(angle));

      if (nx < 0 || ny < 0 || nz < 0 || nx >= SIZE_X || ny >= SIZE_Y || nz >= SIZE_Z) continue;

      const idx = this._idx(nx, ny, nz);
      const prev = this.cells[idx];

      if (prev === CellState.RAW_VOXEL || prev === CellState.RUIN) {
        this._setCell(idx, CellState.SEED, prev);
        placed++;
        if (this.onGrowthEvent) this.onGrowthEvent(nx, ny, nz, 'seed_scattered');
      }
    }

    this.scarsCount++;
    return placed;
  }

  disturbCore() {
    const cx = this.corePos.x;
    const cy = this.corePos.y;
    const cz = this.corePos.z;

    this.depositEnergy(cx, cy, cz, 0.8);

    const burstR = 8;
    for (let i = 0; i < 30; i++) {
      const angle = this._rand() * Math.PI * 2;
      const phi = this._rand() * Math.PI;
      const r = 3 + this._rand() * burstR;

      const x = Math.round(cx + r * Math.sin(phi) * Math.cos(angle));
      const y = Math.round(cy + r * Math.cos(phi));
      const z = Math.round(cz + r * Math.sin(phi) * Math.sin(angle));

      if (x >= 0 && y >= 0 && z >= 0 && x < WORLD.SIZE_X && y < WORLD.SIZE_Y && z < WORLD.SIZE_Z) {
        const idx = this._idx(x, y, z);
        const prev = this.cells[idx];
        if (prev !== CellState.EMPTY) this._setCell(idx, CellState.ENERGY, prev);
      }
    }

    this.scarsCount++;
  }

  // ─── Phase management ──────────────────────────────────────────────

  advancePhase() {
    this.phaseIndex = (this.phaseIndex + 1) % PHASE_ORDER.length;
    this.phaseKey = PHASE_ORDER[this.phaseIndex];
  }

  setPhase(key) {
    if (PHASES[key]) {
      this.phaseKey = key;
      this.phaseIndex = PHASE_ORDER.indexOf(key);
      this._phaseTimer = 0;
    }
  }

  setMutationLogic(ml) {
    this.mutationLogic = ml;
    this.mutationLogicKey = ml.id;
  }

  getDirty() {
    return this.dirty;
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  _idx(x, y, z) {
    return x * WORLD.SIZE_Y * WORLD.SIZE_Z + y * WORLD.SIZE_Z + z;
  }

  _getNeighborIndices(x, y, z) {
    const { SIZE_X, SIZE_Y, SIZE_Z } = WORLD;
    const result = [];
    const offsets = [[-1,0,0],[1,0,0],[0,-1,0],[0,1,0],[0,0,-1],[0,0,1]];

    for (const [dx, dy, dz] of offsets) {
      const nx = x + dx;
      const ny = y + dy;
      const nz = z + dz;

      if (nx >= 0 && ny >= 0 && nz >= 0 && nx < SIZE_X && ny < SIZE_Y && nz < SIZE_Z) {
        result.push(this._idx(nx, ny, nz));
      }
    }

    return result;
  }
}