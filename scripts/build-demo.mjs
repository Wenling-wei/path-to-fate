// 把游戏打成单个 HTML（demo/index.html），用于发布成在线 demo。
// React 从 cdnjs 加载，游戏自身的 JS / CSS 全部内联。
import { build } from 'esbuild'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const shim = (global) => ({
  name: 'globals',
  setup(b) {
    b.onResolve({ filter: /^(react|react-dom\/client|react\/jsx-runtime)$/ }, (a) => ({ path: a.path, namespace: 'g' }))
    b.onLoad({ filter: /.*/, namespace: 'g' }, (a) => ({
      loader: 'js',
      contents: a.path === 'react' ? 'module.exports = window.React'
        : a.path === 'react-dom/client' ? 'module.exports = window.ReactDOM'
          : 'const R = window.React; const jsx = (t, p, k) => { const { children, ...rest } = p || {}; if (k !== undefined) rest.key = k; return Array.isArray(children) ? R.createElement(t, rest, ...children) : children === undefined ? R.createElement(t, rest) : R.createElement(t, rest, children) }; module.exports = { jsx, jsxs: jsx, Fragment: R.Fragment }',
    }))
  },
})

const out = await build({
  entryPoints: [join(root, 'src/main.tsx')],
  bundle: true, minify: true, format: 'iife', write: false, jsx: 'automatic',
  loader: { '.css': 'empty' }, plugins: [shim()], target: 'es2020',
})
const js = out.outputFiles[0].text.replace(/<\/script/g, '<\\/script')
const css = readFileSync(join(root, 'src/styles.css'), 'utf8')

const html = `<title>剩下的牌</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${css}
</style>
<div id="root"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>
${js}
</script>
`
mkdirSync(join(root, 'demo'), { recursive: true })
writeFileSync(join(root, 'demo/index.html'), html)
console.log('demo/index.html', (html.length / 1024).toFixed(0) + ' KB')
