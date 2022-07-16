import queueWatcher from './asyncUpdateQueue.js'
import { pushTarget, popTarget } from './dep.js'

// 标识 watcher 的 id，用来排序
let uid = 0

export default function Watcher(cb, options = {}, vm = null) {
  // cb 负责更新DOM节点
  this._cb = cb
  // 配置项
  this.options = options
  // 如果是非懒执行，直接执行 cb 函数，cb 函数执行的时候会发生 vm.xx 触发 getter
  !options.lazy && this.get()
  this.vm = vm
  // 只有当 dirty 为 true 时才会执行计算函数
  this.dirty = true
  // watcher 中 cb 的执行结果
  this.value = null
}

Watcher.prototype.get = function () {
  pushTarget(this)
  this.value = this._cb.call(this.vm)
  // 重置 Dep.target，防止重复收集
  popTarget()
}

Watcher.prototype.update = function () {
  if (this.options.lazy) {
    // 说明是懒执行
    this.dirty = true
  } else {
    // 将 watcher 放到 watcher 队列
    queueWatcher(this)
  }
}

Watcher.prototype.evaluate = function () {
  // 执行 get，触发计算函数（cb）的执行
  this.get()
  // 将 dirty 置为 false，实现一次刷新周期内 computed 属性 只执行一次，从而实现缓存的效果
  this.dirty = false
}

/**
 * 由书信 watcher 队列的函数，负责执行get
 */
Watcher.prototype.run = function () {
  this.get()
}
