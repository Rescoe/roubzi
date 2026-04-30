// src/data/portfolio-data.js
// ─────────────────────────────────────────────────────────────────
// Source de données centrale du portfolio.
// Toutes les sections de l'index consomment ces tableaux.
// Modifier ici pour mettre à jour le contenu sans toucher au HTML.
// ─────────────────────────────────────────────────────────────────

export const identity = {
  name: 'Roubzi',
  handle: '@roubzi.art',
  tagline: "Artiste et amoureux d'art génératif",
  subtitle: "Expériences 3D, art génératif, installations phygitales",
  status: { label: 'En expérimentation', active: true },
}

// ── Liens de contact ─────────────────────────────────────────────
// Remplacer les href '#' par les vraies URLs
export const contactLinks = [
  { label: 'email',     href: 'mailto:studio@example.com',          value: 'studio@example.com' },
  { label: 'github',    href: 'https://github.com/placeholder',     value: 'github.com/placeholder' },
  { label: 'instagram', href: 'https://instagram.com/placeholder',  value: '@placeholder' },
  { label: 'x / twitter', href: 'https://x.com/placeholder',       value: '@placeholder' },
]

// ── Projets mis en avant ──────────────────────────────────────────
// status: 'published' | 'in_progress' | 'exhibited' | 'archived'
export const featuredProjects = [
  {
    id: 'p001',
    title: 'BASILICA CORE',
    year: 2026,
    medium: 'Génératif · Temps réel',
    status: 'in_progress',
    description: 'Système génératif en cours de développement autour de structures, rythmes et densités architecturales.',
    href: '/apps/generative/basilica-core/',
    tags: ['génératif', 'temps réel', 'architecture'],
  },
  {
    id: 'p002',
    title: 'MEMBRANE — Volume organique interactif',
    year: 2024,
    medium: '3D · Three.js',
    status: 'published',
    description: 'Géométrie déformable par interaction. Rendu procédural avec shaders personnalisés.',
    //href: 'apps/3d/app1/',
    tags: ['3D', 'shaders', 'interactif'],
  },
  {
    id: 'p003',
    title: 'SIGNAL — Installation lumineuse',
    year: 2023,
    medium: 'Phygital · LED · OSC',
    status: 'exhibited',
    description: 'Cartographie de données sur trame physique de LED pilotée via protocole OSC.',
    //href: 'apps/phygital/app1/',
    tags: ['phygital', 'LED', 'installation'],
  },
]

// ── Projets en cours ──────────────────────────────────────────────
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

// ── Œuvres exposées ───────────────────────────────────────────────
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

// ── Liens annexes ─────────────────────────────────────────────────
export const externalLinks = [
  { label: 'Code source — GitHub',     href: 'https://github.com/placeholder', type: 'repo' },
  { label: 'Documentation technique',  href: '#',                              type: 'doc' },
  { label: 'Archive Behance',          href: '#',                              type: 'archive' },
  { label: 'NFT / On-chain works',     href: '#',                              type: 'web3' },
  { label: 'Contact studio',           href: 'mailto:studio@example.com',      type: 'contact' },
]

// ── Registre des apps ─────────────────────────────────────────────
// Utilisé pour construire la section "expériences" de l'index.
// Pour référencer une nouvelle app : ajouter un objet ici.
export const appRegistry = [
  {
    category: '3d',
    label: '3D · Volume',
    description: 'Explorations volumiques, sculptures numériques et scènes immersives.',
    projectCount: 2,
    apps: [
				{
				  id: 'gen-basilica-core',
				  title: 'BASILICA CORE',
				  href: '/apps/generative/basilica-core/',
				  status: 'live',
				  year: 2026,
				},
				{ id: '3d-app2', title: 'LATTICE v.2', href: 'apps/3d/app2/',   status: 'live',   year: 2024 },
    ],
  },
  /*
  {
    category: 'generative',
    label: 'Génératif · 2D',
    description: 'Systèmes autonomes, algorithmes de croissance et patterns procéduraux.',
    projectCount: 2,
    apps: [
      { id: 'gen-app1', title: 'FIELD',   href: 'apps/generative/app1/', status: 'live',   year: 2024 },
      { id: 'gen-app2', title: 'DRIFT',   href: 'apps/generative/app2/', status: 'live',   year: 2023 },
    ],
  },
  {
    category: 'phygital',
    label: 'Phygital · Installation',
    description: 'Passerelles entre espace physique et signal numérique. Mapping, LED, capteurs.',
    projectCount: 2,
    apps: [
      { id: 'phy-app1', title: 'SIGNAL',   href: 'apps/phygital/app1/', status: 'live',   year: 2023 },
      { id: 'phy-app2', title: 'STRATA',   href: 'apps/phygital/app2/', status: 'wip',    year: 2024 },
    ],
  },
  */
]
