// src/router/hero-previews.js
// ─────────────────────────────────────────────────────────────────
// Registre des previews affichables dans le hero de la home.
// Chaque entrée doit exposer : mount(container) → unmount()
// Pour ajouter un preview : importer et pousser dans HERO_PREVIEWS.
// ─────────────────────────────────────────────────────────────────

// src/router/hero-previews.js

// src/router/hero-previews.js

export const HERO_PREVIEWS = [
  {
    id: 'basilica-core',
    label: 'BASILICA CORE · Aperçu',
    mount: async (container, context = {}) => {
      const mod = await import('/apps/generative/basilica-core/app.js')

      if (typeof mod.initBasilicaCore === 'function') {
        return mod.initBasilicaCore(container, { ...context, preview: true })
      }

      if (typeof mod.mount === 'function') {
        return mod.mount(container, { ...context, preview: true })
      }

      if (typeof mod.default === 'function') {
        return mod.default(container, { ...context, preview: true })
      }

      throw new Error('Impossible de monter l’aperçu pour basilica-core')
    },
  },
]

export function pickRandomPreview() {
  if (!HERO_PREVIEWS.length) return null
  return HERO_PREVIEWS[Math.floor(Math.random() * HERO_PREVIEWS.length)]
}