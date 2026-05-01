// src/components/shared.js
// ─────────────────────────────────────────────────────────────────
// Utilitaires partagés entre la home et les apps.
// Tous les liens "retour" utilisent désormais le hash router.
// ─────────────────────────────────────────────────────────────────

/**
 * Anime un nombre de 0 à target.
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
 * Retourne l'heure courante formatée HH:MM:SS.
 */
export function liveTime() {
  const d = new Date()
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0'))
    .join(':')
}

/**
 * Formate un pourcentage de progression.
 */
export function progressBar(pct) {
  return `<div class="progress-track">
    <div class="progress-fill" style="width:${pct}%"></div>
    <span class="type-meta" style="margin-left:8px">${pct}%</span>
  </div>`
}

/**
 * Crée un canvas plein container et le retourne.
 * Gère son propre resize. Retourne { canvas, cleanup }.
 */
export function createFullscreenCanvas(container) {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'display:block;position:absolute;inset:0;width:100%;height:100%;'
  container.style.position = 'relative'
  container.appendChild(canvas)

  function resize() {
    canvas.width  = container.clientWidth
    canvas.height = container.clientHeight || window.innerHeight
  }

  resize()
  window.addEventListener('resize', resize)

  return {
    canvas,
    cleanup: () => {
      window.removeEventListener('resize', resize)
      canvas.remove()
    },
  }
}

/**
 * Observe l'entrée dans le viewport et ajoute la classe 'revealed'.
 * Retourne disconnect().
 */
export function observeEntrance(selector = '[data-reveal]', root = document) {
  const els = root.querySelectorAll(selector)
  if (!els.length) return () => {}

  const io = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed')
        io.unobserve(e.target)
      }
    }),
    { threshold: 0.1 }
  )

  els.forEach(el => io.observe(el))
  return () => io.disconnect()
}
