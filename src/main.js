import './style.css'
import { identity } from './data/portfolio-data.js'
import { mountHome } from './views/home.js'
import { appRoutes } from './router/app-routes.js'

const cursor = document.getElementById('cursor')
if (cursor && window.matchMedia('(pointer:fine)').matches) {
  document.addEventListener('mousemove', e => {
    cursor.style.left = `${e.clientX}px`
    cursor.style.top = `${e.clientY}px`
  }, { passive: true })
}

const navLogo = document.getElementById('nav-logo')
if (navLogo) navLogo.textContent = `${identity.name?.split(' ')[0] || 'Portfolio'} —`

const navStatusText = document.getElementById('nav-status-text')
if (navStatusText) navStatusText.textContent = identity.status?.label || 'Disponible'

const shell = document.getElementById('app-shell')
let currentUnmount = null
let currentRoute = null

function parseHash(hash) {
  const raw = hash || '#/'
  const withoutFirstHash = raw.startsWith('#') ? raw.slice(1) : raw
  const secondHashIndex = withoutFirstHash.indexOf('#')

  if (secondHashIndex === -1) {
    return {
      route: `#${withoutFirstHash || '/'}`,
      anchor: null,
    }
  }

  return {
    route: `#${withoutFirstHash.slice(0, secondHashIndex) || '/'}`,
    anchor: withoutFirstHash.slice(secondHashIndex + 1) || null,
  }
}

function scrollToAnchor(anchor) {
  if (!anchor) return
  requestAnimationFrame(() => {
    const el = document.getElementById(anchor)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
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
    const appId = appMatch[1]
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