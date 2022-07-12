/***
 * 数组响应式
 */

const arrProto = Array.prototype
const arrayMethods = Object.create(arrProto)
// 七个变更数组的方法
const methodsToPatch = [
  'push',
  'pop',
  'unshift',
  'shift',
  'splice',
  'sort',
  'reverse',
]

methodsToPatch.forEach((method) => {
  Object.defineProperty(arrayMethods, method, {
    value: function (...args) {
      const res = arrProto[method].apply(this, args)
      const ob = this.__ob__
      console.log('array reactive')
      let inserted
      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args
          break
        case 'splice':
          // this.arr.splice(idx,deleteNum,add args)
          inserted = args.slice(2)
          break

        default:
          break
      }
      if (inserted) ob.observeArray(inserted)
      // 依赖更新
      ob.dep.notify()
      return res
    },
    configurable: true,
    writable: true,
    enumerable: false,
  })
})

export default function protoArgument(arr) {
  arr.__proto__ = arrayMethods
}
