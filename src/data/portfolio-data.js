// src/data/portfolio-data.js
// ─────────────────────────────────────────────────────────────────
// Source de données centrale du portfolio.
// Modifier ici pour mettre à jour le contenu sans toucher au JS.
//
// CONVENTION LIENS :
//   routeId  → route interne #/apps/<routeId>  (pas de target="_blank")
//   href     → lien externe                    (target="_blank")
//   ni l'un ni l'autre → non cliquable
// ─────────────────────────────────────────────────────────────────

export const identity = {
  name: 'Roubzi',
  handle: '@roubzi.art',
  tagline: "Artiste génératif, entre code, volume et signal",
  subtitle: "Systèmes visuels en temps réel, 3D et installations phygitales",
  status: { label: 'Recherche en cours', active: true },
}

export const contactLinks = [
  { label: 'email',       href: 'mailto:roubziart@gmail.com',         value: 'roubziart@gmail.com' },
  { label: 'github Rescoe',      href: 'https://github.com/Rescoe',    value: 'github.com/Rescoe' },
  { label: 'instagram',   href: 'https://www.instagram.com/roubzi_art/', value: '@roubzi_art' },
  { label: 'x / twitter', href: 'https://x.com/RoubziArt',         value: '@RoubziArt' },

]

// status: 'published' | 'in_progress' | 'exhibited' | 'archived'
// routeId : route interne dans le shell  →  #/apps/<routeId>
// href    : lien externe (nouveau tab)
export const featuredProjects = [
  {
    id: 'p001',
    title: 'BASILICA CORE',
    year: 2026,
    medium: 'Génératif · Temps réel',
    status: 'in_progress',
    description: 'Système génératif construit autour de rythmes architecturaux, de densités et de tensions spatiales.',
    routeId: 'basilica-core',
    tags: ['génératif', 'temps réel', 'structure'],
  },
  {
    id: 'p002',
    title: 'MEMBRANE',
    year: 2024,
    medium: '3D · Shaders · Interaction',
    status: 'published',
    description: 'Volume organique interactif dont la géométrie se déforme en réponse aux gestes et aux variations du signal.',
    // routeId: 'membrane',  ← décommenter quand disponible
    tags: ['3D', 'shaders', 'interactif'],
  },
  {
    id: 'p003',
    title: 'Cathodique',
    year: 2023,
    medium: 'Installation · LED · OSC',
    status: 'exhibited',
    description: 'Installation lumineuse traduisant des flux de données en composition physique sur trame de LED.',
    routeId: 'cathodique',

    tags: ['installation', 'LED', 'phygital'],
  },
]

export const inProgressProjects = [
  {
    id: 'wip001',
    title: 'TOPOLOGY',
    medium: 'Données · Réseau · 3D',
    progress: 42,
    note: 'Recherche visuelle autour de flux, de réseaux et de structures topologiques traduits en espace tridimensionnel.',
  },
  {
    id: 'wip002',
    title: 'ECHO',
    medium: 'Génératif · ML · Archive',
    progress: 18,
    note: "Travail de reconstruction et de dérive générative à partir d'archives photographiques et de corpus visuels.",
  },
  {
    id: 'wip003',
    title: 'STRATA',
    medium: 'Phygital · Mapping · Volume',
    progress: 67,
    note: 'Projection vidéo sur forme sculpturale, avec calibration en cours entre surface physique et composition numérique.',
  },
]

export const exhibitedWorks = [
  {
    id: 'e001',
    title: 'SIGNAL v.1',
    year: 2023,
    venue: 'Lieu de diffusion numérique — Paris',
    medium: 'Installation LED · 120 modules',
    duration: '3 semaines',
  },
  {
    id: 'e002',
    title: 'DRIFT',
    year: 2023,
    venue: 'Festival Art & Code — Bordeaux',
    medium: 'Projection générative · 4K',
    duration: '2 jours',
  },
  {
    id: 'e003',
    title: 'LATTICE',
    year: 2022,
    venue: 'Galerie Plateforme — Lyon',
    medium: 'Sculpture numérique · Impression 3D · WebXR',
    duration: '6 semaines',
  },
  {
    id: 'e004',
    title: 'NULL SPACE',
    year: 2022,
    venue: 'Résidence numérique — En ligne',
    medium: 'WebGL · Réaction-diffusion',
    duration: '∞ (permanent)',
  },
]

export const externalLinks = [
  { label: 'Code source — GitHub',      href: 'https://github.com/placeholder', type: 'repo' },
  { label: 'Documentation technique',   href: '#',                               type: 'doc' },
  { label: 'Archives / publications',   href: '#',                               type: 'archive' },
  { label: 'Œuvres on-chain / éditions', href: '#',                              type: 'web3' },
  { label: 'Contact studio',            href: 'mailto:studio@example.com',       type: 'contact' },
]

// routeId → route interne #/apps/<routeId>
// href    → lien externe
export const appRegistry = [
  {
    category: 'generative',
    label: 'Génératif · Temps réel',
    description: 'Systèmes visuels, structures évolutives et compositions algorithmiques en temps réel.',
    apps: [
      {
        id: 'gen-basilica-core',
        title: 'BASILICA CORE',
        routeId: 'basilica-core',
        status: 'live',
        year: 2026,
      },
    ],
  },
  {
    category: '3d',
    label: '3D · Volume',
    description: 'Explorations volumiques, sculptures numériques et espaces immersifs.',
    apps: [
      {
        id: '3d-lattice',
        title: 'LATTICE v.2',
        // routeId: 'lattice',  ← décommenter quand disponible
        status: 'live',
        year: 2024,
      },
    ],
  },
  {
    category: 'phygital',
    label: 'Phygital · Installation',
    description: 'Dispositifs où lumière, matière, signal et interaction prolongent les logiques génératives dans l’espace physique.',
    apps: [
      {
        id: 'phy-signal',
        title: 'SIGNAL',
        // routeId: 'signal', ← décommenter quand disponible
        status: 'exhibited',
        year: 2023,
      },
    ],
  },
]