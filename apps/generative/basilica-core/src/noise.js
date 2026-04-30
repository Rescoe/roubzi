// BASILICA // CORE — Deterministic 3D Noise
// Simplex-inspired value noise. No external dependency.

function hash(n) {
  // Fast integer hash
  n = ((n >> 16) ^ n) * 0x45d9f3b;
  n = ((n >> 16) ^ n) * 0x45d9f3b;
  n = (n >> 16) ^ n;
  return n;
}

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return a + t * (b - a);
}

// Seeded gradient noise
function grad(h, x, y, z) {
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

export class Noise3D {
  constructor(seed = 42) {
    this.seed = seed;
    this.perm = new Uint8Array(512);
    this._buildPermTable(seed);
  }

  _buildPermTable(seed) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    // Seeded Fisher-Yates
    let s = seed | 0;
    for (let i = 255; i > 0; i--) {
      s = (hash(s + i) >>> 0) % 2147483647;
      const j = s % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }

  sample(x, y, z) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z);
    const p = this.perm;
    const A  = p[X] + Y,   AA = p[A] + Z,  AB = p[A + 1] + Z;
    const B  = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
    return lerp(
      lerp(
        lerp(grad(p[AA],   x,   y,   z),   grad(p[BA],   x-1, y,   z),   u),
        lerp(grad(p[AB],   x,   y-1, z),   grad(p[BB],   x-1, y-1, z),   u),
        v
      ),
      lerp(
        lerp(grad(p[AA+1], x,   y,   z-1), grad(p[BA+1], x-1, y,   z-1), u),
        lerp(grad(p[AB+1], x,   y-1, z-1), grad(p[BB+1], x-1, y-1, z-1), u),
        v
      ),
      w
    );
  }

  // Fractal Brownian Motion — layered octaves
  fbm(x, y, z, octaves = 5, lacunarity = 2.2, gain = 0.45) {
  let value = 0;
  let amplitude = 0.8;
  let frequency = 1.0;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    let n = this.sample(x * frequency, y * frequency, z * frequency);

    // légère accentuation des contrastes
    n = n * 0.5 + 0.5;
    n = n * n;

    value += n * amplitude;
    maxValue += amplitude;

    amplitude *= gain;
    frequency *= lacunarity;
  }

  return value / maxValue;
}


// Ridged noise (crêtes / fractures dures)
ridged(x, y, z, octaves = 4) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1.0;

  for (let i = 0; i < octaves; i++) {
    let n = this.sample(x * frequency, y * frequency, z * frequency);
    n = 1.0 - Math.abs(n); // inversion → crêtes
    n *= n;

    value += n * amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }

  return value;
}

// Domain warp (déformation organique)
warp(x, y, z) {
  const qx = this.sample(x * 0.5, y * 0.5, z * 0.5);
  const qy = this.sample(x * 0.5 + 31.4, y * 0.5, z * 0.5);
  const qz = this.sample(x * 0.5, y * 0.5 + 17.1, z * 0.5);

  return this.sample(
    x + qx * 2.0,
    y + qy * 2.0,
    z + qz * 2.0
  );
}

// Crack field (fractures)
crack(x, y, z) {
  const n = this.sample(x * 0.8, y * 0.8, z * 0.8);
  return Math.abs(n); // lignes fines
}

// Ruin mask (dégradation structurale)
ruin(x, y, z) {
  const n = this.fbm(x * 0.4, y * 0.4, z * 0.4, 3);
  return n > 0.55 ? 1 : (n > 0.48 ? 0.5 : 0);
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


}
