import defineReactive from './defineReactive.js'
import Dep from './Dep.js'
import observe from './observe.js'
import protoArgument from './protoArgument.js'

export default function Observer(value) {
  Object.defineProperty(value, '__ob__', {
    value: this,
    // 防止递归时处理
    // 页面显示时不想显示__ob__属性
    enumerable: false,
    writable: true,
    configurable: true,
  })
  value.__ob__.dep = new Dep()
  if (Array.isArray(value)) {
    // 数组响应式
    protoArgument(value)
    this.observeArray(value)
  } else {
    // 对象响应式
    this.walk(value)
  }
}

Observer.prototype.walk = function (obj) {
  for (const key in obj) {
    defineReactive(obj, key, obj[key])
  }
}

// 处理数组中元素为非原始值的情况
Observer.prototype.observeArray = function (arr) {
  for (const item of arr) {
    observe(item)
  }
}
