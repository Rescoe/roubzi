# Roubzi
Global Apps created by Me !

Updates 01/05/2026 : 
Synthèse complète — Portfolio Shell + Basilica Core
À lire avant toute modification sur ce projet

Ce qu'est ce projet
Portfolio monorepo d'un artiste génératif (Roubzi), construit en Vite + JavaScript vanilla + ES modules. Pas de framework. L'index sert de shell SPA avec header persistant et hash routing. Les apps artistiques sont des sous-projets indépendants montés/démontés dans ce shell.

Architecture des fichiers
/
├── index.html                          ← shell HTML, nav fixe, <main id="app-shell">
├── src/
│   ├── main.js                         ← router hashchange, mount/unmount
│   ├── style.css                       ← CSS complet, brutaliste, corrections mobile
│   ├── views/
│   │   └── home.js                     ← vue home montable/démontable
│   ├── router/
│   │   ├── app-routes.js               ← { 'basilica-core': () => import(...) }
│   │   └── hero-previews.js            ← registre previews hero
│   ├── data/
│   │   ├── portfolio-data.js           ← source de vérité, routeId/href convention
│   │   └── stats.js                    ← computeStats() centralisé
│   ├── apps/
│   │   └── basilica-core/
│   │       └── index.js               ← mount(container, context) → unmount()
│   └── components/
│       └── shared.js                   ← utilitaires partagés
└── apps/
    └── generative/
        └── basilica-core/
            ├── index.html              ← entrée HTML de la vraie app
            └── src/
                └── main.js            ← orchestrateur Three.js de la vraie app
Fichier disparu de l'architecture initiale : src/apps/basilica-core/app.js — c'est le loader, il est dans apps/generative/basilica-core/app.js maintenant (à confirmer à la reprise).

Système de routing
Hash routing manuel dans src/main.js.
HashComportement#/Monte home.js#/portfolioIdem#/portfolio#projetsHome + scroll vers #projets#/apps/basilica-coreCharge app-routes.js → basilica-core/index.js
Parsing du hash : parseHash() dans src/main.js sépare route et ancre manuellement. Le scroll ancre se fait via scrollToAnchor() après mountHome().
Guard remount : if (hash === currentRoute) return évite de remonter la même vue.

Contrat API — règles à ne jamais casser
Toute app dans app-routes.js doit exposer :
jsexport function mount(container, context) → unmount()
Toute entrée dans hero-previews.js doit avoir la forme :
js{ id, label, mount(container, context) → Promise<unmount> | unmount }
home.js appelle preview.mount() via Promise.resolve() — compatible sync et async.

Loader Basilica Core (app.js)
Ce que fait le loader :

fetch du vrai /apps/generative/basilica-core/index.html avec cache: 'no-store'
Parse via DOMParser
Extrait et scope le CSS inline sur .basilica-embed-root
Injecte le body (sans scripts) dans un div.basilica-embed-root
Import dynamique du vrai src/main.js avec cache-bust ?t=Date.now() — critique pour le remount
Appelle bootBasilica(root, context) → default(root, context) → side effects seulement

Guard singleton : variable activeInstance au niveau module — si un montage est déjà actif, il est unmounté avant le suivant.
Mode preview (context.preview = true) :

CSS scopé différemment
Masque #loading, #ui-keyboard, #ui-event
Contraint le rendu au container hero


Lifecycle Basilica Core (apps/generative/basilica-core/src/main.js)
Modifications apportées au vrai main.js :

bootstrap() retourne maintenant une fonction cleanup()
La boucle RAF utilise un flag stopped et annule via cancelAnimationFrame(rafId)
Le cleanup dispose : instancing, coreEntityObj, renderer, router
Remet toutes les refs module-level à null pour éviter l'état résiduel
Export ajouté en bas du fichier :

jsexport function bootBasilica(root, context = {}) {
  return bootstrap();
}
La ligne bootstrap() isolée qui existait avant a été supprimée.

Données — conventions
Dans portfolio-data.js, deux types de liens coexistent :
jsrouteId: 'basilica-core'  // → navigation interne #/apps/basilica-core
href: 'https://...'       // → lien externe, target="_blank"
// ni l'un ni l'autre → non cliquable
Les stats du hero viennent toutes de src/data/stats.js → computeStats(). Ne pas calculer les stats ailleurs.

Direction visuelle
Brutalisme éditorial. Papier chaud #f2f0e8, encre #0a0a09, rouge accent #ff3a1a. Typographie : Unbounded (display 900) + Space Mono (mono). Zéro gradient, zéro blur. Grille de bordures 1px comme colonne vertébrale. Cursor carré rouge en mix-blend-mode: multiply.

Ce qui fonctionne à ce stade

Shell avec nav persistante ✓
Hash routing avec ancres ✓
Home montable/démontable proprement ✓
Basilica Core chargée via loader HTML+JS dans le shell ✓
Mode preview dans le hero (vraie app, pas un faux canvas) ✓
Cleanup propre au unmount ✓
Guard double montage ✓
Cache-bust sur reimport pour remount fonctionnel ✓
CSS scopé en preview ✓
Mobile corrigé ✓


Ce qui reste ouvert / points de vigilance

renderer.dispose() — appelé dans le cleanup mais non confirmé que Renderer de Basilica l'implémente. Si des WebGL contexts leakent après plusieurs remounts, c'est là que ça se passe. Vérifier que Renderer a bien une méthode dispose() qui appelle renderer.dispose() de Three.js et détache le canvas.
router.dispose() — idem, InteractionRouter doit nettoyer ses event listeners (pointermove, click, keydown). À vérifier.
Hero preview vs app complète — le guard activeInstance dans le loader empêche le double montage. Mais si le hero preview est encore en cours de chargement async au moment où l'utilisateur clique sur l'app, il peut y avoir une race condition. Un flag mounting pourrait sécuriser ça.
Autres apps à venir — le pattern est établi : créer apps/<cat>/<app>/, y mettre un app.js avec initXxx(container, context), brancher dans app-routes.js et hero-previews.js.
src/apps/basilica-core/index.js — ce fichier existe dans l'architecture initiale mais son rôle exact par rapport au loader app.js est à reconfirmer à la reprise. Il exposait mount(container, context) pour le router. Vérifier qu'il appelle bien le loader et non une ancienne version.