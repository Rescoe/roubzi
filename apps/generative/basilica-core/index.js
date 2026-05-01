// src/apps/basilica-core/index.js
// ─────────────────────────────────────────────────────────────────
// Point d'entrée de BASILICA CORE dans le shell.
// Expose mount(container, context) → unmount()
// ─────────────────────────────────────────────────────────────────

/**
 * Monte BASILICA CORE dans le container fourni par le router.
 * @param {HTMLElement} container
 * @param {object} context - { identity, ... } passé par le router
 * @returns {() => void} unmount
 */
export function mount(container, context = {}) {
  // Wrapper de vue avec nav retour
  container.innerHTML = `
    <div class="app-view" id="basilica-view">
      <div class="app-view-header wrap">
        <a href="#/" class="app-back-link">← Portfolio</a>
        <div class="app-view-meta">
          <span class="app-view-title">BASILICA CORE</span>
          <span class="app-view-year">2026 · Génératif · Temps réel</span>
        </div>
      </div>
      <div class="app-view-body" id="basilica-body"></div>
    </div>
  `

  const body = document.getElementById('basilica-body')
  const cleanups = []

  // Initialise l'app BASILICA CORE dans son container
  let basilicaUnmount = null
  import('./app.js')
    .then(mod => {
      basilicaUnmount = mod.initBasilicaCore(body, context)
    })
    .catch(err => {
      console.error('BASILICA CORE failed to load', err)
      body.innerHTML = `<div class="wrap" style="padding:4rem 0"><p>Erreur de chargement de l'application.</p></div>`
    })

  // Scroll top à l'entrée
  window.scrollTo(0, 0)

  return function unmount() {
    if (typeof basilicaUnmount === 'function') basilicaUnmount()
    cleanups.forEach(fn => fn())
    container.innerHTML = ''
  }
}
