// src/apps/generative/cathodique/index.js
export async function mount(container, context = {}) {
  console.log('[cathodique] mount, container:', container)

  container.innerHTML = `
    <div class="app-view" id="cathodique-view">
      <div class="app-view-header wrap">
        <a href="#/" class="app-back-link">← Portfolio</a>
        <div class="app-view-meta">
          <span class="app-view-title">CATHODIQUE</span>
          <span class="app-view-year">2023 · Python→JS · Génératif</span>
        </div>
      </div>
      <div class="app-view-body" id="cathodique-body" style="position:relative;width:100%;height:calc(100vh - 72px);overflow:hidden;background:#000;"></div>
    </div>
  `

  const body = container.querySelector('#cathodique-body') // ✅ querySelector pas getElementById
  let cathodiqueUnmount = null

  import('./app.js')
    .then(mod => {
      cathodiqueUnmount = mod.initGenerativeCathodique(body)
      console.log('[cathodique] app.js chargé')
    })
    .catch(err => {
      console.error('[cathodique] app.js failed:', err)
      body.innerHTML = '<div style="padding:4rem;color:#fff">Erreur chargement cathodique</div>'
    })

  window.scrollTo(0, 0)

// Dans votre index.js existant, modifiez le unmount :
return function unmount() {
  console.log('[cathodique] FULL CLEANUP')
  
  // 1. App cleanup
  if (typeof cathodiqueUnmount === 'function') {
    cathodiqueUnmount()
  }
  
  // 2. CSS cathodique
  const style = document.getElementById('cathodique-styles')
  if (style) style.remove()
  
  // 3. Curseur reset
  document.body.style.cursor = ''
  
  // 4. Conteneur
  container.innerHTML = ''
}
}