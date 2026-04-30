// BASILICA // CORE — Render Tuner
// Panneau artiste temps réel. Touche T pour toggle, X pour export.
// Connexion directe au renderer via _apply(). Presets par archétype.
// BASILICA // CORE — Render Tuner
// Panneau artiste temps réel. Touche T pour toggle, X pour export.
// Connexion directe au renderer via _apply(). Presets par archétype.

const ARCHETYPE_DEFAULTS = {
  _DEFAULT: {
    exposure: 1.05,
    bloomStrength: 0.90,
    bloomRadius: 0.55,
    bloomThreshold: 0.30,
    fogDensity: 1.00,
    fogNear: 55,
    fogFar: 155,
    ambientIntensity: 0.70,
    dirIntensity: 1.10,
    fillIntensity: 0.25,
    hemiIntensity: 0.35,
    coreIntensity: 1.00,
    underIntensity: 0.45,
  },

  CATHEDRAL: {
    exposure: 1.18,
    bloomStrength: 0.75,
    bloomRadius: 0.50,
    bloomThreshold: 0.35,
    fogDensity: 0.80,
    fogNear: 60,
    fogFar: 165,
    ambientIntensity: 0.75,
    dirIntensity: 1.20,
    fillIntensity: 0.30,
    hemiIntensity: 0.40,
    coreIntensity: 1.10,
    underIntensity: 0.50,
  },

  RIFT: {
    exposure: 1.65,
    bloomStrength: 1.40,
    bloomRadius: 0.65,
    bloomThreshold: 0.18,
    fogDensity: 0.55,
    fogNear: 42,
    fogFar: 120,
    ambientIntensity: 1.10,
    dirIntensity: 0.95,
    fillIntensity: 0.55,
    hemiIntensity: 0.60,
    coreIntensity: 1.60,
    underIntensity: 0.65,
  },

  OSSUARY: {
    exposure: 1.30,
    bloomStrength: 0.65,
    bloomRadius: 0.48,
    bloomThreshold: 0.38,
    fogDensity: 0.70,
    fogNear: 65,
    fogFar: 175,
    ambientIntensity: 0.85,
    dirIntensity: 1.10,
    fillIntensity: 0.30,
    hemiIntensity: 0.45,
    coreIntensity: 1.00,
    underIntensity: 0.45,
  },

  DEEP_FORGE: {
    exposure: 1.55,
    bloomStrength: 1.60,
    bloomRadius: 0.75,
    bloomThreshold: 0.16,
    fogDensity: 1.10,
    fogNear: 28,
    fogFar: 90,
    ambientIntensity: 0.75,
    dirIntensity: 1.05,
    fillIntensity: 0.50,
    hemiIntensity: 0.40,
    coreIntensity: 1.80,
    underIntensity: 0.70,
  },

  TIDAL_VAULT: {
    exposure: 1.45,
    bloomStrength: 1.30,
    bloomRadius: 0.68,
    bloomThreshold: 0.20,
    fogDensity: 0.80,
    fogNear: 32,
    fogFar: 100,
    ambientIntensity: 0.80,
    dirIntensity: 0.85,
    fillIntensity: 0.48,
    hemiIntensity: 0.50,
    coreIntensity: 1.50,
    underIntensity: 0.58,
  },
};

export class RenderTuner {
  constructor(renderer) {
    this._renderer = renderer;
    this._visible = false;
    this._panel = null;
    this._inputs = {};
    this._archetype = null;
    this._baseFogDensity = 0.005;
    this._baseFogLinear = { near: 55, far: 155 };
    this._coreMult = 1.0;
    this._presets = {};

    this.values = {
      exposure: 1.05,
      bloomStrength: 0.90,
      bloomRadius: 0.55,
      bloomThreshold: 0.30,
      fogDensity: 1.00,
      fogNear: 55,
      fogFar: 155,
      ambientIntensity: 0.70,
      dirIntensity: 1.10,
      fillIntensity: 0.25,
      hemiIntensity: 0.35,
      coreIntensity: 1.00,
      underIntensity: 0.45,
    };

    this._buildPanel();
    this._bindKey();
  }

  _buildPanel() {
    const panel = document.createElement('div');
    panel.id = 'render-tuner';
    panel.style.cssText = `
      position:fixed; top:0; right:0; width:290px; max-height:100vh;
      overflow-y:auto; background:rgba(5,3,2,0.96);
      border-left:1px solid rgba(255,255,255,0.08);
      font-family:'Courier New',monospace; font-size:10px;
      color:rgba(255,255,255,0.55); z-index:9000;
      display:none; padding:0 0 24px; box-sizing:border-box;
      scrollbar-width:thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      padding:13px 14px 10px; border-bottom:1px solid rgba(255,255,255,0.07);
      position:sticky; top:0; background:rgba(5,3,2,0.98); z-index:1;
    `;
    header.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
        <span style="font-size:9px;letter-spacing:.35em;color:rgba(232,213,160,0.65);text-transform:uppercase;">
          ⬡ RENDER TUNER
        </span>
        <span style="font-size:8px;color:rgba(255,255,255,0.18);letter-spacing:.1em;">[T] CLOSE · [X] EXPORT</span>
      </div>
      <div id="tuner-archetype" style="font-size:8px;letter-spacing:.2em;color:rgba(255,255,255,0.25);text-transform:uppercase;">
        ARCHETYPE: —
      </div>
    `;
    panel.appendChild(header);

    const groups = [
      {
        label: 'POST-PROCESS',
        color: '#c0a060',
        sliders: [
          { key: 'exposure', label: 'Exposure', min: 0.1, max: 4.0, step: 0.01, decimals: 2 },
          { key: 'bloomStrength', label: 'Bloom Strength', min: 0.0, max: 4.0, step: 0.01, decimals: 2 },
          { key: 'bloomRadius', label: 'Bloom Radius', min: 0.0, max: 2.0, step: 0.01, decimals: 2 },
          { key: 'bloomThreshold', label: 'Bloom Threshold', min: 0.0, max: 1.5, step: 0.01, decimals: 2 },
        ],
      },
      {
        label: 'FOG',
        color: '#6090a0',
        sliders: [
          { key: 'fogDensity', label: 'Fog Density ×', min: 0.0, max: 5.0, step: 0.01, decimals: 2 },
          { key: 'fogNear', label: 'Fog Near (lin)', min: 1, max: 200, step: 1, decimals: 0 },
          { key: 'fogFar', label: 'Fog Far (lin)', min: 20, max: 500, step: 1, decimals: 0 },
        ],
      },
      {
        label: 'LUMIÈRES',
        color: '#80a060',
        sliders: [
          { key: 'ambientIntensity', label: 'Ambient', min: 0.0, max: 4.0, step: 0.01, decimals: 2 },
          { key: 'dirIntensity', label: 'Dir Key', min: 0.0, max: 5.0, step: 0.01, decimals: 2 },
          { key: 'fillIntensity', label: 'Dir Fill', min: 0.0, max: 3.0, step: 0.01, decimals: 2 },
          { key: 'hemiIntensity', label: 'Hemisphere', min: 0.0, max: 3.0, step: 0.01, decimals: 2 },
          { key: 'coreIntensity', label: 'Core ×', min: 0.0, max: 5.0, step: 0.01, decimals: 2 },
          { key: 'underIntensity', label: 'Under Bounce', min: 0.0, max: 3.0, step: 0.01, decimals: 2 },
        ],
      },
    ];

    for (const g of groups) {
      panel.appendChild(this._makeGroup(g));
    }

    const actions = document.createElement('div');
    actions.style.cssText = 'padding:10px 14px 0; display:flex; flex-direction:column; gap:5px;';
    actions.appendChild(this._makeButton('💾  SAVE PRESET FOR THIS ARCHETYPE', () => this.savePresetForCurrent()));
    actions.appendChild(this._makeButton('📋  COPY JSON TO CLIPBOARD', () => this.copyToClipboard()));
    actions.appendChild(this._makeButton('⬇  EXPORT JSON FILE', () => this.exportPreset()));
    actions.appendChild(this._makeButton('↺  RESET TO ARCHETYPE DEFAULTS', () => this.resetToDefaults()));
    panel.appendChild(actions);

    const previewHeader = document.createElement('div');
    previewHeader.style.cssText = `
      font-size:8px; letter-spacing:.2em; color:rgba(255,255,255,0.18);
      text-transform:uppercase; padding:14px 14px 4px;
      border-top:1px solid rgba(255,255,255,0.05); margin-top:10px;
    `;
    previewHeader.textContent = 'LIVE VALUES';
    panel.appendChild(previewHeader);

    this._previewEl = document.createElement('pre');
    this._previewEl.style.cssText = `
      font-size:8px; color:rgba(255,255,255,0.22); padding:0 14px;
      line-height:1.65; white-space:pre-wrap; word-break:break-all;
    `;
    panel.appendChild(this._previewEl);

    const savedHeader = document.createElement('div');
    savedHeader.style.cssText = `
      font-size:8px; letter-spacing:.2em; color:rgba(255,255,255,0.18);
      text-transform:uppercase; padding:12px 14px 4px;
      border-top:1px solid rgba(255,255,255,0.05);
    `;
    savedHeader.textContent = 'SAVED PRESETS';
    panel.appendChild(savedHeader);

    this._presetDisplay = document.createElement('pre');
    this._presetDisplay.style.cssText = `
      font-size:7px; color:rgba(255,255,255,0.16); padding:0 14px 10px;
      line-height:1.55; white-space:pre-wrap; word-break:break-all;
    `;
    this._presetDisplay.textContent = '(none saved)';
    panel.appendChild(this._presetDisplay);

    document.body.appendChild(panel);
    this._panel = panel;
    this._updatePreview();
  }

  _makeGroup({ label, color, sliders }) {
    const section = document.createElement('div');
    section.style.cssText = 'padding:10px 14px 4px;';

    const groupLabel = document.createElement('div');
    groupLabel.style.cssText = `
      font-size:8px; letter-spacing:.28em; color:${color ?? 'rgba(255,255,255,0.25)'};
      text-transform:uppercase; margin-bottom:7px; padding-bottom:4px;
      border-bottom:1px solid rgba(255,255,255,0.06);
    `;
    groupLabel.textContent = label;
    section.appendChild(groupLabel);

    for (const s of sliders) section.appendChild(this._makeSlider(s));
    return section;
  }

  _makeSlider({ key, label, min, max, step, decimals = 2 }) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'margin-bottom:9px;';

    const labelRow = document.createElement('div');
    labelRow.style.cssText = 'display:flex; justify-content:space-between; margin-bottom:3px; align-items:center;';

    const lbl = document.createElement('span');
    lbl.style.cssText = 'font-size:9px; color:rgba(255,255,255,0.32); text-transform:uppercase; letter-spacing:.1em;';
    lbl.textContent = label;

    const valueEl = document.createElement('span');
    valueEl.style.cssText = `
      font-size:9px; color:rgba(232,213,160,0.75); font-weight:bold;
      min-width:48px; text-align:right;
    `;
    valueEl.textContent = Number(this.values[key]).toFixed(decimals);

    labelRow.appendChild(lbl);
    labelRow.appendChild(valueEl);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = this.values[key];
    input.style.cssText = `
      width:100%; height:3px; cursor:pointer;
      accent-color:rgba(232,213,160,0.55);
      background:rgba(255,255,255,0.08); border-radius:2px;
    `;

    input.addEventListener('input', () => {
      const val = parseFloat(input.value);
      this.values[key] = val;
      valueEl.textContent = val.toFixed(decimals);
      this._apply(key, val);
      this._updatePreview();
      console.log(`%c[TUNER] ${key} = ${val.toFixed(4)}`, 'color:#666; font-size:9px;');
    });

    this._inputs[key] = { input, valueEl, decimals };
    wrap.appendChild(labelRow);
    wrap.appendChild(input);
    return wrap;
  }

  _makeButton(label, onClick) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText = `
      width:100%; padding:6px 9px; background:rgba(255,255,255,0.04);
      border:1px solid rgba(255,255,255,0.09); color:rgba(255,255,255,0.4);
      font-family:'Courier New',monospace; font-size:8px; letter-spacing:.12em;
      text-transform:uppercase; cursor:pointer; text-align:left; transition:all 0.12s;
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(232,213,160,0.07)';
      btn.style.color = 'rgba(232,213,160,0.8)';
      btn.style.borderColor = 'rgba(232,213,160,0.2)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(255,255,255,0.04)';
      btn.style.color = 'rgba(255,255,255,0.4)';
      btn.style.borderColor = 'rgba(255,255,255,0.09)';
    });
    btn.addEventListener('click', onClick);
    return btn;
  }

  _apply(key, val) {
    const r = this._renderer;
    if (!r) return;

    switch (key) {
      case 'exposure':
        r.renderer.toneMappingExposure = val;
        break;
      case 'bloomStrength':
        if (r.bloomPass) r.bloomPass.strength = val;
        break;
      case 'bloomRadius':
        if (r.bloomPass) r.bloomPass.radius = val;
        break;
      case 'bloomThreshold':
        if (r.bloomPass) r.bloomPass.threshold = val;
        break;

      case 'fogDensity':
        if (r.scene.fog) {
          if (r.scene.fog.isFogExp2) {
            r.scene.fog.density = this._baseFogDensity * val;
          } else {
            const base = this._baseFogLinear || { near: 55, far: 155 };
            r.scene.fog.near = base.near / Math.max(0.05, val);
            r.scene.fog.far = base.far / Math.max(0.05, val);
          }
        }
        break;
      case 'fogNear':
        if (r.scene.fog && !r.scene.fog.isFogExp2) r.scene.fog.near = val;
        break;
      case 'fogFar':
        if (r.scene.fog && !r.scene.fog.isFogExp2) r.scene.fog.far = val;
        break;

      case 'ambientIntensity':
        if (r._lights.ambient) r._lights.ambient.intensity = val;
        break;
      case 'dirIntensity':
        if (r._lights.dir) r._lights.dir.intensity = val;
        break;
      case 'fillIntensity':
        if (r._lights.fill) r._lights.fill.intensity = val;
        break;
      case 'hemiIntensity':
        if (r._lights.hemi) r._lights.hemi.intensity = val;
        break;
      case 'coreIntensity':
        this._coreMult = val;
        if (r._lights.core) {
          r._lights.core.intensity = val;
        }
        if (r._lights.coreSpread) {
          r._lights.coreSpread.intensity = val * 0.45;
        }
        break;
      case 'underIntensity':
        if (r._lights.under) r._lights.under.intensity = val;
        break;
    }
  }

  _applyAll() {
    for (const [key, val] of Object.entries(this.values)) {
      this._apply(key, val);
    }
  }

  syncToArchetype(archetype) {
    this._archetype = archetype;

    const label = document.getElementById('tuner-archetype');
    if (label) label.textContent = `ARCHETYPE: ${archetype.id}`;

    this._baseFogDensity = 0.005 * (archetype?.fogDensity ?? 1.0);
    this._baseFogLinear = {
      near: archetype?.fogNear ?? 55,
      far: archetype?.fogFar ?? 155,
    };

    if (this._presets[archetype.id]) {
      this._loadValues(this._presets[archetype.id]);
      console.log(`%c[TUNER] Loaded saved preset for ${archetype.id}`, 'color:#e8d5a0;');
    } else {
      this._loadValues(ARCHETYPE_DEFAULTS[archetype.id] ?? ARCHETYPE_DEFAULTS._DEFAULT);
    }
  }

  _loadValues(vals) {
    for (const [key, val] of Object.entries(vals)) {
      if (this.values[key] === undefined) continue;
      this.values[key] = val;
      const inp = this._inputs[key];
      if (inp) {
        inp.input.value = val;
        inp.valueEl.textContent = Number(val).toFixed(inp.decimals ?? 2);
      }
    }
    this._applyAll();
    this._updatePreview();
  }

  savePresetForCurrent() {
    if (!this._archetype) return;
    this._presets[this._archetype.id] = { ...this.values };
    this._updatePresetDisplay();
    console.log(`%c[TUNER] Preset saved: ${this._archetype.id}`, 'color:#e8d5a0; font-weight:bold;', JSON.stringify(this.values, null, 2));
  }

  resetToDefaults() {
    const defaults = ARCHETYPE_DEFAULTS[this._archetype?.id] ?? ARCHETYPE_DEFAULTS._DEFAULT;
    this._loadValues(defaults);
    console.log('%c[TUNER] Reset to archetype defaults', 'color:#e8d5a0;', defaults);
  }

  exportPreset() {
    const out = {
      archetype: this._archetype?.id ?? 'UNKNOWN',
      timestamp: new Date().toISOString(),
      values: { ...this.values },
      allPresets: { ...this._presets },
    };

    const json = JSON.stringify(out, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `basilica-render-${(this._archetype?.id ?? 'preset').toLowerCase()}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    return out;
  }

  copyToClipboard() {
    const json = JSON.stringify(this.values, null, 2);
    navigator.clipboard.writeText(json)
      .then(() => console.log('%c[TUNER] Copied to clipboard', 'color:#80c060;'))
      .catch(() => console.log('%c[TUNER] Copy failed — see console:', 'color:#cc4444;', json));
  }

  _updatePreview() {
    if (!this._previewEl) return;
    this._previewEl.textContent = Object.entries(this.values)
      .map(([k, v]) => `${k.padEnd(17)}: ${Number(v).toFixed(3)}`)
      .join('\n');
  }

  _updatePresetDisplay() {
    if (!this._presetDisplay) return;
    const keys = Object.keys(this._presets);
    this._presetDisplay.textContent = keys.length
      ? keys.map(k => `[${k}] saved`).join('\n')
      : '(none saved)';
  }

  get coreMult() {
    return this._coreMult;
  }

  toggle() {
    this._visible = !this._visible;
    this._panel.style.display = this._visible ? 'block' : 'none';
    if (this._visible) this._updatePreview();
  }

  _bindKey() {
    window.addEventListener('keydown', (e) => {
      const tag = document.activeElement?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;
      if (typing) return;

      if (e.key.toLowerCase() === 't') this.toggle();
      if (e.key.toLowerCase() === 'x') this.exportPreset();
    });
  }
}