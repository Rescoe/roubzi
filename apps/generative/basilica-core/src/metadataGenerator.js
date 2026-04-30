// BASILICA // CORE — Metadata Generator
// Generates and formats dynamic metadata from live world state.

export class MetadataGenerator {
  constructor(blockchainAdapter) {
    this.adapter = blockchainAdapter;
  }

  async generate() {
    return await this.adapter.exportMetadata();
  }

  async exportToConsole() {
    const meta = await this.generate();
    console.group('%cBASILICA // CORE — Metadata Export', 'color: #e8d5a0; font-weight: bold; font-size: 13px;');
    console.log('%cGenesis (Immutable)', 'color: #aaa; font-size: 11px;');
    console.log(`  Project:        ${meta.project}`);
    console.log(`  Token ID:       ${meta.tokenId}`);
    console.log(`  Seed:           ${meta.seed}`);
    console.log(`  World Archetype: ${meta.worldArchetype}`);
    console.log(`  Core Entity:    ${meta.coreEntity}`);
    console.log(`  Mutation Logic: ${meta.mutationLogic}`);
    console.log('%cWorld State (Mutable)', 'color: #aaa; font-size: 11px;');
    console.log(`  Phase:          ${meta.currentPhase}`);
    console.log(`  Energy:         ${meta.energyDeposited}`);
    console.log(`  Scars:          ${meta.scarsCount}`);
    console.log(`  Mutations:      ${meta.mutatedCellCount}`);
    console.log(`  Tick:           ${meta.tick}`);
    console.log('%cFull JSON:', 'color: #aaa;');
    console.log(JSON.stringify(meta, null, 2));
    console.groupEnd();
    return meta;
  }

  async exportToDownload() {
    const meta = await this.generate();
    const blob = new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `basilica-core-token-${meta.tokenId}-tick-${meta.tick}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return meta;
  }
}
