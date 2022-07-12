import observe from './observe.js'
import Dep from './Dep.js'

export default function defineReactive(target, key, val) {
  const childOb = observe(val) // 深层响应式处理
  // 响应式原理
  const dep = new Dep()

  Object.defineProperty(target, key, {
    // getter 依赖收集
    get() {
      if (Dep.target) {
        dep.depend()
        // 如果存在 childDep，也一起收集
        if (childOb) {
          childOb.dep.depend()
        }
      }
      console.log(`getter key ${key} = ${val}`)
      return val
    },
    // setter 通知更新
    set(newVal) {
      console.log(`settet key ${key} = ${newVal}`)
      if (newVal === val) return
      val = newVal
      observe(val) // newVal作深层响应式处理
      dep.notify()
    },
  })
}
