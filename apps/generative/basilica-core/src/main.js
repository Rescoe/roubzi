// BASILICA // CORE — Main Orchestrator
// Bootstraps all systems, runs the game loop.

import * as THREE from 'three';
import { SIMULATION, WORLD } from './config.js';
import { WorldArchetype, MutationLogic, CoreEntity as CoreDefs, CellState, Doctrine } from './traits.js';
import { WorldGenerator } from './worldGenerator.js';
import { SimulationEngine } from './simulationEngine.js';
import { InstancingManager } from './instancingManager.js';
import { CoreEntityObject } from './coreEntity.js';
import { Renderer } from './renderer.js';
import { BlockchainAdapter } from './blockchainAdapter.js';
import { MetadataGenerator } from './metadataGenerator.js';
import { InteractionRouter } from './interactionRouter.js';
import { UI } from './ui.js';
import { RenderTuner } from './renderTuner.js'; // Debug panel: T=Toggle, X=Export

// ─── World State ──────────────────────────────────────────────────────────────
let currentArchetypeKey = 'CATHEDRAL';
let currentMutationKey = 'CRYSTALLIZATION';
let currentSeed = Math.floor(Math.random() * 999999);

// ─── Module References ────────────────────────────────────────────────────────
let renderer, simulation, instancing, coreEntityObj, blockchain, metadata, router, ui, renderTuner;

function hash(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function selectCoreFromSeed(seed, archetypeKey) {
  const r = hash(seed);

  let threshold = 0.5;

  if (archetypeKey === 'CATHEDRAL' || archetypeKey === 'OSSUARY') {
    threshold = 0.48; // léger biais MONOLITH
  } else if (archetypeKey === 'RIFT' || archetypeKey === 'TIDAL_VAULT') {
    threshold = 0.52; // léger biais SUN
  }

  return r < threshold ? 'MONOLITH' : 'SUN';
}


// ─── Bootstrap ───────────────────────────────────────────────────────────────
function bootstrap() {
  ui = new UI();

  const container = document.getElementById('canvas-container');

  // Init renderer first (creates scene)
  renderer = new Renderer(container);

  // Render tuning panel (T=Toggle, X=Export JSON)
  renderTuner = new RenderTuner(renderer);

  // Build world from current config
  buildWorld();

  // Start loop
  let lastTime = performance.now();
  let tickAccumulator = 0;

  function loop() {
    requestAnimationFrame(loop);
    const now = performance.now();
    const deltaMs = Math.min(now - lastTime, 100); // cap to prevent spiral
    lastTime = now;
    const time = now * 0.001;

    // Simulation update (phase timer)
    simulation.update(deltaMs);

    // Tick-based mutation
    tickAccumulator += deltaMs;
    if (tickAccumulator >= SIMULATION.TICK_INTERVAL_MS) {
      tickAccumulator -= SIMULATION.TICK_INTERVAL_MS;
      simulation.tick_step();
      // Apply only dirty cells to GPU
      instancing.applyDirty(simulation.cells, simulation.getDirty());
      // Sync blockchain state
      blockchain.syncState(simulation);
      // UI update
      ui.update(simulation);
    }

    // Animate energy cells
    instancing.animateEnergy(time);

    // Animate core entity
    const disturbance = router.consumeDisturbance(deltaMs);
    coreEntityObj.update(time, simulation.phaseKey, disturbance);

    // Camera / renderer update
    renderer.update(time, deltaMs);
    renderer.render();
  }

  loop();

  // Hide loading screen after first frame paints
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ui.hideLoading();
    });
  });
}

// ─── World Build / Rebuild ────────────────────────────────────────────────────
function buildWorld(resetSeed = false) {
  if (resetSeed) {
    currentSeed = Math.floor(Math.random() * 999999);
  }
	console.log(currentSeed);
  const archetype = WorldArchetype[currentArchetypeKey];


	const CoreKey = selectCoreFromSeed(currentSeed, currentArchetypeKey);
	const coreEntityDef = CoreDefs[CoreKey];
	console.log(coreEntityDef);

  const mutationLogic = MutationLogic[currentMutationKey];

  // Dispose previous objects
  if (instancing) instancing.dispose();
  if (coreEntityObj) coreEntityObj.dispose();
  // Remove ground meshes
  const toRemove = [];
  renderer.scene.traverse(obj => {
    if (obj.userData.isGround) toRemove.push(obj);
  });
  toRemove.forEach(obj => renderer.scene.remove(obj));

  // Generate world data
  const generator = new WorldGenerator(currentSeed, archetype, coreEntityDef);
  const worldData = generator.generate();

  // Simulation engine
  simulation = new SimulationEngine(worldData, currentSeed, archetype, coreEntityDef, mutationLogic);

  // GPU instancing
  instancing = new InstancingManager(renderer.scene, archetype, coreEntityDef);
  instancing.rebuild(simulation.cells);

  // Core entity visual
  coreEntityObj = new CoreEntityObject(renderer.scene, coreEntityDef, worldData.corePos, archetype);

  // Renderer setup
  renderer.setupLights(coreEntityDef, archetype);
  renderer.addGround(archetype);
  renderer.applyDoctrine(archetype.doctrine, archetype);

  // Sync render tuner to new archetype/lights/fog (CRITICAL)
  renderTuner.syncToArchetype(archetype);

  // Blockchain adapter
  blockchain = new BlockchainAdapter(currentSeed, archetype, coreEntityDef, mutationLogic);

  // Metadata generator
  metadata = new MetadataGenerator(blockchain);

  // Interaction router
  if (router) {
    // Re-wire existing router to new systems
    router.simulation = simulation;
    router.coreObj = coreEntityObj;
    router.blockchain = blockchain;
    router.metadata = metadata;
    router._sceneRef = renderer.scene;
  } else {
    router = new InteractionRouter(
      renderer.camera,
      renderer.renderer,
      simulation,
      coreEntityObj,
      blockchain,
      metadata,
      (action, key) => {
        if (action === 'reset') {
          buildWorld(true);
        } else if (action === 'archetype') {
          currentArchetypeKey = key;
          buildWorld(false);
        }
      }
    );
    router.setScene(renderer.scene);
    router.setRendererRef(renderer);
  }

  // UI init
  ui.init({
    seed:      currentSeed,
    archetype: archetype.label,
    core:      coreEntityDef.label,
    mutation:  mutationLogic.label,
  });

  console.log(
    `%cBASILICA // CORE%c  seed=${currentSeed}  archetype=${archetype.id}  core=${coreEntityDef.id}  mutation=${mutationLogic.id}`,
    'color: #e8d5a0; font-weight: bold;',
    'color: #888;'
  );
}

// ─── Entry ───────────────────────────────────────────────────────────────────
bootstrap();