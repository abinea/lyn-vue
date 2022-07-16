export default function Dep() {
  this.watchers = []
}

// 实例化 Watcher 时会赋值 Dep.target = Watcher 实例
Dep.target = null
const targetStack = []

Dep.prototype.depend = function () {
  // 防止 当前 Watcher 实例被重复收集
  if (this.watchers.includes(Dep.target)) return
  // 收集 watcher 实例
  this.watchers.push(Dep.target)
}

Dep.prototype.notify = function () {
  for (const watcher of this.watchers) {
    watcher.update()
  }
}

export function pushTarget(target) {
  targetStack.push(target)
  Dep.target = target
}

export function popTarget() {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
