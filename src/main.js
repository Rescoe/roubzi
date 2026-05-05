// main.js — Portfolio Risograph Brutaliste
// Logique métier inchangée, design entièrement refondu

import './style.css'
import { identity } from './data/portfolio-data.js'
import { mountHome } from './views/home.js'
import { appRoutes } from './router/app-routes.js'

/* ═══════════════════════════════════════════════════════
   CURSEUR CUSTOM — croix de visée
   ═══════════════════════════════════════════════════════ */
const cursorRing = document.getElementById('cursor-ring')
const cursorDot  = document.getElementById('cursor-dot')

if (cursorRing && cursorDot && window.matchMedia('(pointer:fine)').matches) {
  let rx = 0, ry = 0, dx = 0, dy = 0
  let raf

  document.addEventListener('mousemove', e => {
    dx = e.clientX
    dy = e.clientY
    cursorDot.style.left  = `${dx}px`
    cursorDot.style.top   = `${dy}px`
    if (!raf) raf = requestAnimationFrame(lerp)
  }, { passive: true })

  function lerp() {
    rx += (dx - rx) * .14
    ry += (dy - ry) * .14
    cursorRing.style.left = `${rx}px`
    cursorRing.style.top  = `${ry}px`
    raf = Math.abs(rx - dx) > .2 || Math.abs(ry - dy) > .2
      ? requestAnimationFrame(lerp)
      : null
  }

  // État hover
  document.addEventListener('mouseover', e => {
    if (e.target.closest('a,button,[role="button"]')) {
      document.body.classList.add('cursor-hover')
    }
  })
  document.addEventListener('mouseout', e => {
    if (e.target.closest('a,button,[role="button"]')) {
      document.body.classList.remove('cursor-hover')
    }
  })
} else {
  // Fallback — masquer les éléments custom si pas de souris fine
  if (cursorRing) cursorRing.style.display = 'none'
  if (cursorDot)  cursorDot.style.display  = 'none'
  document.body.style.cursor = 'auto'
}

/* ═══════════════════════════════════════════════════════
   HAMBURGER
   ═══════════════════════════════════════════════════════ */
const hamburger  = document.getElementById('nav-hamburger')
const mobileMenu = document.getElementById('nav-mobile-menu')

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('is-open')
    hamburger.classList.toggle('is-open', open)
    hamburger.setAttribute('aria-expanded', open)
  })

  mobileMenu.querySelectorAll('.nav-mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('is-open')
      hamburger.classList.remove('is-open')
    })
  })

  document.addEventListener('click', e => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.remove('is-open')
      hamburger.classList.remove('is-open')
    }
  })
}

/* ═══════════════════════════════════════════════════════
   NAV — données identity
   ═══════════════════════════════════════════════════════ */
const navLogo = document.getElementById('nav-logo')
if (navLogo) navLogo.textContent = `${identity.name?.split(' ')[0] || 'Portfolio'} —`

const navStatusText = document.getElementById('nav-status-text')
if (navStatusText) navStatusText.textContent = identity.status?.label || 'Disponible'

/* ═══════════════════════════════════════════════════════
   ROUTER — logique inchangée
   ═══════════════════════════════════════════════════════ */
const shell = document.getElementById('app-shell')
let currentUnmount = null
let currentRoute   = null

function parseHash(hash) {
  const raw = hash || '#/'
  const withoutFirstHash = raw.startsWith('#') ? raw.slice(1) : raw
  const secondHashIndex = withoutFirstHash.indexOf('#')

  if (secondHashIndex === -1) {
    return { route: `#${withoutFirstHash || '/'}`, anchor: null }
  }
  return {
    route:  `#${withoutFirstHash.slice(0, secondHashIndex) || '/'}`,
    anchor: withoutFirstHash.slice(secondHashIndex + 1) || null,
  }
}

function scrollToAnchor(anchor) {
  if (!anchor) return
  requestAnimationFrame(() => {
    const el = document.getElementById(anchor)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

async function navigate(hash) {
  const { route, anchor } = parseHash(hash)

  if (hash === currentRoute) return
  currentRoute = hash

  if (typeof currentUnmount === 'function') {
    currentUnmount()
    currentUnmount = null
  }

  shell.innerHTML = ''

  if (route === '#/' || route === '#/portfolio' || route === '#') {
    currentUnmount = mountHome(shell)
    setNavActive(anchor || null)
    scrollToAnchor(anchor)
    return
  }

  const appMatch = route.match(/^#\/apps\/(.+)$/)
  if (appMatch) {
    const appId     = appMatch[1]
    const appLoader = appRoutes[appId]
    if (appLoader) {
      try {
        const mod = await appLoader()
        currentUnmount = mod.mount(shell, { identity })
        setNavActive(null)
        return
      } catch (err) {
        console.error(`Erreur chargement app "${appId}"`, err)
      }
    }
    shell.innerHTML = `<div class="view-404 wrap"><p>App introuvable : <code>${appId}</code></p><a href="#/" class="btn-ghost">← Retour</a></div>`
    return
  }

  currentUnmount = mountHome(shell)
  setNavActive(anchor || null)
  scrollToAnchor(anchor)
}

function setNavActive(sectionId) {
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.section === sectionId)
  })
}

window.addEventListener('hashchange', () => navigate(window.location.hash))
navigate(window.location.hash)

/* ═══════════════════════════════════════════════════════
   THREE.JS — SCÈNE HERO
   Particules en champ magnétique + plans découpés
   ═══════════════════════════════════════════════════════ */
async function initHeroScene() {
  const canvas = document.getElementById('canvas-main')
  if (!canvas) return

  let THREE
  try {
    THREE = await import('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js')
      .catch(() => window.THREE ? window.THREE : null)
  } catch {
    return
  }
  if (!THREE) return

  const W = canvas.offsetWidth  || canvas.clientWidth  || 600
  const H = canvas.offsetHeight || canvas.clientHeight || 600

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(W, H)
  renderer.setClearColor(0x0d0b09, 1)

  const scene  = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(60, W / H, .1, 100)
  camera.position.set(0, 0, 4.5)

  // Lumières
  const ambLight = new THREE.AmbientLight(0xf0ece0, .3)
  scene.add(ambLight)
  const dirLight = new THREE.DirectionalLight(0xe8280b, 1.2)
  dirLight.position.set(2, 3, 2)
  scene.add(dirLight)
  const rimLight = new THREE.PointLight(0xf5d800, .6, 10)
  rimLight.position.set(-3, -2, 1)
  scene.add(rimLight)

  // ── PARTICULES ──────────────────────────────────────────
  const N = 1800
  const positions = new Float32Array(N * 3)
  const colors    = new Float32Array(N * 3)
  const sizes     = new Float32Array(N)

  const palette = [
    new THREE.Color(0xe8280b), // riso red
    new THREE.Color(0xf5d800), // riso yellow
    new THREE.Color(0xf0ece0), // paper
    new THREE.Color(0x2a6b3c), // green
    new THREE.Color(0x0d4f8b), // blue
  ]

  for (let i = 0; i < N; i++) {
    const r = 3.5
    const theta = Math.random() * Math.PI * 2
    const phi   = Math.acos(2 * Math.random() - 1)
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta) * (Math.random() * .8 + .2)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * (Math.random() * .8 + .2)
    positions[i * 3 + 2] = r * Math.cos(phi) * (Math.random() * .8 + .2)

    const c = palette[Math.floor(Math.random() * palette.length)]
    colors[i * 3]     = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
    sizes[i] = Math.random() * 3 + .5
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3))
  geo.setAttribute('size',     new THREE.BufferAttribute(sizes,     1))

  const mat = new THREE.PointsMaterial({
    size: .04, vertexColors: true, transparent: true, opacity: .75,
    sizeAttenuation: true,
  })
  const points = new THREE.Points(geo, mat)
  scene.add(points)

  // ── PLANS GÉOMÉTRIQUES découpés ─────────────────────────
  const planeMat = new THREE.MeshStandardMaterial({
    color: 0xe8280b,
    wireframe: true,
    transparent: true,
    opacity: .15,
  })
  const planeGeo  = new THREE.IcosahedronGeometry(1.6, 1)
  const icosa = new THREE.Mesh(planeGeo, planeMat)
  scene.add(icosa)

  const torusMat = new THREE.MeshStandardMaterial({
    color: 0xf5d800,
    wireframe: true,
    transparent: true,
    opacity: .1,
  })
  const torusGeo = new THREE.TorusGeometry(2.2, .02, 8, 80)
  const torus    = new THREE.Mesh(torusGeo, torusMat)
  torus.rotation.x = Math.PI / 3
  scene.add(torus)

  const torus2 = new THREE.Mesh(
    new THREE.TorusGeometry(2.8, .015, 6, 100),
    new THREE.MeshStandardMaterial({ color: 0xf0ece0, wireframe: true, transparent: true, opacity: .06 })
  )
  torus2.rotation.y = Math.PI / 4
  scene.add(torus2)

  // ── MOUSE INTERACTION ───────────────────────────────────
  let mx = 0, my = 0
  window.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth  - .5) * 2
    my = (e.clientY / window.innerHeight - .5) * 2
  }, { passive: true })

  // ── ANIMATION ───────────────────────────────────────────
  let t = 0
  function animate() {
    requestAnimationFrame(animate)
    t += .008

    points.rotation.y = t * .12 + mx * .08
    points.rotation.x = my * .05

    icosa.rotation.y = t * .18
    icosa.rotation.z = t * .09

    torus.rotation.z  = t * .07
    torus2.rotation.x = t * .04

    camera.position.x += (mx * .4 - camera.position.x) * .04
    camera.position.y += (-my * .3 - camera.position.y) * .04
    camera.lookAt(scene.position)

    renderer.render(scene, camera)
  }
  animate()

  // Resize
  window.addEventListener('resize', () => {
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    if (!w || !h) return
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  })
}

// Lancer Three.js dès que le hero est monté
// On écoute le DOM pour s'assurer que canvas-main existe
const observer = new MutationObserver(() => {
  if (document.getElementById('canvas-main')) {
    observer.disconnect()
    initHeroScene()
  }
})
observer.observe(document.body, { childList: true, subtree: true })
// Aussi au cas où il existe déjà
if (document.getElementById('canvas-main')) {
  observer.disconnect()
  initHeroScene()
}

/* ═══════════════════════════════════════════════════════
   REVEAL ON SCROLL
   ═══════════════════════════════════════════════════════ */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('revealed')
      revealObserver.unobserve(e.target)
    }
  })
}, { threshold: .1 })

// Observer les éléments reveal quand ils arrivent dans le DOM
const shellObserver = new MutationObserver(() => {
  document.querySelectorAll('[data-reveal]:not(.revealed)').forEach(el => {
    revealObserver.observe(el)
  })
})
shellObserver.observe(document.body, { childList: true, subtree: true })