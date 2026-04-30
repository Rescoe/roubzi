// BASILICA // CORE — Blockchain Adapter (Mock)
// Interface designed to be replaced with real Solidity contract calls.
// All methods are async to mirror real Web3 usage.

import { MOCK_TOKEN } from './config.js';

export class BlockchainAdapter {
  constructor(seed, archetype, coreEntity, mutationLogic) {
    // In-memory state — simulates on-chain token state
    this._state = {
      contractAddress: MOCK_TOKEN.contractAddress,
      chainId: MOCK_TOKEN.chainId,
      tokenId: MOCK_TOKEN.tokenId,
      projectName: MOCK_TOKEN.projectName,

      // Genesis traits — immutable
      genesis: {
        seed,
        archetype: archetype.id,
        coreEntity: coreEntity.id,
        mutationLogic: mutationLogic.id,
        mintTimestamp: Date.now(),
      },

      // Mutable world state
      worldState: {
        phase: 'DORMANT',
        energyDeposited: 0,
        scarsCount: 0,
        mutatedCellCount: 0,
        tick: 0,
        lastInteraction: null,
      },

      // Event log (mirrors blockchain events)
      events: [],
    };
  }

  // ─── Read Methods ────────────────────────────────────────────────────────

  async getTokenGenesis() {
    // Solidity equivalent: tokenGenesis(uint256 tokenId)
    return { ...this._state.genesis };
  }

  async getTokenState() {
    // Solidity equivalent: tokenState(uint256 tokenId)
    return { ...this._state.worldState };
  }

  async getFullMetadata() {
    return {
      ...this._state.genesis,
      ...this._state.worldState,
      contractAddress: this._state.contractAddress,
      chainId: this._state.chainId,
      tokenId: this._state.tokenId,
      projectName: this._state.projectName,
    };
  }

  // ─── Write Methods (would be transactions on-chain) ──────────────────────

  async depositEnergy(amount, position) {
    // Solidity equivalent: depositEnergy(uint256 tokenId, uint256 amount)
    this._state.worldState.energyDeposited += amount;
    this._state.worldState.scarsCount++;
    this._state.worldState.lastInteraction = Date.now();
    this._emit('EnergyDeposited', { amount, position, tick: this._state.worldState.tick });
    return { success: true, txHash: this._mockTxHash() };
  }

  async invokeRitual() {
    // Solidity equivalent: invokeRitual(uint256 tokenId)
    this._emit('RitualInvoked', { tick: this._state.worldState.tick });
    return { success: true, txHash: this._mockTxHash() };
  }

  async stabilizePhase(phaseKey) {
    // Solidity equivalent: stabilizePhase(uint256 tokenId, uint8 phase)
    this._state.worldState.phase = phaseKey;
    this._emit('PhaseStabilized', { phase: phaseKey });
    return { success: true, txHash: this._mockTxHash() };
  }

  // ─── Sync State (called by simulation engine each tick) ──────────────────

  syncState(simState) {
    this._state.worldState.phase = simState.phaseKey;
    this._state.worldState.energyDeposited = simState.energyDeposited;
    this._state.worldState.scarsCount = simState.scarsCount;
    this._state.worldState.mutatedCellCount = simState.mutatedCount;
    this._state.worldState.tick = simState.tick;
  }

  // ─── Metadata Export ─────────────────────────────────────────────────────

  async exportMetadata() {
    const meta = {
      project: this._state.projectName,
      tokenId: this._state.tokenId,
      contractAddress: this._state.contractAddress,
      chainId: this._state.chainId,
      // Genesis (immutable traits)
      seed: this._state.genesis.seed,
      worldArchetype: this._state.genesis.archetype,
      mutationLogic: this._state.genesis.mutationLogic,
      coreEntity: this._state.genesis.coreEntity,
      mintTimestamp: this._state.genesis.mintTimestamp,
      // World state (mutable)
      currentPhase: this._state.worldState.phase,
      energyDeposited: +this._state.worldState.energyDeposited.toFixed(3),
      scarsCount: this._state.worldState.scarsCount,
      mutatedCellCount: this._state.worldState.mutatedCellCount,
      tick: this._state.worldState.tick,
      exportTimestamp: Date.now(),
      // NFT attributes format (OpenSea compatible)
      attributes: [
        { trait_type: 'World Archetype', value: this._state.genesis.archetype },
        { trait_type: 'Core Entity', value: this._state.genesis.coreEntity },
        { trait_type: 'Mutation Logic', value: this._state.genesis.mutationLogic },
        { trait_type: 'Current Phase', value: this._state.worldState.phase },
        { trait_type: 'Energy Deposited', value: +this._state.worldState.energyDeposited.toFixed(3) },
        { trait_type: 'Mutations', value: this._state.worldState.mutatedCellCount },
        { trait_type: 'Scars', value: this._state.worldState.scarsCount },
        { trait_type: 'Seed', value: this._state.genesis.seed },
      ],
    };
    return meta;
  }

  // ─── Internal ────────────────────────────────────────────────────────────

  _emit(event, data) {
    this._state.events.push({ event, data, timestamp: Date.now() });
    if (this._state.events.length > 100) this._state.events.shift(); // cap log
  }

  _mockTxHash() {
    return '0x' + Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  getEventLog() {
    return [...this._state.events];
  }
}
