import Watcher from './watcher.js'

/**
 * 初始化 computed 配置项
 * 为每个计算属性实例化一个 Watcher ，并将计算属性代理到 Vue 实例上
 * 结合 watcher.dirty 和 watcher.evaluate 实现 computed 缓存
 * @param {*} vm
 */
export default function initComputed(vm) {
  // 获取配置项
  const computed = vm.$options.computed
  // 创建 watcher
  const watcher = (vm._watcher = Object.create(null))
  for (const key in computed) {
    watcher[key] = new Watcher(computed[key], { lazy: true }, vm)
    // 将 computed 属性代理到 Vue 实例上
    defineComputed(vm, key)
  }
}

/**
 * 将 computed 属性代理到 Vue 实例上，结合 watcher 实现 computed 属性缓存
 * @param {*} vm
 * @param {*} key
 */
function defineComputed(vm, key) {
  const descriptor = {
    get: function () {
      const watcher = vm._watcher[key]
      if (watcher.dirty) {
        // 说明当前 computed 回调函数在本次渲染周期没有执行
        // 执行 evaluate,通知 watcher 执行 computed 回调函数
        watcher.evaluate()
      }
      return watcher.value
    },
    set: function () {
      console.log('no setter')
    },
  }
  Object.defineProperty(vm, key, descriptor)
}
