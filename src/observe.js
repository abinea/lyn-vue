import Observer from './observer.js'

export default function observe(value) {
  if (typeof value !== 'object') return // string类型爆栈
  // 说明value已经是响应式
  if (value.__ob__) return value.__ob__
  const ob = new Observer(value)
  return ob
}
