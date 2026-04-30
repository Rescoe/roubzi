// BASILICA // CORE — Traits
// Immutable identity system. Mutable body, immutable myth.

// ─── Cell States ─────────────────────────────────────────────────────────────
export const CellState = {
  EMPTY:     0,
  RAW_VOXEL: 1,
  MUTATED:   2,
  ENERGY:    3,
  RUIN:      4,
  CRYSTAL:   5,
  RITUAL:    6,
  SEED:      7,
};

// ─── Core Entities ────────────────────────────────────────────────────────────
export const CoreEntity = {
  VOID: {
    id: 'VOID', label: 'Void',
    color: 0x080808, glowColor: 0x3a1a6a,
    influenceRadius: 14,
    pulseAmplitude: 0.35,
    mutationBias: -0.35,
    lightIntensity: 0.0, lightColor: 0x2a0a4e,
    ambientMod: 0.55,
    crystalBias: 0.0, seedBias: 0.25, ritualBias: 0.6,
  },
  SUN: {
    id: 'SUN', label: 'Sun',
    color: 0xffe090, glowColor: 0xff8800,
    influenceRadius: 18,
    pulseAmplitude: 0.7,
    mutationBias: +0.55,
    lightIntensity: 2.8, lightColor: 0xffbb33,
    ambientMod: 1.4,
    crystalBias: 0.1, seedBias: 0.7, ritualBias: 0.3,
  },
  MONOLITH: {
    id: 'MONOLITH', label: 'Monolith',
    color: 0x111111, glowColor: 0x005544,
    influenceRadius: 11,
    pulseAmplitude: 0.08,
    mutationBias: +0.15,
    lightIntensity: 1.1, lightColor: 0x00ddaa,
    ambientMod: 0.95,
    crystalBias: 0.85, seedBias: 0.0, ritualBias: 0.55,
  },
};

// ─── World Archetypes ─────────────────────────────────────────────────────────
// Each archetype defines density logic + full 8-state palette
export const WorldArchetype = {
  CATHEDRAL: {
    id: 'CATHEDRAL', label: 'Cathedral',
    doctrine: 'BONE',
    heightBias: 1.7,
    densityThreshold: 0.36,
    coreYRatio: 0.82,
    fogDensity: 0.78,
    fogColor: 0x221a12, // légèrement éclairci
    noiseScale: 0.17,
    noiseOctaves: 5,
    ambientColor: 0x3a2c18,
    ambientIntensity: 0.85,
    dirLightColor: 0xfff4dc,
    dirLightIntensity: 1.2,
    fillColor: 0x5a3a18,
    fillIntensity: 0.35,

    baseColor:       0xd0b078,
    mutatedColor:    0xe8dcc0,
    energyColor:     0xffe6a8,
    ruinColor:       0x7a6a50,

    crystalColor:    0xd8f0ff,
    ritualColor:     0xff6a2a,
    seedColor:       0x4a5a30,

    crystalEmissive: 0x66aaff,
    ritualEmissive:  0xff5522,
    seedEmissive:    0x2a3a18,
    energyEmissive:  0xffdd66,
    mutatedEmissive: 0x8a6530,
  },

  RIFT: {
    id: 'RIFT', label: 'Rift',
    doctrine: 'SACRED_NIGHT',
    heightBias: 0.5,
    densityThreshold: 0.42,
    coreYRatio: 0.26,
    fogDensity: 0.82,
    fogColor: 0x101a2a,
    noiseScale: 0.28,
    noiseOctaves: 4,

    ambientColor: 0x1a2a55,
    ambientIntensity: 0.85,
    dirLightColor: 0xc0d0ff,
    dirLightIntensity: 1.05,
    fillColor: 0x123a70,
    fillIntensity: 0.55,

    baseColor:       0xfff2d8,
    mutatedColor:    0x3a4aa0,
    energyColor:     0x4a88ff,
    ruinColor:       0x1a1f35,

    crystalColor:    0x66ffff,
    ritualColor:     0xdd55ff,
    seedColor:       0x123040,

    crystalEmissive: 0x66ffff,
    ritualEmissive:  0xcc55ff,
    seedEmissive:    0x005577,
    energyEmissive:  0x5a88ff,
    mutatedEmissive: 0x2a3a88,
  },

  OSSUARY: {
    id: 'OSSUARY', label: 'Ossuary',
    doctrine: 'BONE',
    heightBias: 0.9,
    densityThreshold: 0.40,
    coreYRatio: 0.45,
    fogDensity: 0.55,
    fogColor: 0x2a2216,
    noiseScale: 0.24,
    noiseOctaves: 4,

    ambientColor: 0x3a2c18,
    ambientIntensity: 0.9,
    dirLightColor: 0xffedd8,
    dirLightIntensity: 1.15,
    fillColor: 0x6a4a28,
    fillIntensity: 0.45,

    baseColor:       0xfff2d8,
    mutatedColor:    0xe8c890,
    energyColor:     0xfff6cc,
    ruinColor:       0x7a6545,

    crystalColor:    0xffffff,
    ritualColor:     0xff7744,
    seedColor:       0x3a4428,

    crystalEmissive: 0xe0eeff,
    ritualEmissive:  0xff5533,
    seedEmissive:    0x223018,
    energyEmissive:  0xffe08a,
    mutatedEmissive: 0x9a6a30,
  },

  
  /*
  [TUNER] Preset saved: DEEP_FORGE {
  "exposure": 2.92,
  "bloomStrength": 1.23,
  "bloomRadius": 0.75,
  "bloomThreshold": 0.05,
  "fogDensity": 0,
  "fogNear": 25,
  "fogFar": 90,
  "ambientIntensity": 2.11,
  "dirIntensity": 1.69,
  "fillIntensity": 1.04,
  "hemiIntensity": 0.06,
  "coreIntensity": 1.99,
  "underIntensity": 0
}*/

  DEEP_FORGE: {
    id: 'DEEP_FORGE', label: 'Deep Forge',
    doctrine: 'SACRED_NIGHT',
    heightBias: 1.1,
    densityThreshold: 0.38,
    coreYRatio: 0.35,
    fogDensity: 0.9,
    fogColor: 0x2a1205,
    noiseScale: 0.20,
    noiseOctaves: 5,

    ambientColor: 0x4a1e08,
    ambientIntensity: 0.85,
    dirLightColor: 0xffaa66,
    dirLightIntensity: 1.2,
    fillColor: 0x7a2e08,
    fillIntensity: 0.6,

    baseColor:       0x9C2007,
    mutatedColor:    0xfff2d8,
    energyColor:     0xff6a33,
    ruinColor:       0x2a1a14,

    crystalColor:    0xffbb55,
    ritualColor:     0xff4422,
    seedColor:       0x3a1a08,

    crystalEmissive: 0xffaa44,
    ritualEmissive:  0xff3311,
    seedEmissive:    0x552211,
    energyEmissive:  0xff7733,
    mutatedEmissive: 0x883311,
  },

  TIDAL_VAULT: {
    id: 'TIDAL_VAULT', label: 'Tidal Vault',
    doctrine: 'SACRED_NIGHT',
    heightBias: 0.6,
    densityThreshold: 0.44,
    coreYRatio: 0.30,
    fogDensity: 0.95,
    fogColor: 0x0c2035,
    noiseScale: 0.22,
    noiseOctaves: 4,

    ambientColor: 0x123850,
    ambientIntensity: 0.85,
    dirLightColor: 0x88ddff,
    dirLightIntensity: 1.05,
    fillColor: 0x145070,
    fillIntensity: 0.55,

    baseColor:       0xfff2d8,
    mutatedColor:    0x1f4a60,
    energyColor:     0x55f0ff,
    ruinColor:       0x102430,

    crystalColor:    0x88ffff,
    ritualColor:     0x55bbff,
    seedColor:       0x003a30,

    crystalEmissive: 0x66ffff,
    ritualEmissive:  0x44aaff,
    seedEmissive:    0x004433,
    energyEmissive:  0x44ddff,
    mutatedEmissive: 0x1a5a70,
  },
};

// ─── Mutation Logics ──────────────────────────────────────────────────────────
export const MutationLogic = {
  CRYSTALLIZATION: {
    id: 'CRYSTALLIZATION', label: 'Crystallization',
    spread: 0.4, chaos: 0.1, ruinResistance: 0.8,
  },
  BLOOM: {
    id: 'BLOOM', label: 'Bloom',
    spread: 0.9, chaos: 0.5, ruinResistance: 0.3,
  },
  COLLAPSE: {
    id: 'COLLAPSE', label: 'Collapse',
    spread: 0.2, chaos: 0.8, ruinResistance: 0.0,
  },
};

// ─── Visual Doctrines ─────────────────────────────────────────────────────────
export const Doctrine = {
  BONE: {
    id: 'BONE',
    sky: 0x070605,
  },
  SACRED_NIGHT: {
    id: 'SACRED_NIGHT',
    sky: 0x010208,
  },
};