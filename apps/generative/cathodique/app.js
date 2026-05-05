// src/apps/generative/cathodique/app.js
const HTML_URL = '/apps/generative/cathodique/index.html'

export async function initGenerativeCathodique(container) {
  container.innerHTML = ''
  
  // 1. CONTENEUR ISOLÉ (CSS local)
const appRoot = document.createElement('div')
appRoot.id = 'cathodique-root'
appRoot.style.cssText = `
  all: initial;
  display: block;
  width: 100%; 
  height: 100%; 
  position: relative; 
  background: #000;
  contain: style layout;
  isolation: isolate;
  overflow: hidden; /* ← AJOUT */
  z-index: 1; /* ← AJOUT */
`
container.appendChild(appRoot)

  try {
    const response = await fetch(HTML_URL)
    const htmlText = await response.text()
    const doc = new DOMParser().parseFromString(htmlText, 'text/html')

    // 2. CSS LOCAL dans appRoot (pas head !)
    const style = document.createElement('style')
    style.textContent = Array.from(doc.querySelectorAll('style'))
      .map(s => s.textContent)
      .join('\n')
      // Force isolation
      .replace(/cursor:/g, 'cursor: default !important')
      .replace(/button,/g, '#cathodique-root button,')
      .replace(/input,/g, '#cathodique-root input,')
      .replace(/label,/g, '#cathodique-root label,')
      .replace(/h1,/g, '#cathodique-root h1,')
    appRoot.appendChild(style)

    // 3. HTML dans appRoot
    const bodyClone = doc.body.cloneNode(true)
    bodyClone.querySelectorAll('script').forEach(s => s.remove())
    appRoot.appendChild(bodyClone)

    // 4. Script avec refs correctes
    const scripts = Array.from(doc.querySelectorAll('script'))
    scripts.forEach(scriptEl => {
      const code = scriptEl.textContent?.trim()
      if (!code) return

      const patchedCode = code
        .replace(/document\.getElementById\s*\(\s*['"]([^'"]+)['"]\s*\)/g, 
          (m, id) => `document.querySelector('#cathodique-root #${id}')`
        )
        .replace(/window\.innerWidth/g, "document.querySelector('#cathodique-root').clientWidth")
        .replace(/window\.innerHeight/g, "document.querySelector('#cathodique-root').clientHeight")
        .replace(/window\.addEventListener\s*\(['"]resize['"]/g, 
          "document.querySelector('#cathodique-root').addEventListener('resize'")

      try {
        new Function(patchedCode)()
        console.log('[cathodique] ✅ Script animé')
      } catch(e) {
        console.error('[cathodique] script:', e)
      }
    })

    // 5. Resize handler
    const resizeHandler = () => {
      const canvas = appRoot.querySelector('#artCanvas')
      if (canvas) {
        const rect = appRoot.getBoundingClientRect()
        canvas.width = rect.width * window.devicePixelRatio
        canvas.height = rect.height * window.devicePixelRatio
        canvas.style.width = rect.width + 'px'
        canvas.style.height = rect.height + 'px'
      }
    }
    window.addEventListener('resize', resizeHandler)
    requestAnimationFrame(resizeHandler)

    console.log('[cathodique] 🎨 Anim + CSS isolé')

    return () => {
      window.removeEventListener('resize', resizeHandler)
      container.innerHTML = ''
      console.log('[cathodique] Cleanup OK')
    }

  } catch(err) {
    appRoot.innerHTML = `<div style="padding:4rem;color:#f00;">${err}</div>`
    return () => container.innerHTML = ''
  }
}