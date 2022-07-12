import observe from './observe.js'
import proxy from './proxy.js'

export default function initData(vm) {
  const { data } = vm.$options
  let _data = (vm._data = {})
  if (data) {
    _data = vm._data = typeof data === 'function' ? data() : data
  }
  for (let key in _data) {
    proxy(vm, '_data', key)
  }
  observe(vm._data)
}
