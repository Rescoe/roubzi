// src/views/home.js
import {
  identity,
  contactLinks,
  featuredProjects,
  inProgressProjects,
  exhibitedWorks,
  externalLinks,
  appRegistry,
} from '../data/portfolio-data.js'
import { computeStats } from '../data/stats.js'
import { pickRandomPreview } from '../router/hero-previews.js'

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ── HTML STATIQUE DE LA HOME ─────────────────────────────────────
function buildHomeHTML() {
  return `
<!-- HERO -->
<section class="hero" id="hero">
  <div class="hero-body wrap">
    <div class="hero-left">
      <div class="hero-tag">— ${identity.name || 'Portfolio'}</div>
      <h1 class="hero-title">
        Art<br/>
        <em>génératif</em><br/>
        &amp; code
      </h1>
      <p class="hero-sub">${identity.subtitle || identity.tagline || ''}</p>
      <div class="hero-cta">
        <a href="#/portfolio#experiences" class="btn-primary">Voir les apps ↗</a>
        <a href="#/portfolio#projets" class="btn-ghost">Projets →</a>
      </div>
    </div>
    <div class="hero-right" id="hero-preview-mount">
      <span class="hero-canvas-label" id="hero-preview-label"></span>
    </div>
  </div>
  <div class="hero-footer wrap" id="hero-stats"></div>
</section>

<!-- TICKER -->
<div class="ticker-wrap">
  <div class="ticker-inner" id="ticker"></div>
</div>

<!-- IDENTITÉ -->
<section id="identite">
  <div class="section-header wrap">
    <span class="section-num">01</span>
    <span class="section-title">Identité</span>
    <span class="section-meta">Artiste · Développeur</span>
  </div>
  <div class="identity-grid wrap">
    <div class="identity-left">
      <h2 class="identity-name">${identity.name || ''}</h2>
      <p class="identity-bio">${identity.bio || identity.subtitle || ''}</p>
      <div class="identity-links" id="identity-links"></div>
    </div>
    <div class="identity-right">
      <div class="status-block">
        <div class="status-label">Statut actuel</div>
        <div class="status-text">${identity.status?.label || 'Disponible'}</div>
        <p class="status-avail">Disponible pour collaborations, résidences et commandes.</p>
      </div>
    </div>
  </div>
</section>

<!-- PROJETS -->
<section id="projets">
  <div class="section-header wrap">
    <span class="section-num">02</span>
    <span class="section-title">Projets sélectionnés</span>
    <span class="section-meta">${featuredProjects.length} projets</span>
  </div>
  <div class="wrap" style="padding-top:0;padding-bottom:3rem">
    <div class="projet-header-row">
      <span class="col-label">#</span>
      <span class="col-label">Titre</span>
      <span class="col-label">Médium</span>
      <span class="col-label">Année</span>
      <span class="col-label">Statut</span>
      <span class="col-label">↗</span>
    </div>
    <div id="projets-list"></div>
  </div>
</section>

<!-- WIP -->
<section id="wip">
  <div class="section-header wrap">
    <span class="section-num">03</span>
    <span class="section-title">En cours</span>
    <span class="section-meta">Work in progress</span>
  </div>
  <div class="wip-grid wrap" id="wip-grid" style="padding:0"></div>
</section>

<!-- EXPOSITIONS -->
<section id="expositions">
  <div class="section-header wrap">
    <span class="section-num">04</span>
    <span class="section-title">Expositions</span>
    <span class="section-meta">Timeline</span>
  </div>
  <div class="wrap" style="padding-bottom:3rem">
    <div id="expo-list"></div>
  </div>
</section>

<!-- APPS -->
<section id="experiences">
  <div class="section-header wrap">
    <span class="section-num">05</span>
    <span class="section-title">Applications & Expériences</span>
    <span class="section-meta" id="apps-count"></span>
  </div>
  <div class="apps-grid wrap" id="apps-categories" style="padding:0"></div>
</section>

<!-- LIENS -->
<section id="liens">
  <div class="section-header wrap">
    <span class="section-num">06</span>
    <span class="section-title">Liens</span>
    <span class="section-meta">Annexes</span>
  </div>
  <div class="ext-links wrap" id="links-list" style="padding:0"></div>
</section>

<!-- FOOTER -->
<footer>
  <span class="footer-copy">© ${new Date().getFullYear()} — Tous droits réservés</span>
  <span class="footer-scroll" id="footer-scroll">↑ Haut de page</span>
</footer>
`
}

// ── MONTAGE ─────────────────────────────────────────────────────
export function mountHome(shell) {
  shell.innerHTML = buildHomeHTML()

  const cleanups = []

  // Stats héro
  const stats = computeStats()
  const statsEl = document.getElementById('hero-stats')
  if (statsEl) {
    statsEl.innerHTML = [
      { label: 'Projets actifs', value: stats.activeProjects },
      { label: 'Expositions',    value: stats.exhibitions },
      { label: 'Applications',   value: stats.apps },
      { label: 'Année',          value: stats.year },
    ].map(s => `
      <div class="hero-stat">
        <span>${s.label}</span>
        <strong>${s.value}</strong>
      </div>
    `).join('')
  }

// Hero preview
const previewMount = document.getElementById('hero-preview-mount')
const previewLabel = document.getElementById('hero-preview-label')
let unmountPreview = null

if (previewMount) {
  const preview = pickRandomPreview()
  if (preview) {
    if (previewLabel) previewLabel.textContent = preview.label
    Promise.resolve(preview.mount(previewMount, {}))
      .then(cleanup => {
        unmountPreview = typeof cleanup === 'function' ? cleanup : null
      })
      .catch(e => {
        console.warn('Preview hero échouée', e)
        previewMount.classList.add('hero-preview-empty')
      })
  } else {
    previewMount.classList.add('hero-preview-empty')
  }
}

  // Ticker
  const ticker = document.getElementById('ticker')
  if (ticker) {
    const msg = `Art génératif & code   //   Systèmes autonomes   //   ${identity.name || 'Portfolio'}   //   Basé en France`
    const rep = Array.from({ length: 8 }, () => `<span>${msg}</span>`).join('')
    ticker.innerHTML = rep + rep
  }

  // Contact links
  const idLinks = document.getElementById('identity-links')
  if (idLinks) {
    contactLinks.forEach(link => {
      const a = document.createElement('a')
      a.href = link.href
      a.className = 'identity-link'
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.innerHTML = `
        <span class="link-type">${link.label}</span>
        <span class="link-val">${link.value}</span>
        <span class="link-arrow">↗</span>
      `
      idLinks.appendChild(a)
    })
  }

  // Projets
  const projetsList = document.getElementById('projets-list')
  const statusMap = {
    published:   'badge--live',
    exhibited:   'badge--exhibited',
    in_progress: 'badge--wip',
  }
  if (projetsList) {
    featuredProjects.forEach((p, i) => {
      const isInternal = p.routeId
      const el = document.createElement(isInternal ? 'div' : 'a')
      if (!isInternal && p.href) {
        el.href = p.href
        el.target = '_blank'
        el.rel = 'noopener noreferrer'
      }
      el.className = 'projet-row' + (isInternal || p.href ? ' projet-row--link' : '')
      el.dataset.reveal = ''
      el.innerHTML = `
        <span class="p-idx">${String(i + 1).padStart(2, '0')}</span>
        <span class="p-title">${p.title}</span>
        <span class="p-medium">${p.medium}</span>
        <span class="p-year">${p.year}</span>
        <span class="p-status"><span class="badge ${statusMap[p.status] || 'badge--wip'}">${p.status}</span></span>
        <span class="projet-arrow">↗</span>
      `
      if (isInternal) {
        el.style.cursor = 'pointer'
        el.addEventListener('click', () => {
          window.location.hash = `#/apps/${p.routeId}`
        })
      }
      projetsList.appendChild(el)
    })
  }

  // WIP
  const wipGrid = document.getElementById('wip-grid')
  if (wipGrid) {
    inProgressProjects.forEach(p => {
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

  // Expositions
  const expoList = document.getElementById('expo-list')
  if (expoList) {
    exhibitedWorks.forEach(w => {
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

  // Apps
  const appsEl = document.getElementById('apps-categories')
  const appsCountEl = document.getElementById('apps-count')
  const totalApps = appRegistry.reduce((acc, c) => acc + c.apps.length, 0)
  if (appsCountEl) appsCountEl.textContent = `${totalApps} expériences`

  if (appsEl) {
    appRegistry.forEach(cat => {
      const div = document.createElement('div')
      div.className = 'apps-cat'
      div.dataset.reveal = ''

      const linksHTML = cat.apps.map(a => {
        // lien interne via routeId, sinon href externe
        const isInternal = !!a.routeId
        const href = isInternal ? `#/apps/${a.routeId}` : (a.href || '#')
        const external = !isInternal && a.href && !a.href.startsWith('#')
        return `
          <a href="${href}" class="app-link"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>
            <span class="app-title">${a.title}</span>
            <span class="app-year">${a.year}</span>
            <span class="badge ${a.status === 'live' ? 'badge--live' : 'badge--wip'}">${a.status}</span>
            <span class="app-arrow">↗</span>
          </a>
        `
      }).join('')

      div.innerHTML = `
        <div class="apps-cat-label">${cat.label}</div>
        <div class="apps-cat-accent"></div>
        <p class="apps-cat-desc">${cat.description}</p>
        ${linksHTML}
      `
      appsEl.appendChild(div)
    })
  }

  // Liens externes
  const linksEl = document.getElementById('links-list')
  if (linksEl) {
    externalLinks.forEach(l => {
      const a = document.createElement('a')
      a.href = l.href
      a.className = 'ext-link'
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
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

  // Scroll top footer
  const footerScroll = document.getElementById('footer-scroll')
  const onFooterClick = () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
  footerScroll?.addEventListener('click', onFooterClick)
  cleanups.push(() => footerScroll?.removeEventListener('click', onFooterClick))

  // Smooth scroll ancres internes
  shell.querySelectorAll('a[href^="#/portfolio#"]').forEach(link => {
    link.addEventListener('click', e => {
      const sectionId = link.getAttribute('href').split('#').pop()
      const target = document.getElementById(sectionId)
      if (target) {
        e.preventDefault()
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' })
      }
    })
  })

  // Reveal observer
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed')
        revealObs.unobserve(entry.target)
      }
    })
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' })

  shell.querySelectorAll('[data-reveal]').forEach(el => revealObs.observe(el))
  cleanups.push(() => revealObs.disconnect())

  // Nav scroll
  const nav = document.getElementById('site-nav')
  const onNavScroll = () => {
    if (!nav) return
    nav.style.background = window.scrollY > 24 ? 'rgba(242,240,232,0.96)' : ''
  }
  window.addEventListener('scroll', onNavScroll, { passive: true })
  cleanups.push(() => window.removeEventListener('scroll', onNavScroll))

  // ── UNMOUNT ───────────────────────────────────────────────────
  return function unmountHome() {
    if (typeof unmountPreview === 'function') unmountPreview()
    cleanups.forEach(fn => fn())
    shell.innerHTML = ''
  }
}
