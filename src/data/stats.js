// src/data/stats.js
// ─────────────────────────────────────────────────────────────────
// Calcul centralisé des statistiques affichées dans le hero.
// Modifier ici pour changer ce qui est compté.
// ─────────────────────────────────────────────────────────────────
import { featuredProjects, exhibitedWorks, appRegistry } from './portfolio-data.js'

export function computeStats() {
  return {
    // Projets non-exposés = actifs ou en cours
    activeProjects: featuredProjects.filter(p => p.status !== 'exhibited').length,

    // Toutes les œuvres exposées
    exhibitions: exhibitedWorks.length,

    // Total des apps dans toutes les catégories
    apps: appRegistry.reduce((acc, cat) => acc + cat.apps.length, 0),

    // Année dynamique
    year: new Date().getFullYear(),
  }
}
