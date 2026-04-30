// src/components/shared.js
// ─────────────────────────────────────────────────────────────────
// Composants et utilitaires partagés entre l'index et les apps.
// Importer les fonctions nécessaires dans chaque main.js.
// ─────────────────────────────────────────────────────────────────

/**
 * Insère le bouton retour vers l'index dans le DOM.
 * Appellé depuis chaque app.
 * @param {string} label - Texte optionnel
 */
export function insertBackButton(label = 'Index') {
  const btn = document.createElement('a')
  btn.href = '../../index.html'   // remonte depuis apps/<cat>/<app>/
  btn.className = 'btn-back'
  btn.title = 'Retour au portail'
  btn.setAttribute('aria-label', "Retour à l'index du portfolio")
  // Le ::before CSS ajoute déjà '←', on ajoute juste le label
  const span = document.createElement('span')
  span.textContent = label
  btn.appendChild(span)
  document.body.appendChild(btn)
}

/**
 * Insère un overlay de métadonnées en haut à droite.
 * @param {{ title: string, year: number|string, medium: string, status?: string }} meta
 */
export function insertAppMeta(meta) {
  const overlay = document.createElement('div')
  overlay.className = 'app-ui-overlay'
  overlay.innerHTML = `
    <div></div>
    <div class="app-ui-meta">
      <span class="type-label">${meta.title}</span>
      <span class="type-meta">${meta.medium}</span>
      <span class="type-meta">${meta.year} · ${meta.status ?? 'live'}</span>
    </div>
  `
  document.body.appendChild(overlay)
}

/**
 * Formate un pourcentage de progression pour les WIP.
 * @param {number} pct
 */
export function progressBar(pct) {
  return `<div class="progress-track">
    <div class="progress-fill" style="width:${pct}%"></div>
    <span class="type-meta" style="margin-left:8px">${pct}%</span>
  </div>`
}

/**
 * Crée un canvas plein écran et le retourne.
 * @param {HTMLElement} container
 * @returns {HTMLCanvasElement}
 */
export function createFullscreenCanvas(container = document.body) {
  const canvas = document.createElement('canvas')
  canvas.className = 'canvas-fullscreen'
  container.appendChild(canvas)
  function resize() {
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)
  return canvas
}

/**
 * Anime un nombre de 0 à target (cosmétique).
 * @param {HTMLElement} el
 * @param {number} target
 * @param {number} duration ms
 */
export function countUp(el, target, duration = 1200) {
  const start = performance.now()
  function tick(now) {
    const t = Math.min((now - start) / duration, 1)
    const ease = 1 - Math.pow(1 - t, 3)
    el.textContent = Math.floor(ease * target)
    if (t < 1) requestAnimationFrame(tick)
    else el.textContent = target
  }
  requestAnimationFrame(tick)
}

/**
 * Retourne l'heure courante formatée HH:MM:SS (pour overlays live).
 */
export function liveTime() {
  const d = new Date()
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0'))
    .join(':')
}

/**
 * Observe l'entrée dans le viewport et ajoute une classe 'visible'.
 * @param {string} selector
 */
export function observeEntrance(selector = '[data-reveal]') {
  const els = document.querySelectorAll(selector)
  if (!els.length) return
  const io = new IntersectionObserver(
    (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) } }),
    { threshold: 0.1 }
  )
  els.forEach(el => io.observe(el))
}
