import Watcher from '../Watcher.js'

export default function compileTextNode(node, vm) {
  const key = node.textContent.match(/{{(.*)}}/)[1].trim()
  function cb() {
    const value = vm[key]
    node.textContent =
      typeof value === 'object' ? JSON.stringify(value) : String(value)
  }
  new Watcher(cb)
}
