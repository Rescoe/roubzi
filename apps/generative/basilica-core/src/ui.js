// BASILICA // CORE — UI
// Lightweight DOM overlay updates. No framework.

const PHASE_COLORS = {
  DORMANT:  '#607a8a',
  STIRRING: '#c0a060',
  GROWTH:   '#80c060',
  RITUAL:   '#e8d5a0',
};

export class UI {
  constructor() {
    this._els = {
      seed:      document.getElementById('stat-seed'),
      archetype: document.getElementById('stat-archetype'),
      core:      document.getElementById('stat-core'),
      mutation:  document.getElementById('stat-mutation'),
      energy:    document.getElementById('stat-energy'),
      mutations: document.getElementById('stat-mutations'),
      tick:      document.getElementById('stat-tick'),
      phase:     document.getElementById('stat-phase'),
    };
    this._loading = document.getElementById('loading');
  }

  init(traits) {
    this._set('seed',      traits.seed);
    this._set('archetype', traits.archetype);
    this._set('core',      traits.core);
    this._set('mutation',  traits.mutation);
  }

  update(simState) {
    this._set('energy',    simState.energyDeposited.toFixed(2));
    this._set('mutations', simState.mutatedCount);
    this._set('tick',      simState.tick);

    const el = this._els.phase;
    if (el) {
      el.textContent = simState.phaseKey;
      el.style.color = PHASE_COLORS[simState.phaseKey] || '#e8d5a0';
    }
  }

  hideLoading() {
    if (this._loading) {
      this._loading.classList.add('fade');
      setTimeout(() => { this._loading.style.display = 'none'; }, 1200);
    }
  }

  _set(key, value) {
    const el = this._els[key];
    if (el) el.textContent = String(value);
  }
  
  ridged(x, y, z, octaves = 4) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1.0;

  for (let i = 0; i < octaves; i++) {
    let n = this.sample(x * frequency, y * frequency, z * frequency);
    n = 1.0 - Math.abs(n); // inversion → crêtes
    n *= n; // sharpen

    value += n * amplitude;

    frequency *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}

warp(x, y, z) {
  const qx = this.fbm(x + 5.2, y + 1.3, z + 7.1, 3);
  const qy = this.fbm(x + 8.3, y + 2.8, z + 3.4, 3);
  const qz = this.fbm(x + 2.7, y + 9.1, z + 5.6, 3);

  return {
    x: x + qx * 1.5,
    y: y + qy * 1.5,
    z: z + qz * 1.5,
  };
}

ruinNoise(x, y, z) {
  // Warp space
  const w = this.warp(x, y, z);

  // Base structure
  const base = this.fbm(w.x, w.y, w.z, 5);

  // Sharp ridges (ruins)
  const ridges = this.ridged(w.x * 1.2, w.y * 1.2, w.z * 1.2, 4);

  // Secondary erosion
  const erosion = this.fbm(w.x * 2.5, w.y * 2.5, w.z * 2.5, 2);

  // Combine
  let value =
    base * 0.6 +
    ridges * 0.9 -
    erosion * 0.4;

  return value;
}

turbulence(x, y, z, octaves = 4) {
  let value = 0;
  let amplitude = 1.0;
  let frequency = 1.0;

  for (let i = 0; i < octaves; i++) {
    value += Math.abs(
      this.sample(x * frequency, y * frequency, z * frequency)
    ) * amplitude;

    frequency *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}

crack(x, y, z) {
  const n = this.sample(x * 2.5, y * 2.5, z * 2.5);
  return Math.pow(Math.abs(n), 3.0);
}

}
