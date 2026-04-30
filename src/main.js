// src/main.js
import './style.css'
import {
  identity,
  contactLinks,
  featuredProjects,
  inProgressProjects,
  exhibitedWorks,
  externalLinks,
  appRegistry,
} from './data/portfolio-data.js'

// ═══════════════════════════════════════════════════════════════
// 0. HELPERS UX
// ═══════════════════════════════════════════════════════════════
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const resizeCallbacks = new Set()

function getRectSize(el) {
  const rect = el?.getBoundingClientRect?.()
  return {
    width: Math.max(1, Math.round(rect?.width || el?.clientWidth || 1)),
    height: Math.max(1, Math.round(rect?.height || el?.clientHeight || 1)),
  }
}

function registerResize(callback) {
  resizeCallbacks.add(callback)
  callback()
  return () => resizeCallbacks.delete(callback)
}

let resizeRaf = 0
window.addEventListener(
  'resize',
  () => {
    cancelAnimationFrame(resizeRaf)
    resizeRaf = requestAnimationFrame(() => {
      resizeCallbacks.forEach(cb => cb())
    })
  },
  { passive: true }
)

function createViewportController(element, { onEnter, onLeave, threshold = 0.12 } = {}) {
  if (!element) return null

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) onEnter?.(entry)
        else onLeave?.(entry)
      })
    },
    { threshold }
  )

  observer.observe(element)
  return observer
}

function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href')
      if (!href || href === '#') return
      const target = document.querySelector(href)
      if (!target) return

      event.preventDefault()
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      })
    })
  })
}

function setupRevealObserver() {
  const items = [...document.querySelectorAll('[data-reveal]')]
  if (!items.length) return

  items.forEach((el, i) => {
    el.style.setProperty('--delay', `${i * 45}ms`)
  })

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('revealed')
        observer.unobserve(entry.target)
      })
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -6% 0px',
    }
  )

  items.forEach(el => observer.observe(el))
}

// ═══════════════════════════════════════════════════════════════
// 1. CURSOR
// ═══════════════════════════════════════════════════════════════
const cursor = document.getElementById('cursor')
if (cursor && window.matchMedia('(pointer:fine)').matches) {
  document.addEventListener(
    'mousemove',
    e => {
      cursor.style.left = `${e.clientX}px`
      cursor.style.top = `${e.clientY}px`
    },
    { passive: true }
  )
}

// ═══════════════════════════════════════════════════════════════
// 2. CANVAS GÉNÉRATIF CENTRAL — fusion Claude + helpers robustes
// ═══════════════════════════════════════════════════════════════
;(function initCanvas() {
  const canvas = document.getElementById('canvas-main')
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const INK = '#0a0a09'
  const PAPER = '#f2f0e8'
  const GRID = 'rgba(10,10,9,0.04)'
  const DPR_MAX = 2
  const LINES = 28
  const SPEED = prefersReducedMotion ? 0 : 0.0004

  let t = 0
  let isVisible = true

  function resizeCanvas() {
    const parent = canvas.parentElement || canvas
    const { width, height } = getRectSize(parent)
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX)

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  registerResize(resizeCanvas)

  createViewportController(canvas, {
    threshold: 0.05,
    onEnter: () => {
      isVisible = true
    },
    onLeave: () => {
      isVisible = false
    },
  })

  function noise(x, y, time) {
    return (
      Math.sin(x * 1.8 + time) * Math.cos(y * 1.4 - time * 0.7) +
      Math.sin(x * 0.9 - time * 0.5) * Math.sin(y * 2.1 + time * 0.3)
    )
  }

  function drawGrid(W, H) {
    ctx.strokeStyle = GRID
    ctx.lineWidth = 0.5

    const grid = 48
    for (let x = 0; x < W; x += grid) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }

    for (let y = 0; y < H; y += grid) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }
  }

  function drawMarkers(W, H) {
    const markers = [
      { x: W * 0.2, y: H * 0.3 },
      { x: W * 0.65, y: H * 0.7 },
      { x: W * 0.8, y: H * 0.2 },
    ]

    ctx.strokeStyle = INK
    ctx.lineWidth = 1

    markers.forEach(m => {
      const s = 6
      ctx.beginPath()
      ctx.moveTo(m.x - s, m.y)
      ctx.lineTo(m.x + s, m.y)
      ctx.moveTo(m.x, m.y - s)
      ctx.lineTo(m.x, m.y + s)
      ctx.stroke()
    })
  }

  function draw() {
    requestAnimationFrame(draw)
    if (!isVisible) return

    const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX)
    const W = canvas.width / dpr
    const H = canvas.height / dpr

    if (!prefersReducedMotion) t += SPEED

    ctx.fillStyle = PAPER
    ctx.fillRect(0, 0, W, H)

    drawGrid(W, H)

    for (let i = 0; i < LINES; i++) {
      const yStart = (i / LINES) * H
      let x = 0
      let y = yStart

      ctx.beginPath()
      ctx.moveTo(x, y)

      const alpha = prefersReducedMotion
        ? 0.14
        : 0.08 + (Math.sin(i * 0.4 + t * 2) * 0.5 + 0.5) * 0.25

      ctx.strokeStyle = `rgba(10,10,9,${alpha})`
      ctx.lineWidth = i % 5 === 0 ? 1 : 0.5

      for (let step = 0; step < 180; step++) {
        const nx = x / W
        const ny = y / H
        const angle = noise(nx * 3, ny * 3, t) * Math.PI * 2
        const speed = prefersReducedMotion ? 3 : 3.5 + Math.sin(i * 0.7) * 1.5

        x += Math.cos(angle) * speed
        y += Math.sin(angle) * speed * 0.5

        if (x < 0 || x > W || y < 0 || y > H) break
        ctx.lineTo(x, y)
      }

      ctx.stroke()
    }

    drawMarkers(W, H)
  }

  draw()
})()

// ═══════════════════════════════════════════════════════════════
// 3. NAV / HERO DATA
// ═══════════════════════════════════════════════════════════════
const navLogo = document.getElementById('nav-logo')
if (navLogo) {
  navLogo.textContent = `${identity.name?.split(' ')[0] || 'Portfolio'} —`
}

const heroTag = document.getElementById('hero-tag')
if (heroTag) {
  heroTag.textContent = `— ${identity.name || 'Portfolio'}`
}

const heroSub = document.getElementById('hero-sub')
if (heroSub) {
  heroSub.textContent = identity.subtitle || identity.tagline || ''
}

const navStatusText = document.getElementById('nav-status-text')
if (navStatusText) {
  navStatusText.textContent = identity.status?.label || 'Disponible'
}

// Stats
const activeCount = featuredProjects.filter(p => p.status !== 'exhibited').length
const expoCount = exhibitedWorks.length
const appsTotal = appRegistry.reduce((acc, c) => acc + c.apps.length, 0)

const statActive = document.getElementById('stat-active')
const statExpos = document.getElementById('stat-expos')
const statApps = document.getElementById('stat-apps')
const statYear = document.getElementById('stat-year')

if (statActive) statActive.textContent = activeCount
if (statExpos) statExpos.textContent = expoCount
if (statApps) statApps.textContent = appsTotal
if (statYear) statYear.textContent = new Date().getFullYear()

// Ticker
const ticker = document.getElementById('ticker')
if (ticker) {
  const msg = `Art génératif & code   //   Systèmes autonomes   //   ${identity.name || 'Portfolio'}   //   Basé en France`
  const rep = Array.from({ length: 8 }, () => `<span>${msg}</span>`).join('')
  ticker.innerHTML = rep + rep
}

// ═══════════════════════════════════════════════════════════════
// 4. IDENTITÉ
// ═══════════════════════════════════════════════════════════════
const idName = document.getElementById('identity-name')
if (idName) idName.textContent = identity.name || ''

const idBio = document.getElementById('identity-bio')
if (idBio) idBio.textContent = identity.bio || identity.subtitle || ''

const idLinks = document.getElementById('identity-links')
if (idLinks) {
  contactLinks.forEach(link => {
    const a = document.createElement('a')
    a.href = link.href
    a.className = 'identity-link'
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.dataset.reveal = ''
    a.innerHTML = `
      <span class="link-type">${link.label}</span>
      <span class="link-val">${link.value}</span>
      <span class="link-arrow">↗</span>
    `
    idLinks.appendChild(a)
  })
}

const statusText = document.getElementById('status-text')
if (statusText) statusText.textContent = identity.status?.label || 'Disponible'

const statusAvail = document.getElementById('status-avail')
if (statusAvail) {
  statusAvail.textContent = 'Disponible pour collaborations, résidences et commandes.'
}

// ═══════════════════════════════════════════════════════════════
// 5. PROJETS
// ═══════════════════════════════════════════════════════════════
const projetsList = document.getElementById('projets-list')
const projetsCount = document.getElementById('projets-count')

if (projetsCount) projetsCount.textContent = `${featuredProjects.length} projets`

const statusMap = {
  published: 'badge--live',
  exhibited: 'badge--exhibited',
  in_progress: 'badge--wip',
}

if (projetsList) {
  featuredProjects.forEach((p, i) => {
    const a = document.createElement('a')
    a.href = p.href
    a.className = 'projet-row'
    a.dataset.reveal = ''
    a.innerHTML = `
      <span class="p-idx">${String(i + 1).padStart(2, '0')}</span>
      <span class="p-title">${p.title}</span>
      <span class="p-medium">${p.medium}</span>
      <span class="p-year">${p.year}</span>
      <span class="p-status"><span class="badge ${statusMap[p.status] || 'badge--wip'}">${p.status}</span></span>
      <span class="projet-arrow">↗</span>
    `
    projetsList.appendChild(a)
  })
}

// ═══════════════════════════════════════════════════════════════
// 6. WIP
// ═══════════════════════════════════════════════════════════════
const wipGrid = document.getElementById('wip-grid')
if (wipGrid) {
  inProgressProjects.forEach((p, i) => {
    const div = document.createElement('div')
    div.className = 'wip-card'
    div.dataset.reveal = ''
    div.innerHTML = `
      <div class="wip-title">${p.title}</div>
      <div class="wip-medium">${p.medium}</div>
      <p class="wip-note">${p.note}</p>
      <div class="wip-progress">
        <div class="wip-track"><div class="wip-fill" style="width:${p.progress}%"></div></div>
        <span class="wip-pct">${p.progress}</span>
      </div>
    `
    wipGrid.appendChild(div)
  })
}

// ═══════════════════════════════════════════════════════════════
// 7. EXPOSITIONS
// ═══════════════════════════════════════════════════════════════
const expoList = document.getElementById('expo-list')
if (expoList) {
  exhibitedWorks.forEach((w, i) => {
    const div = document.createElement('div')
    div.className = 'expo-row'
    div.dataset.reveal = ''
    div.innerHTML = `
      <div class="expo-year">${w.year}</div>
      <div>
        <div class="expo-title">${w.title}</div>
        <div class="expo-venue">${w.venue}</div>
        <div class="expo-tags">
          <span class="expo-tag">${w.medium}</span>
          <span class="expo-tag">${w.duration}</span>
        </div>
      </div>
      <div class="expo-dur">${w.location || ''}</div>
    `
    expoList.appendChild(div)
  })
}

// ═══════════════════════════════════════════════════════════════
// 8. APPS
// ═══════════════════════════════════════════════════════════════
const appsEl = document.getElementById('apps-categories')
const appsCount = document.getElementById('apps-count')
if (appsCount) appsCount.textContent = `${appsTotal} expériences`

if (appsEl) {
  appRegistry.forEach((cat, ci) => {
    const div = document.createElement('div')
    div.className = 'apps-cat'
    div.dataset.reveal = ''
    const linksHTML = cat.apps
      .map(
        a => `
      <a href="${a.href}" class="app-link" target="_blank" rel="noopener noreferrer">
        <span class="app-title">${a.title}</span>
        <span class="app-year">${a.year}</span>
        <span class="badge ${a.status === 'live' ? 'badge--live' : 'badge--wip'}">${a.status}</span>
        <span class="app-arrow">↗</span>
      </a>
    `
      )
      .join('')

    div.innerHTML = `
      <div class="apps-cat-label">${cat.label}</div>
      <div class="apps-cat-accent"></div>
      <p class="apps-cat-desc">${cat.description}</p>
      ${linksHTML}
    `
    appsEl.appendChild(div)
  })
}

// ═══════════════════════════════════════════════════════════════
// 9. LIENS EXTERNES
// ═══════════════════════════════════════════════════════════════
const linksEl = document.getElementById('links-list')
if (linksEl) {
  externalLinks.forEach(l => {
    const a = document.createElement('a')
    a.href = l.href
    a.className = 'ext-link'
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.dataset.reveal = ''
    a.innerHTML = `
      <div>
        <div class="ext-type">${l.type}</div>
        <div class="ext-label">${l.label}</div>
      </div>
      <span class="ext-arrow">↗</span>
    `
    linksEl.appendChild(a)
  })
}

// ═══════════════════════════════════════════════════════════════
// 10. FOOTER
// ═══════════════════════════════════════════════════════════════
const footerYear = document.getElementById('footer-year')
if (footerYear) {
  footerYear.textContent = `© ${new Date().getFullYear()} — Tous droits réservés`
}

// ═══════════════════════════════════════════════════════════════
// 11. NAV SCROLL
// ═══════════════════════════════════════════════════════════════
const nav = document.querySelector('nav')
if (nav) {
  window.addEventListener(
    'scroll',
    () => {
      nav.style.background = window.scrollY > 24 ? 'rgba(242,240,232,0.96)' : 'var(--paper)'
    },
    { passive: true }
  )
}

// ═══════════════════════════════════════════════════════════════
// 12. FOOTER SCROLL TOP
// ═══════════════════════════════════════════════════════════════
document.querySelector('.footer-scroll')?.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
  })
})

// ═══════════════════════════════════════════════════════════════
// 13. BOOT
// ═══════════════════════════════════════════════════════════════
setupSmoothScroll()
setupRevealObserver()