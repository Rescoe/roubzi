// src/apps/basilica-core/preview.js
// ─────────────────────────────────────────────────────────────────
// Preview légère de BASILICA CORE, montée dans le hero de la home.
// Doit être rapide, sobre, déontable proprement.
// ─────────────────────────────────────────────────────────────────

const DPR_MAX = 2
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Monte le preview dans le container fourni.
 * @param {HTMLElement} container
 * @returns {() => void} unmount
 */
export function mountBasilicaPreview(container) {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;'
  container.style.position = 'relative'
  container.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  let rafId = null
  let t = 0
  let running = true

  const io = new IntersectionObserver(entries => {
    running = entries[0].isIntersecting
  }, { threshold: 0.05 })
  io.observe(canvas)

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX)
    const w = container.clientWidth
    const h = container.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  window.addEventListener('resize', resize)
  resize()

  // Système BASILICA : grille de cellules dont l'intensité suit une onde
  // tirée de la logique architecturale du projet
  function draw() {
    rafId = requestAnimationFrame(draw)
    if (!running) return

    if (!prefersReducedMotion) t += 0.012

    const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX)
    const W = canvas.width / dpr
    const H = canvas.height / dpr

    ctx.fillStyle = '#f2f0e8'
    ctx.fillRect(0, 0, W, H)

    const cols = 18
    const rows = Math.ceil((H / W) * cols)
    const cellW = W / cols
    const cellH = H / rows

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const dist = Math.hypot(c - cols / 2, r - rows / 2)
        const wave = Math.sin(dist * 0.55 - t * 1.8) * 0.5 + 0.5
        const fade = 1 - dist / (Math.hypot(cols, rows) * 0.5)
        const alpha = wave * fade * 0.85

        ctx.fillStyle = `rgba(10,10,9,${alpha})`
        const pad = 2
        ctx.fillRect(
          c * cellW + pad,
          r * cellH + pad,
          cellW - pad * 2,
          cellH - pad * 2
        )
      }
    }

    // Marqueur central
    const cx = W / 2, cy = H / 2
    ctx.strokeStyle = '#ff3a1a'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy)
    ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8)
    ctx.stroke()
  }

  draw()

  return function unmount() {
    cancelAnimationFrame(rafId)
    io.disconnect()
    window.removeEventListener('resize', resize)
    canvas.remove()
  }
}
