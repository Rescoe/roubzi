// BASILICA // CORE — World Generator
// Chunked generation. 5 archetypes with distinct spatial logic.
// Principle: not a clean blocky world — ruins, fractures, cavities, strata, accidents.

import { Noise3D } from './noise.js';
import { CellState } from './traits.js';
import { WORLD } from './config.js';

const { SIZE_X, SIZE_Y, SIZE_Z, CHUNK_SIZE } = WORLD;

export class WorldGenerator {
  constructor(seed, archetype, coreEntity) {
    this.seed      = seed;
    this.archetype = archetype;
    this.coreEntity = coreEntity;

    // Three independent noise layers for richer generation
    this.noiseA = new Noise3D(seed);                  // macro structure
    this.noiseB = new Noise3D(seed ^ 0xdeadbeef);     // fractures / micro detail
    this.noiseC = new Noise3D(seed ^ 0xc0ffee42);     // crystal/seed scatter
    this.noiseD = new Noise3D(seed ^ 0x1337cafe);     // cavities / erosion
  }

  generate() {
    const total  = SIZE_X * SIZE_Y * SIZE_Z;
    const cells  = new Uint8Array(total);
    const energy = new Float32Array(total);
    const seedAge = new Uint8Array(total);
	


    const corePos = {
      x: SIZE_X * 0.5,
      y: SIZE_Y * this.archetype.coreYRatio,
      z: SIZE_Z * 0.5,
    };

    // Chunk-by-chunk generation
    const chunksX = Math.ceil(SIZE_X / CHUNK_SIZE);
    const chunksY = Math.ceil(SIZE_Y / CHUNK_SIZE);
    const chunksZ = Math.ceil(SIZE_Z / CHUNK_SIZE);

    for (let cx = 0; cx < chunksX; cx++) {
      for (let cy = 0; cy < chunksY; cy++) {
        for (let cz = 0; cz < chunksZ; cz++) {
          this._generateChunk(cx, cy, cz, cells, energy, corePos);
        }
      }
    }

    // Post-passes — order matters
    this._carveCoreCavity(cells, corePos);
    this._carveGlobalFractures(cells, corePos);
    this._carveErosionCavities(cells);
    this._scatterSpecialStates(cells, corePos);
	this._injectMicroCores(cells, energy, corePos);

    return { cells, energy, seedAge, corePos, size: { x: SIZE_X, y: SIZE_Y, z: SIZE_Z } };
  }

  // ─── Chunk Generation ─────────────────────────────────────────────────────

_generateChunk(cx, cy, cz, cells, energy, corePos) {
  const arch = this.archetype;
  const core = this.coreEntity;

  const startX = cx * CHUNK_SIZE;
  const startY = cy * CHUNK_SIZE;
  const startZ = cz * CHUNK_SIZE;
  const endX = Math.min(startX + CHUNK_SIZE, SIZE_X);
  const endY = Math.min(startY + CHUNK_SIZE, SIZE_Y);
  const endZ = Math.min(startZ + CHUNK_SIZE, SIZE_Z);

  const halfX = SIZE_X / 2;
  const halfZ = SIZE_Z / 2;

  for (let x = startX; x < endX; x++) {
    for (let y = startY; y < endY; y++) {
      for (let z = startZ; z < endZ; z++) {

        const idx = this._idx(x, y, z);

        const nx = (x - halfX) / halfX;
        const ny = y / SIZE_Y;
        const nz = (z - halfZ) / halfZ;

        const ns = arch.noiseScale;

        // ─── MULTI NOISE ─────────────────────────────
        const base   = this.noiseA.fbm(x * ns, y * ns * 0.7, z * ns, 5);
        const ridge  = this.noiseB.ridged(x * ns * 1.8, y * ns * 1.2, z * ns * 1.8);
        const warp   = this.noiseC.warp(x * ns * 0.6, y * ns * 0.6, z * ns * 0.6);
        const crack  = this.noiseD.crack(x * ns * 2.5, y * ns * 1.5, z * ns * 2.5);

        const macro =
          base * 0.45 +
          ridge * 0.35 +
          warp * 0.2 -
          crack * 0.25;

        const micro =
          this.noiseB.fbm(x * ns * 3.5, y * ns * 3.5, z * ns * 3.5, 2) * 0.18;

        // ─── FIELD ARCHETYPE ─────────────────────────
        const fieldVal = this._densityField(arch.id, nx, ny, nz, x, y, z);

        // ─── CORE INFLUENCE ─────────────────────────
        const dx = x - corePos.x;
        const dy = y - corePos.y;
        const dz = z - corePos.z;

        const distToCore = Math.sqrt(dx * dx + dy * dy * 0.5 + dz * dz);
        const coreInfluence = Math.max(0, 1.0 - distToCore / core.influenceRadius);
        const coreBias = core.mutationBias * coreInfluence * 0.42;

        // ─── BASE DENSITY ───────────────────────────
        let density =
          macro * 0.42 +
          micro +
          fieldVal * 0.58 +
          coreBias;

        // ─── RUIN MASK ──────────────────────────────
        const ruinMask = this.noiseD.ruin(x, y, z);
        density -= ruinMask * 0.35;

        // ─── STATE ASSIGNMENT ───────────────────────
        cells[idx] = this._densityToState(
          density,
          arch.densityThreshold,
          coreInfluence
        );

        // ─── ENERGY ────────────────────────────────
        if (coreInfluence > 0.3 && cells[idx] !== CellState.EMPTY) {
          energy[idx] = coreInfluence * 0.5;
        }
      }
    }
  }
}

  // ─── Per-Archetype Density Fields ─────────────────────────────────────────

  _densityField(id, nx, ny, nz, wx, wy, wz) {
    switch (id) {
      case 'CATHEDRAL':   return this._fieldCathedral(nx, ny, nz, wx, wy, wz);
      case 'RIFT':        return this._fieldRift(nx, ny, nz, wx, wy, wz);
      case 'OSSUARY':     return this._fieldOssuary(nx, ny, nz, wx, wy, wz);
      case 'DEEP_FORGE':  return this._fieldDeepForge(nx, ny, nz, wx, wy, wz);
      case 'TIDAL_VAULT': return this._fieldTidalVault(nx, ny, nz, wx, wy, wz);
      default:            return this._fieldCathedral(nx, ny, nz, wx, wy, wz);
    }
  }

  _fieldCathedral(nx, ny, nz, wx, wy, wz) {
    const radial = Math.sqrt(nx * nx + nz * nz);

    // Clustered vertical spires at periodic column positions
    const colX = Math.abs(Math.sin(wx * 0.35 + 0.3)) * Math.abs(Math.cos(wx * 0.18));
    const colZ = Math.abs(Math.sin(wz * 0.35 + 0.8)) * Math.abs(Math.cos(wz * 0.18));
    const spireBoost = Math.pow(Math.max(colX, colZ), 1.6) * 0.55;

    // Central nave: vaulted void that opens upward
    const naveDist = Math.max(0, 0.18 - radial);
    const naveVoid = naveDist * ny * 2.5;

    // Main height gradient — spires taper toward top
    const heightFade = (1.0 - ny * 0.9) * (1.0 - radial * 0.6) * this.archetype.heightBias;

    // Flying buttress diagonals — structural ribs
    const rib1 = Math.max(0, Math.abs(Math.sin((nx + ny * 1.4) * Math.PI * 2.2)) - 0.7) * 0.4;
    const rib2 = Math.max(0, Math.abs(Math.sin((nz - ny * 1.4) * Math.PI * 2.2)) - 0.7) * 0.4;

    // Ruin weathering — random carved pockets in upper half
    const ruin = this.noiseD.sample(wx * 0.3, wy * 0.3, wz * 0.3) * ny * 0.25;

    return heightFade + spireBoost + Math.max(rib1, rib2) - naveVoid - ruin;
  }

  _fieldRift(nx, ny, nz, wx, wy, wz) {
    const radial = Math.sqrt(nx * nx + nz * nz);

    // Central fissure — deep crack that wanders with noise
    const crackWander = this.noiseB.sample(wx * 0.06, 0, wz * 0.06) * 0.25;
    const crackDist   = Math.abs(nx + crackWander);
    const crackVoid   = Math.max(0, 1.0 - crackDist / 0.12) * 0.85;

    // Secondary perpendicular crack
    const crack2Wander = this.noiseA.sample(0, wy * 0.05, wz * 0.07) * 0.2;
    const crack2Dist   = Math.abs(nz + crack2Wander);
    const crack2Void   = Math.max(0, 1.0 - crack2Dist / 0.08) * 0.55;

    // Strata layers — horizontal geological banding
    const strata = Math.abs(Math.sin(ny * Math.PI * 6.0)) * 0.22
      + Math.abs(Math.sin(ny * Math.PI * 14.0)) * 0.08;

    // Low dense ground mass that thins toward top
    const groundMass = (1.0 - ny * this.archetype.heightBias) * 0.75;

    // Jagged peripheral edges
    const edgeJag = this.noiseA.sample(wx * 0.22, wy * 0.15, wz * 0.22) * (1.0 - radial) * 0.3;

    return groundMass + strata + edgeJag - crackVoid - crack2Void * 0.6 - radial * 0.1;
  }

  _fieldOssuary(nx, ny, nz, wx, wy, wz) {
    const radial = Math.sqrt(nx * nx + nz * nz);

    // Scattered rounded mounds and bone-pile clusters
    const moundFreq  = 0.28;
    const moundA     = (this.noiseA.sample(wx * moundFreq, 0, wz * moundFreq) + 1) * 0.5;
    const moundB     = (this.noiseB.sample(wx * moundFreq * 1.7, 0, wz * moundFreq * 1.7) + 1) * 0.5;
    const moundField = Math.pow(Math.max(moundA, moundB), 2.0) * 0.8;

    // Thin horizontal slabs — bone strata
    const slab = Math.pow(Math.abs(Math.cos(ny * Math.PI * 3.5)), 8.0) * 0.35;

    // Overall height — not too tall, spreads outward
    const heightFade = (1.0 - ny * this.archetype.heightBias) * (1.0 - radial * 0.4);

    // Erosion channels between clusters
    const erosion = this.noiseD.sample(wx * 0.4, wy * 0.2, wz * 0.4) * 0.3;

    return heightFade + moundField + slab - erosion - radial * 0.15;
  }

  _fieldDeepForge(nx, ny, nz, wx, wy, wz) {
    const radial = Math.sqrt(nx * nx + nz * nz);

    // Underground cavern system — density strongest at sides, hollow center
    const shaftRadius = 0.25;
    const shaftVoid   = Math.max(0, shaftRadius - radial) / shaftRadius;

    // Lava channel veins — horizontal cracks filled with heat
    const vein1 = Math.max(0, Math.abs(Math.sin(ny * Math.PI * 8.0 + this.noiseA.sample(wx * 0.1, 0, wz * 0.1))) - 0.85) * 1.2;
    const vein2 = Math.max(0, Math.abs(Math.cos(ny * Math.PI * 5.0 + this.noiseB.sample(wx * 0.12, 0, wz * 0.12) * 0.5)) - 0.88) * 0.8;

    // Dense walls — inverse of rift, mass around void
    const wallMass = (radial * this.archetype.heightBias + (1.0 - ny) * 0.5) * 0.7;

    // Stalactite spikes from ceiling
    const stalactite = Math.abs(Math.sin(wx * 0.45)) * Math.abs(Math.cos(wz * 0.45)) * ny * 0.5;

    const erosion = this.noiseD.sample(wx * 0.25, wy * 0.25, wz * 0.25) * 0.25;

    return wallMass + stalactite - shaftVoid * 0.7 + Math.max(vein1, vein2) - erosion;
  }

  _fieldTidalVault(nx, ny, nz, wx, wy, wz) {
    const radial = Math.sqrt(nx * nx + nz * nz);

    // Wide arch spans — submerged vaulted chambers
    const archFreqX = 0.32, archFreqZ = 0.32;
    const arch1 = Math.max(0, Math.abs(Math.sin(wx * archFreqX)) - 0.4);
    const arch2 = Math.max(0, Math.abs(Math.sin(wz * archFreqZ)) - 0.4);
    const archSpan = (arch1 * arch2) * (1.0 - ny) * 1.8;

    // Gentle tidal strata — horizontal bands, more fluid than Rift
    const strata = Math.sin(ny * Math.PI * 4.0 + this.noiseB.sample(wx * 0.08, 0, wz * 0.08)) * 0.15;

    // Depth pressure — denser at base, lighter toward surface
    const depthFade = (1.0 - ny * this.archetype.heightBias) * 0.65;

    // Tidal erosion — pitted, rounded
    const tidal = this.noiseD.fbm(wx * 0.18, wy * 0.18, wz * 0.18, 3) * 0.3;

    // Peripheral walls lean inward
    const wallLean = (radial > 0.7) ? (radial - 0.7) * 1.5 : 0;

    return depthFade + archSpan + strata + tidal - wallLean - radial * 0.12;
  }

  // ─── State Assignment ──────────────────────────────────────────────────────

_densityToState(density, threshold, coreInfluence) {
  if (density < threshold - 0.18) return CellState.EMPTY;

  if (density < threshold - 0.06) return CellState.RUIN;

  if (coreInfluence > 0.38) return CellState.MUTATED;

  if (density < threshold + 0.05) {
    return Math.random() < 0.25
      ? CellState.RUIN
      : CellState.RAW_VOXEL;
  }

  return CellState.RAW_VOXEL;
}

  // ─── Post-Passes ──────────────────────────────────────────────────────────


  _carveCoreCavity(cells, corePos) {
    const r = 3.5;
    const { x: cx, y: cy, z: cz } = corePos;
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
        for (let z = Math.floor(cz - r); z <= Math.ceil(cz + r); z++) {
          if (!this._inBounds(x, y, z)) continue;
          const dx = x - cx, dy = y - cy, dz = z - cz;
          if (Math.sqrt(dx*dx + dy*dy + dz*dz) < r) {
            cells[this._idx(x, y, z)] = CellState.EMPTY;
          }
        }
      }
    }
  }
  
_carveErosionCavities(cells) {
  for (let x = 2; x < SIZE_X - 2; x++) {
    for (let y = 2; y < SIZE_Y - 2; y++) {
      for (let z = 2; z < SIZE_Z - 2; z++) {

        const idx = this._idx(x, y, z);
        if (cells[idx] === CellState.EMPTY) continue;

        const n = this.noiseD.fbm(x * 0.35, y * 0.35, z * 0.35, 4);

        if (n > 0.58) {
          cells[idx] = CellState.EMPTY;
        } else if (n > 0.48 && cells[idx] === CellState.RAW_VOXEL) {
          cells[idx] = CellState.RUIN;
        }
      }
    }
  }
}

  _carveGlobalFractures(cells, corePos) {
    // 2-4 major fracture planes radiate from core, seeded per world
    const fracCount = 2 + (this.seed % 3);
    for (let f = 0; f < fracCount; f++) {
      const angle   = (this.seed * 137.508 + f * 90) * (Math.PI / 180);
      const tilt    = (this.noiseA.sample(f * 3.1, 0, 0)) * 0.4;
      const width   = 1.5 + (this.noiseB.sample(f * 7.3, 0, 0) + 1) * 1.5;
      const wanderAmp = 3.0;

      for (let y = 0; y < SIZE_Y; y++) {
        for (let t = 0; t < SIZE_X + SIZE_Z; t++) {
          // Walk along fracture direction
          const wander = this.noiseA.sample(t * 0.08 + f * 10, y * 0.12, f * 5) * wanderAmp;
          const xc = corePos.x + Math.cos(angle) * t + wander;
          const zc = corePos.z + Math.sin(angle) * t + tilt * y;
          const xi = Math.round(xc), zi = Math.round(zc);
          if (!this._inBounds(xi, y, zi)) continue;
          const fracWidth = width * (0.7 + this.noiseB.sample(xi * 0.1, y * 0.1, zi * 0.1 + f) * 0.3);
          // Carve fracture corridor
          for (let dx = -Math.ceil(fracWidth); dx <= Math.ceil(fracWidth); dx++) {
            for (let dz = -Math.ceil(fracWidth * 0.5); dz <= Math.ceil(fracWidth * 0.5); dz++) {
              if (Math.sqrt(dx*dx + dz*dz) < fracWidth * 0.6) {
                const fx = xi + dx, fz = zi + dz;
                if (!this._inBounds(fx, y, fz)) continue;
                const idx = this._idx(fx, y, fz);
                // Don't carve very deep base, only partial heights
                if (y > 2) cells[idx] = CellState.EMPTY;
              }
            }
          }
        }
      }
    }
  }

  _carveErosionCavities(cells) {
    // Erosion: random internal cavities using noiseD
    for (let x = 2; x < SIZE_X - 2; x++) {
      for (let y = 2; y < SIZE_Y - 2; y++) {
        for (let z = 2; z < SIZE_Z - 2; z++) {
          const idx = this._idx(x, y, z);
          if (cells[idx] === CellState.EMPTY) continue;
          const erosionVal = this.noiseD.fbm(x * 0.3, y * 0.3, z * 0.3, 3);
          // Threshold tuned to create ~8-12% cavities inside solid mass
          if (erosionVal > 0.52) {
            cells[idx] = CellState.EMPTY;
          } else if (erosionVal > 0.44 && cells[idx] === CellState.RAW_VOXEL) {
            cells[idx] = CellState.RUIN;
          }
        }
      }
    }
  }

  _scatterSpecialStates(cells, corePos) {
    const crystalBias = this.coreEntity.crystalBias ?? 0;
    const seedBias    = this.coreEntity.seedBias ?? 0;
    const total       = SIZE_X * SIZE_Y * SIZE_Z;

    for (let i = 0; i < total; i++) {
      if (cells[i] !== CellState.RAW_VOXEL) continue;

      const x   = Math.floor(i / (SIZE_Y * SIZE_Z));
      const rem = i % (SIZE_Y * SIZE_Z);
      const y   = Math.floor(rem / SIZE_Z);
      const z   = rem % SIZE_Z;

      const nc = this.noiseC.sample(x * 0.20, y * 0.20, z * 0.20);

      // Crystal clusters — noise-gated, modulated by core bias
      if (nc > 0.52 && crystalBias > 0.25 && Math.random() < crystalBias * 0.22) {
        cells[i] = CellState.CRYSTAL;
        continue;
      }

      // Seeds — sparse organic nodes
      if (nc < -0.50 && seedBias > 0.15 && Math.random() < seedBias * 0.07) {
        cells[i] = CellState.SEED;
      }
    }
  }

_injectMicroCores(cells, energy, corePos) {
  const count = 6 + (this.seed % 8);

  for (let i = 0; i < count; i++) {

    const x = Math.floor((this.noiseA.sample(i * 3.1, 0, 0) + 1) * 0.5 * SIZE_X);
    const y = Math.floor((this.noiseB.sample(i * 5.7, 0, 0) + 1) * 0.5 * SIZE_Y);
    const z = Math.floor((this.noiseC.sample(i * 7.3, 0, 0) + 1) * 0.5 * SIZE_Z);

    const idx = this._idx(x, y, z);
    if (cells[idx] === CellState.EMPTY) continue;

    cells[idx] = CellState.ENERGY;
    energy[idx] = 1.0;

    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dz = -2; dz <= 2; dz++) {

          const nx = x + dx;
          const ny = y + dy;
          const nz = z + dz;

          if (!this._inBounds(nx, ny, nz)) continue;

          const nidx = this._idx(nx, ny, nz);
          if (cells[nidx] !== CellState.EMPTY) {
            energy[nidx] = Math.max(energy[nidx], 0.4);
          }
        }
      }
    }
  }

  console.log('[WORLD] Micro cores injected:', count);
}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  _idx(x, y, z)       { return x * SIZE_Y * SIZE_Z + y * SIZE_Z + z; }
  _inBounds(x, y, z)  { return x >= 0 && y >= 0 && z >= 0 && x < SIZE_X && y < SIZE_Y && z < SIZE_Z; }
}