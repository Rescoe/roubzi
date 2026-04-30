// vite.config.js
// Configuration multi-page pour le portfolio artistique modulaire.
// Pour ajouter une nouvelle app :
//   1. Créer le dossier : apps/<categorie>/<nom-app>/
//   2. Y placer index.html, main.js, style.css
//   3. Ajouter une entrée dans rollupOptions.input ci-dessous
//      ex : 'apps-3d-app3': resolve(__dirname, 'apps/3d/app3/index.html')
//   4. Référencer l'app dans src/data/portfolio-data.js (appRegistry)

import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // Permet aux apps d'importer depuis node_modules partagé à la racine
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        // ── Page principale ──────────────────────────────────────
        main: resolve(__dirname, 'index.html'),

        // ── Apps 3D ─────────────────────────────────────────────
        '3d-app1': resolve(__dirname, 'apps/generative/basilica-core/index.html'),
        //'3d-app2': resolve(__dirname, 'apps/3d/app2/index.html'),

        // ── Apps Génératif ───────────────────────────────────────
        //'generative-app1': resolve(__dirname, 'apps/generative/app1/index.html'),
        //'generative-app2': resolve(__dirname, 'apps/generative/app2/index.html'),

        // ── Apps Phygital ────────────────────────────────────────
        //'phygital-app1': resolve(__dirname, 'apps/phygital/app1/index.html'),
        //'phygital-app2': resolve(__dirname, 'apps/phygital/app2/index.html'),
      },
    },
  },
  // Serveur de dev
  server: {
    port: 5173,
    open: true,
  },
})
