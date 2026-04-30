// BASILICA // CORE — Core Entity
// The heart/god/attractor at the center of the world.

import * as THREE from 'three';
import { CoreEntity as CoreDefs } from './traits.js';
import { SIMULATION } from './config.js';

export class CoreEntityObject {
  constructor(scene, coreEntityDef, corePos, archetype) {
    this.scene = scene;
    this.def = coreEntityDef;
    this.corePos = corePos;
    this.archetype = archetype;

    this.group = new THREE.Group();

    const offsetX = -archetype.id === 'CATHEDRAL' ? 0 : 0;
    this.group.position.set(
      (corePos.x - 16) * 1.0,
      (corePos.y - 7) * 1.0,
      (corePos.z - 16) * 1.0
    );

    this._buildVisuals();
    scene.add(this.group);
  }

  
  _addMonolithDetails() {
  this._monolithLines = [];

  const lineMat = new THREE.MeshBasicMaterial({
    color: this.def.glowColor,
    transparent: true,
    opacity: 0.25,
  });

  for (let i = 0; i < 4; i++) {
    const geo = new THREE.BoxGeometry(0.05, 4.4, 0.05);
    const line = new THREE.Mesh(geo, lineMat);

    const angle = (i / 4) * Math.PI * 2;
    line.position.set(Math.cos(angle) * 0.9, 0, Math.sin(angle) * 0.9);

    this.group.add(line);
    this._monolithLines.push(line);
  }

  // Top cap glow
  const capGeo = new THREE.CircleGeometry(0.9, 16);
  const capMat = new THREE.MeshBasicMaterial({
    color: this.def.glowColor,
    transparent: true,
    opacity: 0.35,
  });

  const cap = new THREE.Mesh(capGeo, capMat);
  cap.rotation.x = -Math.PI / 2;
  cap.position.y = 2.1;

  this.group.add(cap);
  this._monolithCap = cap;
}


  _buildVisuals() {
  const def = this.def;

  let geo;

  // -------------------------
  // GEOMETRY
  // -------------------------

  if (def.id === 'MONOLITH') {
    geo = new THREE.CylinderGeometry(0.9, 1.1, 4.2, 6); // léger taper
  } else if (def.id === 'VOID') {
    geo = new THREE.SphereGeometry(1.6, 16, 16);
  } else {
    geo = new THREE.SphereGeometry(1.8, 24, 24);
  }

  // -------------------------
  // MATERIAL (important)
  // -------------------------

  const mat = new THREE.MeshStandardMaterial({
    color: def.color,
    emissive: def.glowColor,
    emissiveIntensity: def.id === 'MONOLITH' ? 0.6 : 1.0,
    roughness: def.id === 'MONOLITH' ? 0.25 : 0.1,
    metalness: def.id === 'MONOLITH' ? 0.9 : 0.2,
  });

  this.coreMesh = new THREE.Mesh(geo, mat);
  this.group.add(this.coreMesh);

  // -------------------------
  // MONOLITH — STRUCTURE
  // -------------------------

  if (def.id === 'MONOLITH') {
    this._addMonolithDetails();
  }

  // -------------------------
  // GLOW
  // -------------------------

  const glowGeo = new THREE.SphereGeometry(
    def.id === 'VOID' ? 2.8 : 3.2,
    16,
    16
  );

  const glowMat = new THREE.MeshBasicMaterial({
    color: def.glowColor,
    transparent: true,
    opacity: def.id === 'MONOLITH' ? 0.08 : 0.12,
    side: THREE.BackSide,
    depthWrite: false,
  });

  this.glowMesh = new THREE.Mesh(glowGeo, glowMat);
  this.group.add(this.glowMesh);

  // -------------------------
  // LIGHTS
  // -------------------------

  if (def.lightIntensity > 0) {
    this.light = new THREE.PointLight(
      def.lightColor,
      def.lightIntensity,
      45,
      1.5
    );
    this.group.add(this.light);
  }

  this.accentLight = new THREE.PointLight(
    def.glowColor,
    def.lightIntensity * 0.25,
    25,
    2.0
  );
  this.accentLight.position.set(0, -3, 0);
  this.group.add(this.accentLight);

  // -------------------------
  // SPECIALS
  // -------------------------

  if (def.id === 'SUN') this._addOrbitRings();
  if (def.id === 'VOID') this._addVoidParticles();
}
  _addOrbitRings() {
    for (let i = 0; i < 3; i++) {
      const radius = 2.8 + i * 0.8;
      const geo = new THREE.TorusGeometry(radius, 0.04, 6, 64);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffcc44,
        transparent: true,
        opacity: 0.3 - i * 0.08,
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = Math.PI / 2 + i * 0.4;
      ring.rotation.z = i * 0.6;
      ring.userData.orbitSpeed = 0.3 + i * 0.15;
      ring.userData.orbitAxis = i % 2 === 0 ? 'y' : 'z';
      this.group.add(ring);
      if (!this._rings) this._rings = [];
      this._rings.push(ring);
    }
  }

  _addVoidParticles() {
    const count = 80;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.5 + Math.random() * 2.0;
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x4422aa,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    this._voidParticles = new THREE.Points(geo, mat);
    this.group.add(this._voidParticles);
  }

  update(time, phase, disturbance = 0) {
    const def = this.def;
    const pulse = Math.sin(time * SIMULATION.CORE_PULSE_SPEED * (def.id === 'SUN' ? 1.2 : 0.7)) * 0.5 + 0.5;
    const disturbPulse = Math.max(0, 1 - disturbance);

	
	// MONOLITH animation enrichie
if (def.id === 'MONOLITH') {
  this.coreMesh.rotation.y = time * 0.06;

  if (this._monolithLines) {
    for (let i = 0; i < this._monolithLines.length; i++) {
      const line = this._monolithLines[i];
      line.material.opacity =
        0.15 +
        Math.sin(time * 1.2 + i) * 0.1 +
        disturbance * 0.3;
    }
  }

  if (this._monolithCap) {
    this._monolithCap.material.opacity =
      0.25 + pulse * 0.25 + disturbance * 0.4;
  }
}


    // Pulse emissive
    const baseIntensity = def.id === 'VOID' ? 0.6 : 1.0;
    this.coreMesh.material.emissiveIntensity = baseIntensity + pulse * 0.5 + disturbance * 0.8;

    // Light pulse
    if (this.light) {
      const baseLI = def.lightIntensity;
      this.light.intensity = baseLI * (0.8 + pulse * 0.4) * (1.0 + disturbance);
    }

    // Glow pulse
    this.glowMesh.material.opacity = (def.id === 'VOID' ? 0.06 : 0.12) + pulse * 0.08 + disturbance * 0.15;

    // Sun orbit rings
    if (this._rings) {
      for (const ring of this._rings) {
        ring.rotation[ring.userData.orbitAxis] += ring.userData.orbitSpeed * 0.01;
      }
    }

    // Void particles
    if (this._voidParticles) {
      this._voidParticles.rotation.y = time * 0.04;
      this._voidParticles.rotation.x = time * 0.02;
    }
  }

  triggerDisturbance() {
    // Will be consumed by update() via disturbance param
    this._disturbTime = 3.0;
  }

  dispose() {
    this.scene.remove(this.group);
  }
}
