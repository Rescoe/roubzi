// src/apps/basilica-core/app.js

const STYLE_ID = 'basilica-core-inline-style'
const HTML_URL = '/apps/generative/basilica-core/index.html'

function scopeCss(cssText, scopeSelector, isPreview = false) {
  let scoped = cssText
    .replace(/\bhtml\b/g, scopeSelector)
    .replace(/\bbody\b/g, scopeSelector)
    .replace(/(^|})\s*canvas\s*\{/g, `$1 ${scopeSelector} canvas {`)
    .replace(/(^|})\s*#canvas-container\s*\{/g, `$1 ${scopeSelector} #canvas-container {`)
    .replace(/(^|})\s*#ui-overlay\s*\{/g, `$1 ${scopeSelector} #ui-overlay {`)
    .replace(/(^|})\s*#ui-keyboard\s*\{/g, `$1 ${scopeSelector} #ui-keyboard {`)
    .replace(/(^|})\s*#ui-event\s*\{/g, `$1 ${scopeSelector} #ui-event {`)
    .replace(/(^|})\s*#loading\s*\{/g, `$1 ${scopeSelector} #loading {`)

  const extraCss = isPreview
    ? `
${scopeSelector} {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #000;
}

${scopeSelector} #canvas-container {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
}

${scopeSelector} #loading,
${scopeSelector} #ui-keyboard,
${scopeSelector} #ui-event {
  display: none !important;
}

${scopeSelector} #ui-overlay {
  position: absolute !important;
  top: 12px !important;
  left: 12px !important;
  transform: scale(0.82);
  transform-origin: top left;
  opacity: 0.8;
  pointer-events: none !important;
}

${scopeSelector} #ui-title {
  margin-bottom: 8px !important;
}

${scopeSelector} #ui-phase {
  margin-top: 10px !important;
}

${scopeSelector} .stat-row {
  font-size: 9px !important;
}

${scopeSelector} #canvas-container,
${scopeSelector} canvas {
  display: block;
}

${scopeSelector} * {
  max-width: 100%;
}
`
    : `
${scopeSelector} {
  position: relative;
  width: 100%;
}
`

  return `${scoped}\n${extraCss}`
}

function extractInlineStyles(doc) {
  return Array.from(doc.querySelectorAll('style'))
    .map((node) => node.textContent || '')
    .join('\n')
}

function injectScopedStyleFromDocument(doc, isPreview) {
  const css = extractInlineStyles(doc)
  if (!css.trim()) return null

  const prev = document.getElementById(STYLE_ID)
  if (prev) prev.remove()

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = scopeCss(css, '.basilica-embed-root', isPreview)
  document.head.appendChild(style)
  return style
}

function getBodyHtmlWithoutScripts(doc) {
  const bodyClone = doc.body.cloneNode(true)
  bodyClone.querySelectorAll('script').forEach((s) => s.remove())
  return bodyClone.innerHTML
}

function markRoot(root, isPreview) {
  root.dataset.basilicaEmbedded = 'true'
  if (isPreview) root.dataset.basilicaPreview = 'true'
  return root
}

function applyPreviewDomTweaks(root) {
  const loading = root.querySelector('#loading')
  const keyboard = root.querySelector('#ui-keyboard')
  const eventBox = root.querySelector('#ui-event')

  if (loading) loading.remove()
  if (keyboard) keyboard.remove()
  if (eventBox) eventBox.remove()
}

let activeInstance = null

export async function initBasilicaCore(container, context = {}) {
  if (activeInstance) {
    try {
      activeInstance()
    } catch (_) {}
    activeInstance = null
  }

  const isPreview = !!context.preview

  container.innerHTML = ''
  container.style.cssText = isPreview
    ? 'position:relative;width:100%;height:100%;overflow:hidden;'
    : 'position:relative;width:100%;'

  const response = await fetch(HTML_URL, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Unable to load BASILICA HTML: ${response.status}`)
  }

  const htmlText = await response.text()
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlText, 'text/html')

  const styleEl = injectScopedStyleFromDocument(doc, isPreview)

  container.innerHTML = `
    <div class="basilica-embed-root${isPreview ? ' is-preview' : ''}">
      ${getBodyHtmlWithoutScripts(doc)}
    </div>
  `

  const root = markRoot(container.querySelector('.basilica-embed-root'), isPreview)
  if (!root) {
    throw new Error('BASILICA root injection failed')
  }

  if (isPreview) {
    applyPreviewDomTweaks(root)
  }

  let moduleCleanup = null

  try {
    const mod = await import('./src/main.js')

    if (typeof mod.bootBasilica === 'function') {
      moduleCleanup = await mod.bootBasilica(root, context)
    } else if (typeof mod.default === 'function') {
      moduleCleanup = await mod.default(root, context)
    } else {
      console.warn('[BASILICA] src/main.js has no boot export, loaded for side effects only.')
    }
  } catch (err) {
    console.error('[BASILICA] Failed to load main module', err)
    throw err
  }

  function unmount() {
    activeInstance = null

    if (typeof moduleCleanup === 'function') {
      try {
        moduleCleanup()
      } catch (_) {}
    }

    if (styleEl?.parentNode) {
      styleEl.parentNode.removeChild(styleEl)
    }

    container.innerHTML = ''
    container.style.cssText = ''
  }

  activeInstance = unmount
  return unmount
}