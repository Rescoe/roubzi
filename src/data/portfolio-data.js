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
  tagline: "Artiste et amoureux d'art génératif",
  subtitle: "Expériences 3D, art génératif, installations phygitales",
  status: { label: 'En expérimentation', active: true },
}

export const contactLinks = [
  { label: 'email',       href: 'mailto:studio@example.com',         value: 'studio@example.com' },
  { label: 'github',      href: 'https://github.com/placeholder',    value: 'github.com/placeholder' },
  { label: 'instagram',   href: 'https://instagram.com/placeholder', value: '@placeholder' },
  { label: 'x / twitter', href: 'https://x.com/placeholder',        value: '@placeholder' },
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
    description: 'Système génératif autour de structures, rythmes et densités architecturales.',
    routeId: 'basilica-core',
    tags: ['génératif', 'temps réel', 'architecture'],
  },
  {
    id: 'p002',
    title: 'MEMBRANE — Volume organique interactif',
    year: 2024,
    medium: '3D · Three.js',
    status: 'published',
    description: 'Géométrie déformable par interaction. Rendu procédural avec shaders.',
    // routeId: 'membrane',  ← décommenter quand disponible
    tags: ['3D', 'shaders', 'interactif'],
  },
  {
    id: 'p003',
    title: 'SIGNAL — Installation lumineuse',
    year: 2023,
    medium: 'Phygital · LED · OSC',
    status: 'exhibited',
    description: 'Cartographie de données sur trame physique de LED via protocole OSC.',
    tags: ['phygital', 'LED', 'installation'],
  },
]

export const inProgressProjects = [
  {
    id: 'wip001',
    title: 'TOPOLOGY — Réseau de flux',
    medium: '3D · Données · Web3',
    progress: 42,
    note: 'Structure topologique de transactions on-chain visualisées en 3D.',
  },
  {
    id: 'wip002',
    title: 'ECHO — Archive générative',
    medium: 'Génératif · ML · Archive',
    progress: 18,
    note: "Reconstruction générative d'archives photographiques via diffusion guidée.",
  },
  {
    id: 'wip003',
    title: 'STRATA — Cartographie physique',
    medium: 'Phygital · Mapping',
    progress: 67,
    note: 'Projection vidéo sur volume sculptural. Prototype en cours de calibration.',
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
    title: 'DRIFT — Flux génératif',
    year: 2023,
    venue: 'Festival Art & Code — Bordeaux',
    medium: 'Projection générative · 4K',
    duration: '2 jours',
  },
  {
    id: 'e003',
    title: 'LATTICE — Réseau en volume',
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
    medium: 'WebGL · Algorithme de réaction-diffusion',
    duration: '∞ (permanent)',
  },
]

export const externalLinks = [
  { label: 'Code source — GitHub',    href: 'https://github.com/placeholder', type: 'repo' },
  { label: 'Documentation technique', href: '#',                               type: 'doc' },
  { label: 'Archive Behance',         href: '#',                               type: 'archive' },
  { label: 'NFT / On-chain works',    href: '#',                               type: 'web3' },
  { label: 'Contact studio',          href: 'mailto:studio@example.com',       type: 'contact' },
]

// routeId → route interne #/apps/<routeId>
// href    → lien externe
export const appRegistry = [
  {
    category: 'generative',
    label: 'Génératif · Temps réel',
    description: 'Systèmes génératifs, structures évolutives et compositions algorithmiques.',
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
    description: 'Explorations volumiques, sculptures numériques et scènes immersives.',
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
  /*
  {
    category: 'phygital',
    label: 'Phygital · Installation',
    description: 'Passerelles entre espace physique et signal numérique.',
    apps: [
      { id: 'phy-signal', title: 'SIGNAL', routeId: 'signal', status: 'live', year: 2023 },
    ],
  },
  */
]
