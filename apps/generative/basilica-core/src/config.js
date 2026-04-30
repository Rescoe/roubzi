// BASILICA // CORE — Configuration
// Modify these values to tune the experience.

export const WORLD = {
  SIZE_X: 32,
  SIZE_Y: 24,
  SIZE_Z: 32,
  VOXEL_SIZE: 1.0,
  CHUNK_SIZE: 16, // prepared for future chunking
};

export const SIMULATION = {
  TICK_INTERVAL_MS: 180,       // ms between sim ticks
  MUTATIONS_PER_TICK: 12,      // max cells mutated per tick
  ENERGY_DECAY: 0.008,         // per tick
  CORE_PULSE_SPEED: 0.6,       // animation speed multiplier
  SCAR_RADIUS: 3.5,            // radius of user interaction
  SCAR_ENERGY: 0.85,           // energy deposited per click
};

export const CAMERA = {
  ORBIT_SPEED: 0.00018,        // auto-rotation speed (slow, ceremonial)
  ORBIT_RADIUS_MIN: 28,
  ORBIT_RADIUS_MAX: 80,
  FOV: 52,
  NEAR: 0.5,
  FAR: 400,
  CINEMATIC_HEIGHT: 14,
};

export const RENDER = {
  BLOOM_STRENGTH: 0.65,
  BLOOM_RADIUS: 0.5,
  BLOOM_THRESHOLD: 0.38,
  FOG_NEAR: 40,
  FOG_FAR: 160,
  SHADOW_MAP_SIZE: 1024,
};

export const PHASES = {
  DORMANT:  { label: 'DORMANT',  duration: 30000, mutationRate: 0.08 },
  STIRRING: { label: 'STIRRING', duration: 25000, mutationRate: 0.28 },
  GROWTH:   { label: 'GROWTH',   duration: 35000, mutationRate: 0.62 },
  RITUAL:   { label: 'RITUAL',   duration: 20000, mutationRate: 1.00 },
};
export const PHASE_ORDER = ['DORMANT', 'STIRRING', 'GROWTH', 'RITUAL'];

export const MOCK_TOKEN = {
  contractAddress: '0x0000000000000000000000000000000000000000',
  chainId: 1,
  tokenId: 1,
  projectName: 'BASILICA // CORE',
};
