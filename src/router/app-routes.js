// src/router/app-routes.js
// ─────────────────────────────────────────────────────────────────
// Registre des routes apps.
// Chaque clé correspond à l'id dans l'URL : #/apps/<id>
// Chaque valeur est un dynamic import qui renvoie { mount, unmount }
// ─────────────────────────────────────────────────────────────────

export const appRoutes = {
  'basilica-core': () => import('../../apps/generative/basilica-core/index.js'),
}
