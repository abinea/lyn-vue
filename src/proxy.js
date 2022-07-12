export default function proxy(target, sourceKey, key) {
  Object.defineProperty(target, key, {
    get() {
      // vm._data.t
      return target[sourceKey][key]
    },
    set(newVal) {
      target[sourceKey][key] = newVal
    },
  })
}
